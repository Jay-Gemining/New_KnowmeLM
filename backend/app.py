import os
# import tempfile # No longer directly used in app.py
# import subprocess # No longer directly used in app.py
# import pysrt # No longer directly used in app.py
# from openai import OpenAI # No longer directly used in app.py
from flask import Flask, jsonify # request removed, send_from_directory not present
# from PyPDF2 import PdfReader # No longer directly used in app.py
from flask_cors import CORS
# import requests # No longer needed here
# from bs4 import BeautifulSoup # No longer needed here
import backend.config # Import the new config module
from backend.routes.api import api_bp
from backend.routes.static import static_bp

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app) # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(api_bp)
app.register_blueprint(static_bp)

# Configuration for API key and base_url is now handled by backend.config
# These global variables can be removed or refactored if all functions
# that need them are updated to get them from config or os.environ directly.
# For now, we'll assume functions like generate_detailed_summary_with_ai
# will be updated or already handle API key retrieval appropriately.
# api_key = os.environ.get("OPENAI_API_KEY") # Now set in backend.config for openai library
base_url = os.environ.get("OPENAI_BASE_URL") # Keep for direct use if necessary
youtube_cookies_file = os.environ.get("YOUTUBE_COOKIES_FILE")
youtube_browser_for_cookies = os.environ.get("YOUTUBE_BROWSER_FOR_COOKIES")
# print(api_key) # For debugging, can be removed
# print(base_url) # For debugging, can be removed
# if api_key: # This block is no longer necessary here
#     api_key = api_key
#     api_base = base_url


# Removed old summarize_text_with_ai function
# The generate_detailed_summary_with_ai function has been moved to backend/utils/summarizer.py

# The extract_text_from_url function has been moved to backend/utils/extractor.py

# All API routes previously here have been moved to backend/routes/api.py

# The hello_world route is removed as static_bp will serve index.html at '/'
# @app.route('/')
# def hello_world():
#     return 'Hello, World! Backend is running.'

# Any other non-API routes, or general app setup, would remain here.
# For example, if you had a health check endpoint not part of the API blueprint:
# @app.route('/health')
# def health_check():
#     return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
