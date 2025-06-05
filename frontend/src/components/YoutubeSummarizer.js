import React, { useState } from 'react';

function YoutubeSummarizer({ onSummaryComplete }) { // Accept onSummaryComplete prop
    const [youtubeUrl, setYoutubeUrl] = useState('');
    // Removed summary state, as it's handled by the parent
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        // setSummary(''); // No longer managing summary here

        if (!youtubeUrl.trim()) {
            setError("YouTube URL cannot be empty.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5001/summarize-youtube', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtube_url: youtubeUrl }),
            });

            const responseData = await response.json(); // Try to parse JSON regardless of response.ok

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            // Call the callback with summary data
            if (onSummaryComplete) {
                onSummaryComplete({
                    type: 'youtube',
                    name: youtubeUrl, // Or try to get a video title if possible (future enhancement)
                    summary: responseData.summary,
                    timestamp: new Date().toISOString(),
                });
            }
            setYoutubeUrl(''); // Clear input after successful submission
        } catch (e) {
            setError(e.message || 'Failed to fetch summary. Please check the URL and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h4>Add YouTube Video Summary</h4>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="youtubeUrl">YouTube URL:</label>
                    <input
                        type="text"
                        id="youtubeUrl"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="Enter YouTube URL"
                        required
                        style={{ width: '100%', marginBottom: '10px' }} // Adjusted style for better flow
                    />
                    <button type="submit" disabled={isLoading} className="secondary" style={{width: '100%'}}>
                        {isLoading ? 'Processing...' : 'Add YouTube Summary'}
                    </button>
                </div>
            </form>
            {isLoading && <p style={{marginTop: '10px', textAlign: 'center'}}>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {/* The summary itself is no longer displayed here */}
        </div>
    );
}

export default YoutubeSummarizer;
