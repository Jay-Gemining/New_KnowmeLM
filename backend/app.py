import os
import tempfile
import subprocess
import pysrt
import openai
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Placeholder for OpenAI API key
api_key = os.environ.get("OPENAI_API_KEY")
base_url = os.environ.get("OPENAI_BASE_URL")
if api_key:
    openai.api_key = api_key
    openai.api_base = base_url

def summarize_text_with_ai(text):
    """
    Placeholder function to simulate AI summarization.
    Returns the first 500 characters of the text or a fixed message.
    """
    if not api_key:
        return "OpenAI API key not configured. Returning placeholder summary."

    # In a real implementation, you would call the OpenAI API here.
    # For example:
    # response = openai.Completion.create(
    # engine="text-davinci-003",
    # prompt=f"Summarize the following text:\n\n{text}",
    # max_tokens=150
    # )
    # return response.choices[0].text.strip()

    # if len(text) > 500:
    #     return text[:500] + "..."
    return text

@app.route('/summarize-youtube', methods=['POST'])
def summarize_youtube():
    data = request.get_json()
    youtube_url = data.get('youtube_url')

    if not youtube_url:
        return jsonify({'error': 'youtube_url is required'}), 400

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            # Construct and run the yt-dlp command
            # We ask for .vtt specifically with --convert-subs srt as yt-dlp handles conversion
            # and .srt is easier to parse with pysrt.
            # However, direct .vtt parsing might be simpler if pysrt has issues or for wider compatibility.
            # For now, let's stick to the original plan of auto-subs and find whatever is downloaded.
            cmd = [
                'yt-dlp',
                '--write-auto-sub',
                '--sub-lang', 'en,*', # English first, then any other auto-sub
                '--skip-download',    # Don't download the video itself
                '-o', f'{tmpdir}/%(id)s.%(ext)s', # Output to temp dir
                youtube_url
            ]
            subprocess.run(cmd, check=True, capture_output=True, text=True)

            subtitle_text = None
            # Search for downloaded subtitle files (.vtt or .srt)
            for filename in os.listdir(tmpdir):
                if filename.endswith(('.vtt', '.srt')):
                    filepath = os.path.join(tmpdir, filename)
                    if filename.endswith('.srt'):
                        subs = pysrt.open(filepath)
                        subtitle_text = " ".join([sub.text for sub in subs])
                    elif filename.endswith('.vtt'): # Basic VTT parsing
                        with open(filepath, 'r', encoding='utf-8') as f:
                            lines = f.readlines()

                        text_lines = []
                        for line in lines:
                            line = line.strip()
                            # Skip VTT metadata, timestamps, and empty lines
                            if not line or \
                               line.startswith('WEBVTT') or \
                               line.startswith('Kind:') or \
                               line.startswith('Language:') or \
                               '-->' in line or \
                               line.startswith('NOTE'):
                                continue
                            # Remove HTML-like tags
                            import re
                            line = re.sub(r'<[^>]+>', '', line)
                            text_lines.append(line)
                        subtitle_text = " ".join(text_lines)
                    break # Found and processed a subtitle file

            if not subtitle_text:
                return jsonify({'error': 'Could not find or parse subtitles'}), 404

            summary = summarize_text_with_ai(subtitle_text)
            return jsonify({'summary': summary})

        except subprocess.CalledProcessError as e:
            # Log the error for debugging
            print(f"yt-dlp error: {e.stderr}")
            return jsonify({'error': 'Failed to download subtitles', 'details': e.stderr}), 500
        except Exception as e:
            # Log the error for debugging
            print(f"An unexpected error occurred: {str(e)}")
            return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

@app.route('/summarize-text-file', methods=['POST'])
def summarize_text_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not file.filename.endswith('.txt'):
        return jsonify({'error': 'Invalid file type, please upload a .txt file'}), 400

    try:
        text_content = file.read().decode('utf-8')
        if not text_content.strip():
            return jsonify({'error': 'File is empty or contains only whitespace'}), 400

        summary = summarize_text_with_ai(text_content)
        return jsonify({'summary': summary})
    except Exception as e:
        # Log the error for debugging
        print(f"Error processing text file: {str(e)}")
        return jsonify({'error': 'Failed to process text file', 'details': str(e)}), 500

@app.route('/')
def hello_world():
    return 'Hello, World! Backend is running.'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
