import requests
from bs4 import BeautifulSoup

# This is the extract_text_from_url function previously in app.py
def extract_text_from_url(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() # Raises an HTTPError for bad responses (4XX or 5XX)

        soup = BeautifulSoup(response.content, 'html.parser')

        # Remove script and style elements
        for script_or_style in soup(["script", "style"]):
            script_or_style.decompose()

        # Attempt to get title
        title = soup.title.string.strip() if soup.title and soup.title.string else url

        # Basic content extraction (can be improved)
        main_content_tags = soup.find_all(['article', 'main'])
        if not main_content_tags:
            main_content_tags = soup.find_all('div', class_=['content', 'post-content', 'entry-content', 'article-body'])
            if not main_content_tags:
                main_content_tags = [soup.body] if soup.body else []

        text_parts = []
        for tag in main_content_tags:
            if tag:
                paragraphs = tag.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'])
                if paragraphs:
                    for p in paragraphs:
                        text_parts.append(p.get_text(separator=' ', strip=True))
                else:
                    text_parts.append(tag.get_text(separator=' ', strip=True))

        extracted_text = "\n\n".join(filter(None, text_parts))

        if len(extracted_text) < 200 and soup.body:
            body_text = soup.body.get_text(separator='\n', strip=True)
            # Only use if it's substantially better and not just minimal boilerplate
            if len(body_text) > len(extracted_text) + 100 or (not extracted_text and body_text):
                extracted_text = body_text

        # If title is still the URL and there's some text, try to derive a title from first H1
        if title == url and extracted_text:
            first_h1 = soup.find('h1')
            if first_h1 and first_h1.string:
                title = first_h1.string.strip()


        return title, extracted_text

    except requests.exceptions.RequestException as e:
        # Log the error or handle it as per application's logging strategy
        # For now, re-raising a ValueError is consistent with previous design
        raise ValueError(f"Failed to fetch or read URL: {url}. Error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Failed to parse content from URL: {url}. Error: {str(e)}")
