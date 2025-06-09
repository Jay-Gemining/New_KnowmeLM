import openai # This will be the OpenAI client instance after v1.0
import os # For OPENAI_BASE_URL if still used directly here

# If you have a centralized config for the OpenAI client, import it
# from ..config import some_openai_client_instance (example)

# This is the generate_detailed_summary_with_ai function previously in app.py
# It may have been updated by a previous subtask to use an OpenAI client instance.
# For example, it might look like this if it was updated to use the OpenAI v1.0+ client:

# Assuming 'client' is an OpenAI client instance initialized elsewhere (e.g., in config.py or app.py)
# and passed to this function, or this function initializes it.
# For now, let's assume it might still be using the global openai object or needs to init one.

# Option 1: If config.py already sets up a client instance named 'client'
# from .. import config # Assuming config.py is in backend/
# client = config.client

# Option 2: If config.py just sets openai.api_key and base_url, and we init client here.
# This is more self-contained for the utils module.
from openai import OpenAI

# It's good practice to get the API key once, perhaps when the module is loaded or passed.
# For now, let's assume config.py has set the global openai.api_key or we fetch it here.
# If OPENAI_API_KEY is set by config.py:
# api_key = openai.api_key
# else:
# api_key = os.getenv("OPENAI_API_KEY") # Fallback if not globally set

# This was the original structure. The subtask that created config.py mentioned
# "Updated relevant functions (generate_detailed_summary_with_ai, chat, generate_html_report)
# to use openai.api_key (set by config.py) for OpenAI client instantiation and API key checks."
# This implies the functions were changed to instantiate a client.

def generate_detailed_summary_with_ai(text_content, document_name=""):
    # This function's content should be moved from app.py
    # Ensure it uses the OpenAI client correctly.
    # Based on previous subtask report, it likely instantiates an OpenAI client.

    # Example of how it might look after previous updates (actual code from app.py needed)
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL") # if applicable
    )

    if not client.api_key:
        # This check might be redundant if client instantiation fails first,
        # but good for explicit error.
        # This was the old way: if not openai.api_key:
        # Now check client.api_key
        return "Error: OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file or environment variables."

    max_tokens_for_summary = 800  # Max tokens for the summary part
    # Max tokens for a typical model like gpt-3.5-turbo is 4096.
    # This includes prompt, text_content, and response.
    # Approximation: Prompt (~100-150 tokens) + Summary (800 tokens) = ~950 tokens.
    # Remaining for text_content: 4096 - 950 = ~3146 tokens.
    # A token is roughly 4 chars or 0.75 words. So, ~2300 words or ~12000 chars.

    # Simple truncation if text_content is too long (better chunking is complex)
    # This max_chars is an estimate. Actual token limits are what matter.
    # A safer approach is to use a library like tiktoken to count tokens.
    estimated_max_chars = 3000 * 4 # Based on ~3000 tokens, 4 chars/token
    if len(text_content) > estimated_max_chars:
        text_content = text_content[:estimated_max_chars]
        # print(f"Warning: Content for '{document_name}' was truncated to {estimated_max_chars} characters for summarization.")

    prompt_name_part = f" for the document titled '{document_name}'" if document_name else ""

    system_prompt = "You are an expert summarization assistant. Your goal is to provide a detailed and comprehensive summary of the given text. Focus on key points, important figures, dates, and conclusions. The summary should be well-structured, coherent, and easy to understand. Aim for a summary that is sufficiently detailed for someone to grasp the main aspects of the document without reading it in full."
    user_prompt = f"Please provide a detailed summary of the following text{prompt_name_part}:\n\n---\n{text_content}\n---\n\nDetailed Summary:"

    try:
        completion = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5, # Lower temperature for more factual summaries
            max_tokens=max_tokens_for_summary
        )
        summary = completion.choices[0].message.content.strip()
        if not summary or len(summary) < 20: # Check for very short/empty summary
            return f"LLM returned a very short or empty summary for '{document_name}'. This might indicate an issue with the content or summarization process."
        return summary
    except Exception as e:
        # Log the error properly in a real application
        print(f"Error generating detailed summary for '{document_name}': {e}")
        return f"Error generating detailed summary for '{document_name}': {str(e)}"
