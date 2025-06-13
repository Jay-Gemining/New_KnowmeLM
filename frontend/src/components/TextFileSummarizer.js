import React, { useState } from 'react';

function TextFileSummarizer({ onSummaryComplete, onCancel }) { // Accept onSummaryComplete and onCancel props
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
            setError('Please select a file first.'); // More generic message
            return;
        }

        // Client-side validation for allowed file types
        const allowedExtensions = ['.txt', '.md', '.pdf'];
        const fileName = selectedFile.name.toLowerCase();
        if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
            setError(`Invalid file type. Please select a ${allowedExtensions.join(', ')} file.`);
            // Reset file input if invalid type
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setSelectedFile(null);
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
        <div className="summarizer-form-container">
            <h3>Add New File Source</h3>
            <form onSubmit={handleSubmit}>
                <div> {/* Removed inline style, rely on App.css for .summarizer-form-container form div */}
                    <label htmlFor="fileInput">Choose .txt, .md, or .pdf file:</label>
                    <input
                        type="file"
                        id="fileInput"
                        ref={fileInputRef}
                        accept=".txt,.md,.pdf,text/plain,application/pdf,text/markdown"
                        onChange={handleFileChange}
                        // Removed inline style, rely on App.css for input[type="file"]
                    />
                </div>
                {error && <p className="error-message">Error: {error}</p>} {/* Used class for styling */}
                {isLoading && <p className="loading-message">Loading...</p>} {/* Used class for styling */}
                <div className="button-group"> {/* Used class from App.css */}
                    <button type="button" onClick={onCancel} disabled={isLoading} className="secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading || !selectedFile} className="action"> {/* Changed to action */}
                        {isLoading ? 'Processing...' : (
                            <>
                                <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>upload_file</span>
                                Add File Summary
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TextFileSummarizer;
