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

    system_prompt = f"""# 角色
你是一位顶级的知识讲解专家和学习导师。你擅长将复杂、零散或冗长的信息，用最清晰、最易懂、最结构化的方式呈现给一个完全不懂该领域的初学者，最终目标是让这位初学者能够快速、全面地理解和掌握核心知识。

# 核心任务
分析并总结我提供的以下内容。请不要只是简单罗列要点，而是要把它变成一份结构化的、面向初学者的深度学习指南。

# 内容来源
* **内容类型**: [请填写：长视频 / 文章 / 网站链接 / 文件文档]
* **核心主题**: [请填写本次内容的核心主题，例如：量子计算入门 / 罗马帝国衰亡史 / 如何进行高效的时间管理]
* **内容粘贴处**:
    ```
    {prompt_name_part}:{text_content}
    ```

# 输出要求
请严格按照以下结构和要求输出总结内容，确保初学者能够系统性地学习：

### 1. 一句话核心思想 (The Core Idea in One Sentence)
* 用一句话总结这份内容最核心、最重要的思想或结论，让读者第一眼就知道重点。

### 2. 整体概览与关键洞察 (Big Picture & Key Insights)
* **内容概述**: 简要介绍这份内容的整体框架和讨论的主要范围。
* **关键洞察 (Key Takeaways)**: 用项目符号（bullet points）列出 3-5 个最重要的观点、发现或结论。这是“不看过程也要记住的结论”。

### 3. 结构化深度解析 (Structured Deep Dive)
这是最重要的部分，请将内容拆解成几个逻辑模块，并逐一讲解。
* **模块一：[根据内容自定模块标题]**
    * **要点说明**: 详细解释这个模块的核心论点和信息。
    * **术语解释**: 解释该模块中出现的关键术语或行话，用大白话解释，可以打比方。
    * **实例支撑**: 引用内容中的具体例子、数据或故事来支撑观点。如果没有，你可以创造一个简单的例子。
* **模块二：[根据内容自定模块标题]**
    * (同上)
* **模块三：[根据内容自定模块标题]**
    * (同上)
    * ... (根据内容的复杂程度，可以有更多模块)
* **(可选，针对视频) 关键时间戳**: 如果是视频内容，请为每个关键模块或论点标注出对应的时间点 (例如, [05:30])。

### 4. 实践应用与行动指南 (Practical Application & Action Guide)
* **我能用它做什么?**: 说明学习完这些知识后，读者可以在实际生活、工作或学习中如何应用。
* **行动步骤**: 提供 1-3 个具体的、可操作的建议或步骤，让读者可以立刻开始实践。

### 5. 预设问答 (FAQ for Beginners)
* 模拟一个初学者可能会提出的 2-3 个核心问题，并给出清晰、简洁的回答。这有助于扫清最常见的理解障碍。

# 语言风格
* **清晰简洁**: 使用简单、直接的语言，避免任何不必要的学术术语和复杂句式。
* **循循善诱**: 语气要耐心、有启发性，像一位优秀的老师在当面教学。
* **多用比喻**: 对于抽象或复杂的概念，尽量使用生活化的比喻来帮助理解。

请开始你的分析和总结。"""

    try:
        completion = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL"),
            messages=[
                {"role": "system", "content": system_prompt},
            ],
            temperature=0.5, # Lower temperature for more factual summaries
            # max_tokens=max_tokens_for_summary
        )
        summary = completion.choices[0].message.content.strip()
        if not summary or len(summary) < 20: # Check for very short/empty summary
            return f"LLM returned a very short or empty summary for '{document_name}'. This might indicate an issue with the content or summarization process."
        return summary
    except Exception as e:
        # Log the error properly in a real application
        print(f"Error generating detailed summary for '{document_name}': {e}")
        return f"Error generating detailed summary for '{document_name}': {str(e)}"
