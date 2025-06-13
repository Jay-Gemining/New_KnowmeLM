import React, { useState } from 'react';

function WebsiteSummarizer({ onSummaryComplete, onCancel }) {
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const isYoutubeUrl = (url) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(url);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!websiteUrl.trim()) {
            setError('Website URL cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);

        let endpoint = '';
        let body = {};
        let summaryType = '';

        if (isYoutubeUrl(websiteUrl)) {
            endpoint = 'http://localhost:5001/summarize-youtube';
            body = JSON.stringify({ youtube_url: websiteUrl });
            summaryType = 'youtube';
        } else {
            endpoint = 'http://localhost:5001/summarize-website';
            body = JSON.stringify({ url: websiteUrl });
            summaryType = 'website';
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            if (onSummaryComplete) {
                onSummaryComplete({
                    type: summaryType,
                    name: responseData.name || websiteUrl,
                    summary: responseData.summary,
                    original_content: responseData.original_content,
                    timestamp: new Date().toISOString(),
                    url: websiteUrl // Optionally store the original URL
                });
            }
            setWebsiteUrl(''); // Clear input after successful submission
        } catch (e) {
            console.error("Summarization error:", e);
            setError(e.message || 'Failed to summarize website. Please check the URL and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="summarizer-form-container">
            <h3>Add New Website Source</h3>
            <form onSubmit={handleSubmit}>
                <div> {/* Removed inline style */}
                    <label htmlFor="websiteUrl">Website URL:</label>
                    <input
                        type="text"
                        id="websiteUrl"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="Enter Website URL (e.g., https://example.com/article)"
                        // Removed inline style, rely on App.css for input[type="text"]
                        disabled={isLoading}
                    />
                </div>
                {error && <p className="error-message">{error}</p>} {/* Used class for styling */}
                <div className="button-group"> {/* Used class from App.css */}
                    <button type="button" onClick={onCancel} disabled={isLoading} className="secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className="action"> {/* Changed to action */}
                        {isLoading ? 'Processing...' : (
                            <>
                                <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>add_link</span>
                                Add Website Summary
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WebsiteSummarizer;
