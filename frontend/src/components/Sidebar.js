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
    onSelectSource, // New prop
    selectedSourceId  // New prop
}) => {
    const [showYoutubeSummarizer, setShowYoutubeSummarizer] = useState(false);
    const [showTextFileSummarizer, setShowTextFileSummarizer] = useState(false);

    const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

    const handleSummaryComplete = (summaryData) => {
        if (selectedNotebookId) {
            onAddSourceToNotebook(selectedNotebookId, summaryData);
        }
        // Hide summarizers after completion
        setShowYoutubeSummarizer(false);
        setShowTextFileSummarizer(false);
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
                                    onClick={() => onSelectSource(source.id)}
                                    className={source.id === selectedSourceId ? 'selected' : ''}
                                    // style removed as it's now handled by .selected class in CSS
                                >
                                    {source.type === 'youtube' ? '📺' : '📄'} {source.name.length > 30 ? source.name.substring(0,30) + '...' : source.name}
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
