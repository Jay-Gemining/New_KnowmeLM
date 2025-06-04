import React, { useState } from 'react';

function TextFileSummarizer({ onSummaryComplete }) { // Accept onSummaryComplete prop
    const [selectedFile, setSelectedFile] = useState(null);
    // Removed summary state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = React.useRef(); // To reset file input

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setError(null);
        // setSummary(''); // No longer managing summary here
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            setError('Please select a .txt file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        // setSummary('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('http://localhost:5001/summarize-text-file', {
                method: 'POST',
                body: formData,
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
            }

            // Call the callback with summary data
            if (onSummaryComplete) {
                onSummaryComplete({
                    type: 'file',
                    name: selectedFile.name,
                    summary: responseData.summary,
                    timestamp: new Date().toISOString(),
                });
            }
            setSelectedFile(null); // Clear selected file
            if(fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
            }
        } catch (e) {
            setError(e.message || 'Failed to fetch summary. Please ensure the file is a valid .txt file and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h4>Add Text File (.txt) Summary</h4>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="fileInput">Choose .txt file:</label>
                    <input
                        type="file"
                        id="fileInput"
                        ref={fileInputRef}
                        accept=".txt"
                        onChange={handleFileChange}
                        style={{ marginLeft: '10px', marginRight: '10px' }}
                    />
                    <button type="submit" disabled={isLoading || !selectedFile}>
                        {isLoading ? 'Processing...' : 'Add to Notebook'}
                    </button>
                </div>
            </form>
            {isLoading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {/* Summary display removed */}
        </div>
    );
}

export default TextFileSummarizer;
