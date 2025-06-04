import os
import tempfile
import subprocess
import pysrt
from openai import OpenAI
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Placeholder for OpenAI API key
api_key = os.environ.get("OPENAI_API_KEY")
base_url = os.environ.get("OPENAI_BASE_URL")
youtube_cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE") # Old: Path to YouTube cookies file
youtube_browser_for_cookies = os.environ.get("YOUTUBE_BROWSER_FOR_COOKIES") # New: Browser to load cookies from
print(api_key)
print(base_url)
if api_key:
    api_key = api_key
    api_base = base_url

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
                '--sub-lang', 'en', # Changed from 'en,*' to 'en' to fix regex error
                '--skip-download',    # Don't download the video itself
                '-o', f'{tmpdir}/%(id)s.%(ext)s', # Output to temp dir
                youtube_url
            ]
            print(f"YouTube Cookies File Path: {youtube_cookies_file}")
            if youtube_browser_for_cookies: # New method: load cookies from browser
                cmd.extend(['--cookies-from-browser', youtube_browser_for_cookies])
            print(f"yt-dlp command: {cmd}")
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

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    source_summaries = data.get('summaries') # Expecting a list of strings

    if not user_message:
        return jsonify({'error': 'Message is required'}), 400

    # source_summaries can be an empty list, which is acceptable.
    # If it's None, it means the key wasn't provided, which might be an issue depending on client.
    # For now, let's treat None as "no summaries provided".
    if source_summaries is None:
        # Default to empty list if not provided, to simplify placeholder logic
        source_summaries = []

    # Concatenate Summaries (if any)
    context_text = ""
    if source_summaries:
        context_text = "\n\n---\n\n".join(source_summaries)
        # print(f"Context being used for chat: {context_text[:500]}...") # For debugging

    # Actual OpenAI API Call
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # This check is redundant if OPENAI_API_KEY at the top is used, but good for safety
        # Or if the global openai.api_key wasn't set for some reason.
        return jsonify({'error': 'OpenAI API key is not configured on the server.'}), 500

    # openai.api_key = api_key # This should already be set globally if OPENAI_API_KEY is defined

    if not source_summaries: # Or if context_text is empty
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. You are being asked a question without any specific source material provided for context. Answer generally, but acknowledge that no specific sources were given for this query. Do not use any external knowledge beyond very general information if absolutely necessary, and prioritize stating that context is missing."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
    else:
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. Your task is to answer questions based *only* on the provided source material. If the answer cannot be found in the sources, state that clearly. Do not use any external knowledge. Be concise and directly answer the question."
            },
            {
                "role": "user",
                "content": f"Here is the source material:\n\nBEGIN SOURCE MATERIAL\n{context_text}\nEND SOURCE MATERIAL\n\nMy question is: {user_message}"
            }
        ]

    try:
        # Ensure openai.api_key is set before this call, ideally once when app starts
        # if not api_key: # Final check if it wasn't set globally
        #      api_key = api_key
        client = OpenAI(
            api_key = api_key,
            base_url = base_url
        )
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
            messages=messages,  
            # temperature=0.2,
            # max_tokens=1000
        )
        ai_response_text = response.choices[0].message.content
    except Exception as e:
        print(f"Error calling OpenAI API: {e}") # Log to server console
        return jsonify({'error': f'Error communicating with OpenAI: {str(e)}'}), 500

    return jsonify({'reply': ai_response_text})

@app.route('/generate-html-report', methods=['POST'])
def generate_html_report():
    """
    Generates a complete HTML document using an LLM based on provided summary text and an optional title.
    Inputs from JSON request:
        - 'summary_text' (str): The main content to be formatted into HTML. (Required)
        - 'title' (str, optional): The title for the HTML document and main heading. Defaults to "Generated Report".
    Outputs:
        - JSON response with 'html_content' (str) containing the full HTML document.
        - Error JSON if 'summary_text' is missing, API key is not configured, or LLM communication fails.
    """
    data = request.get_json()
    summary_text = data.get('summary_text')
    title = data.get('title') # Optional

    if not summary_text:
        return jsonify({'error': 'summary_text is required'}), 400

    # Check for API Key (global variables api_key and base_url are used)
    if not api_key:
        return jsonify({'error': 'OpenAI API key not configured on the server.'}), 500

    report_title = title if title else "Generated Report"
    report_content = summary_text

    # Construct the detailed prompt for the LLM.
    # This prompt asks the LLM to generate a full HTML document,
    # using the provided title and summary content, and to apply some basic styling.
    prompt = f"Generate a complete HTML document from the following text. The HTML should be well-structured, easy to read, and visually presentable for a report. Use the title '{report_title}' for the document <title> tag and as a main heading (e.g., <h1>). Here is the content: {report_content}"

    # Prepare messages for the LLM API call.
    # The "system" message sets the role and expectations for the LLM.
    # The "user" message provides the specific prompt with the content.
    messages = [
        {
            "role": "system",
            "content": "You are an expert HTML generator. Please create a valid and well-formatted HTML document based on the user's request. Ensure the output is a full HTML document starting with <!DOCTYPE html> and includes html, head, and body tags. Apply simple inline CSS for a clean, professional look, focusing on readability."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        # Initialize the OpenAI client with the API key and base URL.
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
        # Make the API call to the LLM.
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-R1-0528-Qwen3-8B", # Specify the model to use.
            messages=messages, # Pass the prepared messages.
            # Temperature and max_tokens can be adjusted for different response styles or lengths.
            # temperature=0.7,
            # max_tokens=2048,
        )
        # Extract the generated HTML string from the LLM's response.
        generated_html_string = response.choices[0].message.content

        # Basic validation: Check if the response starts with <!DOCTYPE html> (case-insensitive).
        # This is a simple check to ensure the LLM attempted to return a full HTML document.
        if not generated_html_string.strip().lower().startswith("<!doctype html"):
            # Log a snippet of the response if it doesn't look like valid HTML.
            print(f"LLM did not return a valid HTML document. Response: {generated_html_string[:200]}...")
            # Return an error if the structure is not as expected.
            # A more robust solution might involve trying to parse/fix the HTML,
            # but the prompt explicitly asks for a complete document.
            return jsonify({'error': 'LLM did not return a valid HTML document structure. Received: ' + generated_html_string[:100] + "..."}), 500

        # Return the generated HTML content.
        return jsonify({'html_content': generated_html_string})

    except Exception as e:
        # Log any errors during the LLM API call.
        print(f"Error calling LLM for HTML generation: {e}")
        return jsonify({'error': f'Error communicating with LLM: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
