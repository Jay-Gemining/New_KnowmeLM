from flask import Blueprint, request, jsonify
import openai # For OpenAIError and client instantiation in chat/report routes
import os   # For OPENAI_BASE_URL in chat/report routes
import tempfile # For summarize_youtube_route (if kept)
import subprocess # For summarize_youtube_route (if kept)
import pysrt # For summarize_youtube_route (if kept)
from PyPDF2 import PdfReader # For summarize_text_file_route
import re # For subtitle cleaning

# Import utility functions from the utils directory
from utils.extractor import extract_text_from_url
from utils.summarizer import generate_detailed_summary_with_ai
# config.py is imported in app.py, and it sets up openai.api_key globally

api_bp = Blueprint('api_bp', __name__)

# --- Route for /summarize-text-file (Moved from app.py) ---
@api_bp.route('/summarize-text-file', methods=['POST'])
def summarize_text_file_route():
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
    doc_name = file.filename
    try:
        if file_extension == '.pdf':
            try:
                reader = PdfReader(file.stream)
                for page in reader.pages:
                    text_content += page.extract_text() or ""
                if not text_content.strip():
                    return jsonify({'error': 'Could not extract text from PDF or PDF is empty'}), 400
            except Exception as e:
                return jsonify({'error': f'Failed to parse PDF file: {str(e)}'}), 500
        elif file_extension in ['.txt', '.md']:
            text_content = file.read().decode('utf-8')
            if not text_content.strip():
                return jsonify({'error': 'File is empty or contains only whitespace'}), 400

        if not text_content.strip():
             return jsonify({'error': 'Extracted text content is empty.'}), 400

        summary = generate_detailed_summary_with_ai(text_content, document_name=doc_name)
        if summary.startswith("Error:"):
             return jsonify({"error": summary}), 400
        return jsonify({'summary': summary, 'original_content': text_content, 'name': doc_name, 'type': 'file'})

    except Exception as e:
        return jsonify({'error': f'Failed to process text file: {str(e)}'}), 500


# --- Route for /summarize-youtube (Moved from app.py) ---
# This route is kept for now as per instructions.
@api_bp.route('/summarize-youtube', methods=['POST'])
def summarize_youtube_route():
    data = request.get_json()
    youtube_url = data.get('youtube_url')

    if not youtube_url:
        return jsonify({'error': 'youtube_url is required'}), 400

    youtube_cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE")
    youtube_browser_for_cookies = os.environ.get("YOUTUBE_BROWSER_FOR_COOKIES")

    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            cmd = [
                'yt-dlp', '--write-auto-sub', '--sub-lang', 'en',
                '--skip-download', '-o', f'{tmpdir}/%(id)s.%(ext)s', youtube_url
            ]
            if youtube_browser_for_cookies:
                cmd.extend(['--cookies-from-browser', youtube_browser_for_cookies])

            subprocess.run(cmd, check=True, capture_output=True, text=True)

            subtitle_text = None
            for filename in os.listdir(tmpdir):
                if filename.endswith(('.vtt', '.srt')):
                    filepath = os.path.join(tmpdir, filename)
                    if filename.endswith('.srt'):
                        subs = pysrt.open(filepath)
                        subtitle_text = " ".join([sub.text for sub in subs])
                    elif filename.endswith('.vtt'):
                        with open(filepath, 'r', encoding='utf-8') as f:
                            lines = f.readlines()
                        text_lines = []
                        for line_content in lines:
                            line_content = line_content.strip()
                            if not line_content or line_content.startswith('WEBVTT') or \
                               line_content.startswith('Kind:') or line_content.startswith('Language:') or \
                               '-->' in line_content or line_content.startswith('NOTE'):
                                continue
                            # HTML tags are already removed by the VTT parser, but good to have a specific re.sub for it if needed elsewhere.
                            line_content = re.sub(r'<[^>]+>', '', line_content) # Remove HTML-like tags e.g. <c.colorE5E5E5>
                            text_lines.append(line_content)
                        subtitle_text = " ".join(text_lines)
                    break

            if not subtitle_text: # This check is before cleaning
                # Log files in tmpdir if no subtitles were found
                files_in_tmpdir = os.listdir(tmpdir)
                print(f"No subtitles found or parsed. Files in tmpdir: {files_in_tmpdir}")
                return jsonify({'error': 'Could not find or parse subtitles initially', 'tmpdir_contents': files_in_tmpdir}), 404

            # --- Subtitle Cleaning Step ---
            # Remove common boilerplate, disclaimers, URLs, and other non-speech text.
            # Order matters: more specific patterns first, then more general ones.

            # 1. Lines starting with "Subtitles by", "Transcript by", etc.
            subtitle_text = re.sub(r"^(Subtitles by|Subtitles generated by|Transcript by|Captions by).*?(\n|$)", "", subtitle_text, flags=re.IGNORECASE | re.MULTILINE)

            # 2. Common disclaimers or promotional text
            subtitle_text = re.sub(r"^(Visit our website:|Support us on Patreon:|Check out our merch:|Follow us on).*?(\n|$)", "", subtitle_text, flags=re.IGNORECASE | re.MULTILINE)
            subtitle_text = re.sub(r"^\s*Please consider subscribing.*?\n", "", subtitle_text, flags=re.IGNORECASE | re.MULTILINE)
            subtitle_text = re.sub(r"^\s*Like and subscribe for more content.*?\n", "", subtitle_text, flags=re.IGNORECASE | re.MULTILINE)

            # 3. URLs (general pattern, try to be careful not to remove valid speech that might contain a URL)
            # This pattern targets standalone URLs or URLs at the end of a line, common in promotion.
            subtitle_text = re.sub(r"(\b(https?|ftp|file):\/\/[-\w+&@#\/%?=~|!:,.;]*[-\w+&@#\/%=~|])", "", subtitle_text, flags=re.IGNORECASE)
            subtitle_text = re.sub(r"(\bwww\.[-\w+&@#\/%?=~|!:,.;]*[-\w+&@#\/%=~|])", "", subtitle_text, flags=re.IGNORECASE)


            # 4. Lines that are purely timestamps or sequence numbers (if not already handled by parser)
            # VTT/SRT parsers usually handle these, but as a fallback:
            subtitle_text = re.sub(r"^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\s*\n", "", subtitle_text, flags=re.MULTILINE) # SRT
            subtitle_text = re.sub(r"^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\s*\n", "", subtitle_text, flags=re.MULTILINE) # VTT Timestamps
            subtitle_text = re.sub(r"^\s*\d+\s*$", "", subtitle_text, flags=re.MULTILINE) # Line with only sequence number

            # 5. Lines with a high percentage of uppercase characters (potential headers/notes)
            # This is tricky; apply cautiously. Remove if line is short and mostly uppercase.
            lines = subtitle_text.split('\n')
            cleaned_lines = []
            for line in lines:
                if len(line.strip()) > 0: # Ensure line is not empty after stripping
                    if len(line.strip()) < 50 and (sum(1 for c in line if c.isupper()) / len(line.strip()) > 0.7 if len(line.strip()) > 0 else False):
                        # Potentially a short, mostly uppercase line - skip it
                        continue
                cleaned_lines.append(line)
            subtitle_text = "\n".join(cleaned_lines)

            # Remove extra blank lines that might have been created by the above substitutions
            subtitle_text = re.sub(r"\n\s*\n", "\n", subtitle_text).strip()


            # --- End of Subtitle Cleaning Step ---

            if not subtitle_text.strip(): # Check after cleaning
                return jsonify({'error': 'Could not find or parse meaningful subtitles after cleaning'}), 404

            summary = generate_detailed_summary_with_ai(subtitle_text, document_name=youtube_url)
            if summary.startswith("Error:"):
                return jsonify({"error": summary}), 400
            return jsonify({'summary': summary,'original_content': subtitle_text, 'name': youtube_url, 'type': 'youtube'})

        except subprocess.CalledProcessError as e:
            # Include both stdout and stderr for better debugging
            error_details = {
                'stderr': e.stderr,
                'stdout': e.stdout
            }
            print(f"yt-dlp failed. Stderr: {e.stderr}, Stdout: {e.stdout}") # Log to console as well
            return jsonify({'error': 'Failed to download subtitles', 'details': error_details}), 500
        except Exception as e:
            return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500


# --- Route for /summarize-website (Moved from app.py) ---
@api_bp.route('/summarize-website', methods=['POST'])
def summarize_website_route_bp():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({"error": "URL is required"}), 400
    url = data['url']
    try:
        website_title, extracted_text = extract_text_from_url(url)
        if not extracted_text.strip():
             return jsonify({"error": "Could not extract meaningful content from the URL."}), 400
        summary_text = generate_detailed_summary_with_ai(extracted_text, document_name=website_title)
        if summary_text.startswith("Error:"):
            return jsonify({"error": summary_text}), 400
        return jsonify({
            "name": website_title,
            "type": "website",
            "original_content": extracted_text,
            "summary": summary_text
        }), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except openai.OpenAIError as oae:
        print(f"OpenAI API error for {url}: {oae}")
        return jsonify({"error": f"Summarization service error: {str(oae)}"}), 500
    except Exception as e:
        print(f"Unexpected error for {url}: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# --- Route for /chat (Moved from app.py) ---
@api_bp.route('/chat', methods=['POST'])
def chat_route():
    data = request.get_json()
    if not data or 'message' not in data: # 'message' is still sent, can be used for logging or as a fallback.
        return jsonify({"error": "Message is required"}), 400

    user_message_content = data['message'] # Content of the latest message
    summaries = data.get('summaries', [])
    chat_history_from_request = data.get('chat_history', [])

    print(data) # For debugging
    print("&&&&&&&&&"*100)
    client = openai.OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
        base_url=os.environ.get("OPENAI_BASE_URL")
    )
    print(f"summaries:{summaries}\n\n")
    print(f"****************\nchat_history:{chat_history_from_request}\n\n*********************")
    if not client.api_key:
        return jsonify({"error": "OpenAI API key not configured."}), 500

    context_str = ""
    if summaries:
        context_str = "Relevant context from selected sources:\n" + "\n\n---\n\n".join(summaries)
        context_str += "\n\n---\n\nBased on the above context, and your general knowledge, please answer the following question."
    else:
        context_str = "You are a helpful AI assistant. Please answer the following question."

    system_prompt_message = {"role": "system", "content": context_str}

    # Transform chat_history_from_request
    transformed_history = []
    for msg in chat_history_from_request:
        role = "user" if msg.get('sender') == 'user' else "assistant" if msg.get('sender') == 'ai' else None
        if role and msg.get('text'):
            transformed_history.append({"role": role, "content": msg['text']})
        # Basic validation: ensure the last message in history is the user_message_content

    # Ensure transformed_history is not empty and the last message is from the user, if it's not empty.
    # The frontend sends the user message as the last one in chat_history.
    # So, user_message_content should match transformed_history[-1]['content'] if role is user.

    messages_for_openai = transformed_history+ [system_prompt_message]

    print(f"********\n messages_for_openai:{messages_for_openai}\n")
    # Safety check: if transformed_history is empty or doesn't end with the user's latest message,
    # it might indicate an issue. However, based on frontend changes, it should be correct.
    # For robustness, one could add:
    # if not transformed_history or \
    #   (transformed_history[-1]['role'] == 'user' and transformed_history[-1]['content'] != user_message_content) or \
    #   transformed_history[-1]['role'] != 'user':
    #    # This case should ideally not happen with the new frontend logic.
    #    # If it does, we might fall back to the old behavior or add the user_message_content explicitly.
    #    # For now, trust the frontend sends the complete history.
    #    pass


    try:
        completion = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL"),
            messages=messages_for_openai, # Use the fully constructed message list
            temperature=0.7
        )
        reply = completion.choices[0].message.content
        return jsonify({"reply": reply})
    except openai.OpenAIError as oae:
        print(f"OpenAI API error during chat: {oae}")
        return jsonify({"error": f"Chat service error: {str(oae)}"}), 500
    except Exception as e:
        print(f"Unexpected error during chat: {e}")
        return jsonify({"error": f"An unexpected error occurred in chat: {str(e)}"}), 500

# --- Route for /generate-html-report (Moved from app.py) ---
@api_bp.route('/generate-html-report', methods=['POST'])
def generate_html_report_route():
    data = request.get_json()
    if not data or 'summary_text' not in data or 'title' not in data: # Ensure title is also required
        return jsonify({"error": "summary_text and title are required"}), 400

    summary_text = data['summary_text']
    title = data['title']
    print(summary_text)
    print("\n\n\n")
    client = openai.OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
        base_url=os.environ.get("OPENAI_BASE_URL")
    )
    if not client.api_key:
        return jsonify({"error": "OpenAI API key not configured."}), 500

    # Updated prompt to be more aligned with what was in app.py for HTML generation
    prompt = f"""Generate a complete HTML document from the following text. The HTML should be well-structured, easy to read, and visually presentable for a report. Use the title '{title}' for the document <title> tag and as a main heading (e.g., <h1>). Here is the content: {summary_text},设计要求：
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
    try:
        completion = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL"), # Ensure OPENAI_MODEL is set in .env
            messages=[
                {"role": "system", "content": "You are an expert HTML generator. Please create a valid and well-formatted HTML document based on the user's request. Ensure the output is a full HTML document starting with <!DOCTYPE html> and includes html, head, and body tags. Apply simple inline CSS for a clean, professional look, focusing on readability."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        html_content = completion.choices[0].message.content

        if not (html_content.strip().lower().startswith("<!doctype html")):
            print(f"LLM did not return a valid HTML document. Response: {html_content[:200]}...")
            return jsonify({'error': 'LLM did not return a valid HTML document structure. Received: ' + html_content[:100] + "..."}), 500

        return jsonify({"html_content": html_content})
    except openai.OpenAIError as oae:
        print(f"OpenAI API error during HTML report generation: {oae}")
        return jsonify({"error": f"HTML report generation service error: {str(oae)}"}), 500
    except Exception as e:
        print(f"Unexpected error during HTML report generation: {e}")
        return jsonify({"error": f"An unexpected error occurred in HTML report generation: {str(e)}"}), 500


