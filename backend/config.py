import os
import openai
from dotenv import load_dotenv

def load_configuration():
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # Add any other global configurations here in the future if needed

    # You might want to return the Flask app's config or other specific values if needed by app.py
    # For now, just setting openai.api_key is the main side effect.
    # Example: Check if API key is loaded
    if not openai.api_key:
        print("Warning: OPENAI_API_KEY not found in .env file or environment variables.")

# Call it directly so importing config executes this
load_configuration()

# Optionally, you could also define variables to export, e.g.:
# OPENAI_API_KEY = openai.api_key
# (but direct setup of openai.api_key is common)
