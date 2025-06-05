import React, { useState } from 'react';
import YoutubeSummarizer from './YoutubeSummarizer';
import TextFileSummarizer from './TextFileSummarizer';
import { getHtmlReport, saveHtmlReport } from '../utils/localStorageHelper'; // Import cache functions

const Sidebar = ({
    notebooks,
    selectedNotebookId,
    onSelectNotebook,
    onAddNotebook,
    onAddSourceToNotebook,
    onSelectSource,
    selectedSourceId,
    onToggleSourceChatSelection // New prop for toggling source chat selection
}) => {
    const [showYoutubeSummarizer, setShowYoutubeSummarizer] = useState(false);
    const [showTextFileSummarizer, setShowTextFileSummarizer] = useState(false);
    const [generatingReportId, setGeneratingReportId] = useState(null); // For loading state

    const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

    // Helper function to display standardized error messages in the new tab
    const displayErrorInNewTab = (tab, errorTitle, errorMessage, errorDetails = "") => {
        if (tab && !tab.closed) {
            tab.document.open();
            tab.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Report Error</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; background-color: #f8f9fa; color: #333; }
                        .error-container { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; max-width: 600px; margin: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                        h1 { color: #dc3545; font-size: 1.8em; margin-bottom: 15px; }
                        p { font-size: 1.1em; margin-bottom: 10px; }
                        pre {
                            background-color: #e9ecef;
                            padding: 15px;
                            border-radius: 4px;
                            text-align: left;
                            white-space: pre-wrap;
                            word-break: break-all;
                            font-size: 0.9em;
                            border: 1px solid #ced4da;
                        }
                        .close-instruction { font-size: 0.9em; color: #6c757d; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>${errorTitle}</h1>
                        <p>${errorMessage}</p>
                        ${errorDetails ? `<pre>${JSON.stringify(errorDetails, null, 2)}</pre>` : ''}
                        <p class="close-instruction">You can close this tab.</p>
                    </div>
                </body>
                </html>
            `);
            tab.document.close();
            tab.focus();
        }
    };

    const handleSummaryComplete = (summaryData) => {
        if (selectedNotebookId) {
            onAddSourceToNotebook(selectedNotebookId, summaryData);
        }
        // Hide summarizers after completion
        setShowYoutubeSummarizer(false);
        setShowTextFileSummarizer(false);
    };

    const handleGenerateReport = async (source) => {
        if (!source || !source.summary || !source.name) {
            console.error('Source data is incomplete for generating report.', source);
            alert('Source data is incomplete. Cannot generate report.');
            return;
        }

        // Ensure selectedNotebook and its ID are available for caching key
        if (!selectedNotebook || !selectedNotebook.id) {
            alert('Cannot generate report: No notebook selected or notebook ID is missing.');
            return;
        }
        const notebookId = selectedNotebook.id;

        // Check for cached report first
        const cachedHtml = getHtmlReport(notebookId, source.id);
        if (cachedHtml) {
            console.log('Displaying cached HTML report for source:', source.name);
            const newTabCached = window.open('', '_blank');
            if (newTabCached) {
                newTabCached.document.open();
                newTabCached.document.write(cachedHtml);
                newTabCached.document.close();
                newTabCached.focus();
            } else {
                alert('Failed to open new tab for cached report. Please check your popup blocker settings.');
            }
            return; // Stop further execution if cached version is displayed
        }

        // If we reach here, it's a cache miss, proceed to generate
        // Attempt to open a new tab immediately for loading message.
        const newTab = window.open('', '_blank');

        if (!newTab) {
            alert('Failed to open new tab. Please disable your popup blocker for this site and try again. Report generation cancelled.');
            // No need to setGeneratingReportId(null) here as it hasn't been set yet for this path
            return;
        }

        newTab.document.open();
        newTab.document.write('<!DOCTYPE html><html><head><title>Generating Report for ' + source.name + '</title><style>body { font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; } .spinner { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></head><body><div class="spinner"></div><h1>Generating Report</h1><p>Please wait while the report for "<strong>' + source.name + '</strong>" is being generated.</p><p>This window will be updated automatically once the report is ready.</p></body></html>');
        newTab.document.close();

        console.log('Generating new report for (cache miss):', source.name);
        setGeneratingReportId(source.id); // Set loading state ONLY when actually fetching

        try {
            const response = await fetch('http://localhost:5001/generate-html-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    summary_text: source.summary,
                    title: source.name,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // IMPORTANT: 'newTab' refers to the tab opened at the beginning of this function.
                if (newTab && !newTab.closed) { // Check if tab is still open
                    if (data && data.html_content && typeof data.html_content === 'string') {
                        console.log('HTML report content received. Updating the pre-opened tab.');
                        newTab.document.open();
                        newTab.document.write(data.html_content);
                        newTab.document.close();

                        // Save the newly generated report to cache
                        saveHtmlReport(notebookId, source.id, data.html_content);
                        console.log('New HTML report saved to cache for source:', source.name);

                        newTab.focus();
                    } else {
                        // HTML content is missing or invalid from API
                        displayErrorInNewTab(newTab, 'Report Content Error', 'Valid report content was not received from the server.');
                        alert('Report generation complete, but valid content was not received. The report tab has been updated with an error message.');
                    }
                } else {
                    // Tab was closed by user before content could be loaded
                    console.warn('Report tab was closed by the user before content could be loaded.');
                    // We can't write to a closed tab, so an alert in the main window is appropriate.
                    if (data && data.html_content && typeof data.html_content === 'string') {
                        alert('Report generated, but the tab was closed. Please try again if you wish to see the report.');
                    } else {
                        alert('Report generation finished, but the tab was closed and the content received was invalid/incomplete.');
                    }
                }
            } else { // response not ok
                const errorData = await response.json().catch(() => response.text()); // Try to parse as JSON, fallback to text
                console.error('Error generating report:', response.status, errorData);
                displayErrorInNewTab(newTab, `API Error: ${response.status}`, 'The server returned an error while generating the report.', errorData);
                alert(`Error generating report: ${response.status}. The report tab has been updated with error details.`);
            }
        } catch (error) { // Network or other fetch error
            console.error('Network or other error generating report:', error);
            displayErrorInNewTab(newTab, 'Network or Client Error', 'A network error or an unexpected issue occurred while trying to generate the report.', { message: error.message });
            alert(`Failed to generate report: ${error.message}. The report tab has been updated with an error.`);
        } finally {
            setGeneratingReportId(null);
        }
    };

    return (
        <div className="sidebar">
            <h2>Notebooks</h2>
            <button
                onClick={onAddNotebook}
                className="primary"
                style={{ width: '100%', marginBottom: '15px' }}
            >
                Create New Notebook
            </button>
            {notebooks.length === 0 ? (
                <p style={{textAlign: 'center', color: '#5f6368'}}>No notebooks yet. Click "Create New Notebook" to start.</p>
            ) : (
                <ul className="notebook-list">
                    {notebooks.map((notebook) => (
                        <li
                            key={notebook.id}
                            onClick={() => onSelectNotebook(notebook.id)}
                            className={notebook.id === selectedNotebookId ? 'selected' : ''}
                            // style removed as it's now handled by .selected class in CSS
                        >
                            {notebook.title}
                        </li>
                    ))}
                </ul>
            )}

            {selectedNotebook && (
                <div style={{ marginTop: '20px' }}>
                    <hr style={{border: 'none', borderTop: '1px solid #e0e0e0', margin: '20px 0'}} />
                    <h3>Sources for: {selectedNotebook.title}</h3>
                    <div className="summarizer-toggle-buttons">
                        <button onClick={() => setShowYoutubeSummarizer(!showYoutubeSummarizer)} className="secondary">
                            {showYoutubeSummarizer ? 'Cancel YouTube Add' : '+ Add YouTube Source'}
                        </button>
                        <button onClick={() => setShowTextFileSummarizer(!showTextFileSummarizer)} className="secondary">
                            {showTextFileSummarizer ? 'Cancel File Add' : '+ Add File Source'}
                        </button>
                    </div>

                    {showYoutubeSummarizer && (
                        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                            <YoutubeSummarizer onSummaryComplete={handleSummaryComplete} />
                        </div>
                    )}
                    {showTextFileSummarizer && (
                        <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                            <TextFileSummarizer onSummaryComplete={handleSummaryComplete} />
                        </div>
                    )}

                    {selectedNotebook.sources && selectedNotebook.sources.length > 0 ? (
                        <ul className="source-list" style={{ marginTop: '15px' }}>
                            {selectedNotebook.sources.slice().reverse().map((source) => ( // Newest first
                                <li
                                    key={source.id}
                                    // onClick to select source for viewing can remain on the li
                                    // className for selection for viewing can also remain
                                    className={`${source.id === selectedSourceId ? 'selected' : ''}`}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                >
                                    <span onClick={() => onSelectSource(source.id)} style={{ flexGrow: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {(() => {
                                            let icon = '📄'; // Default document icon
                                            if (source.type === 'youtube') {
                                                icon = '📺';
                                            } else if (source.name && source.name.toLowerCase().endsWith('.pdf')) {
                                                icon = '📰'; // Newspaper icon for PDF
                                            } else if (source.name && source.name.toLowerCase().endsWith('.md')) {
                                                icon = '📝'; // Memo icon for Markdown (as an example)
                                            }
                                            return icon;
                                        })()} {source.name} {/* Display full name, let CSS handle overflow */}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent li's onClick
                                            handleGenerateReport(source);
                                        }}
                                        disabled={generatingReportId === source.id}
                                        title="Generate HTML Report"
                                        style={{
                                            marginLeft: '10px',
                                            padding: '2px 5px',
                                            fontSize: '0.8em',
                                            cursor: generatingReportId === source.id ? 'default' : 'pointer',
                                            flexShrink: 0,
                                            border: '1px solid #ccc',
                                            borderRadius: '3px',
                                            backgroundColor: generatingReportId === source.id ? '#e0e0e0' : '#f9f9f9',
                                            opacity: generatingReportId === source.id ? 0.7 : 1,
                                        }}
                                    >
                                        {generatingReportId === source.id ? 'Generating...' : 'Report'}
                                    </button>
                                    <input
                                        type="checkbox"
                                        checked={source.isSelectedForChat === undefined ? true : source.isSelectedForChat} // Default to checked if undefined
                                        onChange={(e) => {
                                            // e.stopPropagation() already implicitly handled by checkbox interaction
                                            onToggleSourceChatSelection(selectedNotebook.id, source.id, e.target.checked);
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Still good practice to prevent li's onClick
                                        title="Include in chat context"
                                        style={{ marginLeft: '10px', cursor: 'pointer', flexShrink: 0 }} // Prevent checkbox from shrinking
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#5f6368', textAlign: 'center' }}>
                            No sources in this notebook yet. Add one above.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
