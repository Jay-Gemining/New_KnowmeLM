import React, { useState } from 'react'; // Added useState
import YoutubeSummarizer from './YoutubeSummarizer';
import TextFileSummarizer from './TextFileSummarizer';
// We don't directly need localStorageHelper here if App.js handles all data modifications

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
        console.log('Generating report for:', source.name);
        setGeneratingReportId(source.id);

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
                if (data && data.html_content && typeof data.html_content === 'string') {
                    console.log('HTML report content received, opening in new tab.');
                    const newTab = window.open();
                    if (newTab) {
                        newTab.document.open();
                        newTab.document.write(data.html_content);
                        newTab.document.close();
                    } else {
                        console.error('Failed to open new tab. Popup blocker might be active.');
                        alert('Failed to open report in a new tab. Please check your popup blocker settings and try again.');
                    }
                } else {
                    console.error('HTML content missing or invalid in API response:', data);
                    alert('Failed to generate report: Received invalid content from server.');
                }
            } else {
                const errorData = await response.json().catch(() => response.text());
                console.error('Error generating report:', response.status, errorData);
                alert(`Error generating report: ${response.status} - ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error('Network or other error generating report:', error);
            alert(`Failed to generate report: ${error.message}`);
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
                                        {source.type === 'youtube' ? '📺' : '📄'} {source.name} {/* Display full name, let CSS handle overflow */}
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
