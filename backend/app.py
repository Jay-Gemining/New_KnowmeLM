import os
import tempfile
import subprocess
import pysrt
from openai import OpenAI
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from PyPDF2 import PdfReader # Added for PDF processing
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

# Removed old summarize_text_with_ai function

def generate_detailed_summary_with_ai(text_content):
    if not api_key:
        return "Error: OpenAI API key not configured. Cannot generate detailed summary."

    client = OpenAI(api_key=api_key, base_url=base_url)

    prompt = f"""Please provide a detailed and comprehensive summary of the following text from the source titled .
    The summary should capture the main points, key arguments, and any significant conclusions or information presented.
    Organize the summary logically. Aim for a thorough representation of the original content.

    Original Text:
    ---
    {text_content}
    ---

    Detailed Summary:"""

    messages = [
        {
            "role": "system",
            "content": "You are an expert summarizer. Your task is to generate a detailed and comprehensive summary of the provided text, maintaining the core message and important details."
        },
        {
            "role": "user",
            "content": prompt+"always response in Chinese"
        }
    ]

    try:
        response = client.chat.completions.create(
            model="Pro/deepseek-ai/DeepSeek-R1-0120", # Or your preferred model
            messages=messages,
            # temperature=0.5,
            # max_tokens=1024
        )
        detailed_summary = response.choices[0].message.content.strip()
        if not detailed_summary or len(detailed_summary) < 50: # Arbitrary length check
            return f"LLM returned a very short or empty summary for . Original text could not be adequately summarized."
        return detailed_summary
    except Exception as e:
        print(f"Error calling OpenAI API for detailed summary of '': {e}")
        return f"Error generating detailed summary for : {str(e)}. Original text could not be summarized by the LLM."

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

            # summary = summarize_text_with_ai(subtitle_text) # OLD
            detailed_summary = generate_detailed_summary_with_ai(subtitle_text) # NEW
            return jsonify({'summary': detailed_summary,'original_content': subtitle_text})

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

    allowed_extensions = ('.txt', '.pdf', '.md')
    file_extension = os.path.splitext(file.filename.lower())[1]

    if file_extension not in allowed_extensions:
        return jsonify({'error': f'Invalid file type, please upload a {", ".join(allowed_extensions)} file'}), 400

    text_content = ""
    try:
        if file_extension == '.pdf':
            try:
                reader = PdfReader(file.stream) # Use file.stream for FileStorage object
                for page in reader.pages:
                    text_content += page.extract_text() or "" # Add null check for empty pages
                if not text_content.strip():
                    return jsonify({'error': 'Could not extract text from PDF or PDF is empty'}), 400
            except Exception as e:
                print(f"Error parsing PDF {file.filename}: {str(e)}")
                return jsonify({'error': f'Failed to parse PDF file: {str(e)}'}), 500
        elif file_extension in ['.txt', '.md']:
            text_content = file.read().decode('utf-8')
            if not text_content.strip():
                return jsonify({'error': 'File is empty or contains only whitespace'}), 400

        # Ensure text_content is not empty one last time before summarizing,
        # although individual handlers should have caught empty content.
        if not text_content.strip():
             return jsonify({'error': 'Extracted text content is empty.'}), 400

        # summary = summarize_text_with_ai(text_content) # OLD
        detailed_summary = generate_detailed_summary_with_ai(text_content) # NEW
        return jsonify({'summary': detailed_summary, 'original_content': text_content})
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

    print(data)
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
            model="Pro/deepseek-ai/DeepSeek-R1-0120",
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
    prompt = f"""Generate a complete HTML document from the following text. The HTML should be well-structured, easy to read, and visually presentable for a report. Use the title '{report_title}' for the document <title> tag and as a main heading (e.g., <h1>). Here is the content: {report_content},设计要求：
1. 使用 Bento Grid 布局：创建一个由不同大小卡片组成的网格，每个卡片包含特定类别的信息，整体布局要紧凑但不拥挤
2. 卡片设计：所有卡片应有明显圆角（20px 边框半径），白色/浅灰背景，细微的阴影效果，悬停时有轻微上浮动效果
3. 色彩方案：使用简约配色方案，主要为白色/浅灰色背景，搭配渐变色作为强调色（可指定具体颜色，如从浅紫 #C084FC 到深紫 #7E22CE）
4. 排版层次：
- 大号粗体数字/标题：使用渐变色强调关键数据点和主要标题
- 中等大小标题：用于卡片标题，清晰表明内容类别
- 小号文本：用灰色呈现支持性描述文字
5. 内容组织：
- 顶部行：主要公告、产品特色、性能指标或主要卖点
- 中间行：产品规格、技术细节、功能特性
- 底部行：使用指南和结论/行动号召
6. 视觉元素：
- 使用简单图标表示各项特性
- 进度条或图表展示比较数据
- 网格和卡片布局创造视觉节奏
- 标签以小胶囊形式展示分类信息
7. 响应式设计：页面应能适应不同屏幕尺寸，在移动设备上保持良好的可读性
设计风格参考：
- 整体设计风格类似苹果官网产品规格页面
- 使用大量留白和简洁的视觉元素
- 强调数字和关键特性，减少冗长文字
- 使用渐变色突出重要数据
- 卡片间有适当间距，创造清晰的视觉分隔
##输出规范:
    只输出代码内容,不要输出其他任何文字信息。在输出代码内容时，错误输出格式: ```html XXX(html代码) ```   正确输出：XXX(html代码)
"""

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
            model="Pro/deepseek-ai/DeepSeek-R1-0120", # Specify the model to use.
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
