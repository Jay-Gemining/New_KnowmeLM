# KnowmeLM: Your Intelligent Knowledge Management Assistant

## Project Overview

KnowmeLM is a powerful knowledge management application designed to help you organize, summarize, and interact with information from various sources. It allows users to create distinct notebooks for different topics or projects, add content from YouTube videos and text-based files (TXT, PDF, Markdown), and then leverage AI to generate comprehensive summaries. Users can engage in interactive chat sessions based on these summaries and generate HTML reports for sharing or archiving.

KnowmeLM aims to streamline the process of information consumption and knowledge extraction, making it easier to manage and draw insights from your digital content.

## Features

*   **Notebook Management**:
    *   Create, rename, and delete notebooks to organize your knowledge domains.
    *   Each notebook acts as a container for related information sources.
*   **Source Management**:
    *   **Add YouTube Videos**: Provide a YouTube video URL to extract its transcript.
    *   **Upload Text Files**: Supports TXT, PDF, and Markdown (MD) files for text extraction.
    *   (Functionality for website summarization might also be present or planned via `WebsiteSummarizer.js`)
*   **AI-Powered Summaries**:
    *   After extracting content (e.g., YouTube subtitles, file text), KnowmeLM utilizes an AI model to generate a detailed and comprehensive summary.
    *   This summary becomes the primary knowledge base for subsequent interactions.
*   **Interactive AI Chat**:
    *   Engage in conversations with an AI that uses the generated summaries from your selected sources as its knowledge context.
    *   Select one or more sources within a notebook to define the scope of the chat.
    *   If a detailed summary isn't available or fails to generate, the system can fall back to using the original extracted content for chat context.
*   **HTML Report Generation**:
    *   Create well-structured HTML reports from the AI-generated summaries of selected sources.
    *   Useful for sharing insights, archiving information, or offline viewing.
*   **Notification System**:
    *   Receive in-app notifications for important actions, errors, or status updates (e.g., "Source added successfully," "Report generation initiated").
*   **Local Data Persistence**:
    *   Notebooks, source metadata, and generated HTML reports are cached in the browser's `localStorage` for improved performance and user experience, allowing you to retain your data between sessions.

## Tech Stack

*   **Backend**:
    *   Python (Flask framework)
    *   OpenAI API (for summarization and chat functionalities)
    *   `yt-dlp` (or similar, for downloading YouTube video information/transcripts)
    *   `PyPDF2` (or similar, for processing PDF files)
*   **Frontend**:
    *   React (JavaScript library for building user interfaces)
    *   JavaScript (ES6+)
    *   CSS3 (for styling, potentially with CSS variables for theming)
*   **Data Storage (Client-Side)**:
    *   Browser `localStorage` for caching notebooks, source metadata, and HTML reports.

## Frontend Design Overview

KnowmeLM features a modern and intuitive three-column layout:

*   **Left Sidebar (`Sidebar.js`)**:
    *   Manages notebook creation, listing, selection, renaming, and deletion.
    *   Displays the list of sources for the currently selected notebook.
    *   Allows users to add new sources (YouTube, text files) via dedicated buttons that activate input forms in the main content area.
    *   Enables selection of sources to be included in the chat context.
*   **Main Content Area (`MainContent.js`)**:
    *   Displays the primary user interface for interaction, which varies based on context:
        *   Welcome screen or notebook overview.
        *   Input forms for adding new YouTube or text file sources (using `YoutubeSummarizer.js`, `TextFileSummarizer.js`).
        *   The interactive chat interface for conversing with the AI.
*   **Right Sidebar (`RightSidebar.js`)**:
    *   Dedicated to HTML report generation.
    *   Lists sources from the selected notebook, allowing users to choose which ones to include in a report.
    *   Contains the button to trigger report generation and displays its progress.

## Setup and Installation

Follow these steps to set up and run KnowmeLM on your local machine:

### Backend Setup

1.  **Prerequisites**: Ensure Python 3.x is installed.
2.  **Clone Repository**: Clone the project repository (if you haven't already).
3.  **Navigate to Backend Directory**: `cd path/to/your/backend_directory`
4.  **Install Dependencies**: Install required Python packages using `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```
5.  **Environment Configuration**:
    *   Create a `.env` file in the backend directory (you can copy `.env.example` if provided).
    *   Edit the `.env` file to include your OpenAI API key and any other necessary backend configurations:
        ```env
        OPENAI_API_KEY='your_openai_api_key_here'
        # Other backend-specific environment variables
        ```
6.  **Run Flask Server**:
    ```bash
    python app.py # Or the main Flask application file (e.g., run.py)
    ```
    The backend server will typically start on `http://localhost:5000` or `http://localhost:5001`. Check your project's specific configuration.

### Frontend Setup

1.  **Prerequisites**: Ensure Node.js (which includes npm) is installed.
2.  **Navigate to Frontend Directory**: `cd path/to/your/frontend_directory` (e.g., `frontend/`)
3.  **Install Dependencies**: Install required Node.js packages:
    ```bash
    npm install
    ```
4.  **Run React Development Server**:
    ```bash
    npm start
    ```
    The frontend application will typically be accessible at `http://localhost:3000`.

## Usage

1.  **Open the Application**: Access the frontend URL (usually `http://localhost:3000`) in your web browser.
2.  **Create a Notebook**:
    *   In the left sidebar, click the "Create New Notebook" button (or similar).
    *   Enter a title for your notebook when prompted. The new notebook will appear in the sidebar and be automatically selected.
3.  **Add Content Sources**:
    *   With a notebook selected, click "➕ Add YouTube Source" or "➕ Add File Source" in the left sidebar.
    *   The corresponding input form will appear in the main content area.
    *   **For YouTube**: Paste the video URL and submit.
    *   **For Files**: Select a TXT, PDF, or MD file from your computer and submit.
    *   The system will process the source, extract content, and generate an AI summary. The new source will appear in the left sidebar under the current notebook.
4.  **Select Sources for Chat**:
    *   In the left sidebar, click on the sources listed under the selected notebook to toggle their inclusion in the chat context. A visual indicator (e.g., a checkmark) will show which sources are active.
5.  **Interact with the AI Chat**:
    *   The chat interface is in the main content area.
    *   The interface will indicate which sources are currently providing context.
    *   Type your questions or prompts related to the selected source summaries and receive AI-generated responses.
6.  **Generate HTML Reports**:
    *   In the right sidebar, select the sources you want to include in your report using the checkboxes.
    *   Click the "Generate HTML Report (Selected)" button.
    *   The system will generate an HTML report for each selected source's summary, typically opening each in a new browser tab. These reports are also cached in `localStorage`.
7.  **Manage Notebooks**:
    *   **Rename**: Click an edit icon or option next to a notebook title in the left sidebar.
    *   **Delete**: Click a delete icon or option next to a notebook in the left sidebar. Confirm the deletion when prompted.

## Backend API Endpoints (Conceptual)

The backend likely provides API endpoints such as:

*   `POST /summarize-youtube`: Accepts a YouTube URL, fetches content, generates a summary, and returns summary, title, and original content.
*   `POST /summarize-text-file`: Accepts an uploaded text file, extracts content, generates a summary, and returns summary, filename, and original content.
*   `POST /chat`: Accepts a user query and a list of selected source summaries (or original content as fallback) to provide context, then returns an AI-generated response.
*   `POST /generate-html-report`: Accepts a summary text and title, and returns a formatted HTML report.

*(Refer to the backend's specific API documentation for exact routes and request/response formats.)*

## Contributing

We welcome contributions to KnowmeLM! If you're interested in helping improve the application, please consider the following:

*   **Reporting Bugs**: If you find a bug, please open an issue on the project's issue tracker, providing detailed steps to reproduce it.
*   **Feature Suggestions**: Have an idea for a new feature or an improvement? Open an issue to discuss it.
*   **Code Contributions**:
    1.  Fork the repository.
    2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name` or `bugfix/your-bug-fix`).
    3.  Make your changes, adhering to the project's coding style and conventions.
    4.  Write unit tests for your changes if applicable.
    5.  Ensure all tests pass.
    6.  Commit your changes and push them to your fork.
    7.  Submit a pull request to the main repository for review.

*(Please check if a `CONTRIBUTING.md` file exists for more specific guidelines.)*

## Disclaimer

KnowmeLM is an evolving project. Some features described in product requirement documents or envisioned for the final product may not be fully implemented or may behave differently in the current version. Your understanding and feedback are appreciated as we continue to develop and refine the application.
