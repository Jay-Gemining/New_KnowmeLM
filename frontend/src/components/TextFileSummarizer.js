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
        <div>
            <h4>Add File Summary (.txt, .md, .pdf)</h4>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="fileInput">Choose .txt, .md, or .pdf file:</label>
                    <input
                        type="file"
                        id="fileInput"
                        ref={fileInputRef}
                        accept=".txt,.md,.pdf,text/plain,application/pdf,text/markdown" // Updated accept attribute
                        onChange={handleFileChange}
                        style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Adjusted style
                    />
                    <button type="submit" disabled={isLoading || !selectedFile} className="secondary" style={{width: '100%'}}>
                        {isLoading ? 'Processing...' : 'Add File Summary'}
                    </button>
                </div>
            </form>
            {isLoading && <p style={{marginTop: '10px', textAlign: 'center'}}>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {/* Summary display removed */}
        </div>
    );
}

export default TextFileSummarizer;
