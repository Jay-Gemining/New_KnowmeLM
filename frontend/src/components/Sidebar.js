import React from 'react'; // Removed useState
// import YoutubeSummarizer from './YoutubeSummarizer'; // Removed
// import TextFileSummarizer from './TextFileSummarizer'; // Removed
// import { getHtmlReport, saveHtmlReport } from '../utils/localStorageHelper'; // Removed

const Sidebar = ({
    notebooks,
    selectedNotebookId,
    onSelectNotebook,
    onAddNotebook,
    onAddSourceToNotebook,
    // Removed onSelectSource and selectedSourceId
    onToggleSourceChatSelection, // Added this prop
    onEditNotebookTitle,
    onDeleteNotebook,
    onToggleYoutubeSummarizer, // New prop
    onToggleTextFileSummarizer, // New prop
}) => {
    // const [showYoutubeSummarizer, setShowYoutubeSummarizer] = useState(false); // Removed
    // const [showTextFileSummarizer, setShowTextFileSummarizer] = useState(false); // Removed
    // const [generatingReportId, setGeneratingReportId] = useState(null); // Removed

    const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

    // Helper function displayErrorInNewTab can be removed if not used elsewhere, but it's generic.
    // For now, assuming it might be used by other functionalities or future ones.
    // If strictly only for handleGenerateReport, it would be removed.
    // Let's assume it's removed for this cleanup pass as handleGenerateReport is gone.

    // const handleSummaryComplete = (summaryData) => { // Removed
    //     if (selectedNotebookId) {
    //         onAddSourceToNotebook(selectedNotebookId, summaryData);
    //     }
    //     setShowYoutubeSummarizer(false);
    //     setShowTextFileSummarizer(false);
    // };

    // const handleGenerateReport = async (source) => { // Removed
    // ... entire function removed
    // };

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
                            className={`${notebook.id === selectedNotebookId ? 'selected' : ''} notebook-item`}
                            // onClick is now on the span to avoid triggering selection when clicking icons
                        >
                            <span onClick={() => onSelectNotebook(notebook.id)} style={{ flexGrow: 1, cursor: 'pointer' }}>
                                {notebook.title}
                            </span>
                            <div className="notebook-actions">
                                <button onClick={(e) => { e.stopPropagation(); onEditNotebookTitle(notebook.id); }} title="Edit notebook title">✏️</button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteNotebook(notebook.id); }} title="Delete notebook">🗑️</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <hr className="sidebar-section-separator" />

            {selectedNotebook && (
                <div style={{ marginTop: '20px' }}>
                    {/* Add Source Buttons */}
                    <div className="add-source-buttons-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        <button onClick={() => onToggleYoutubeSummarizer(true)} className="primary icon-button">
                            ➕ Add YouTube Source
                        </button>
                        <button onClick={() => onToggleTextFileSummarizer(true)} className="primary icon-button">
                            ➕ Add File Source
                        </button>
                    </div>

                    <h3>Sources for: {selectedNotebook.title}</h3>
                    {/* Summarizer toggle buttons and summarizer components removed from here */}

                    {selectedNotebook.sources && selectedNotebook.sources.length > 0 ? (
                        <ul className="source-list" style={{ marginTop: '10px' }}>
                            {selectedNotebook.sources.slice().reverse().map((source) => {
                                const isSelectedForChat = source.isSelectedForChat === undefined ? true : source.isSelectedForChat;
                                return (
                                    <li
                                        key={source.id}
                                        onClick={() => onToggleSourceChatSelection(selectedNotebook.id, source.id, !isSelectedForChat)}
                                        className={`source-list-item ${isSelectedForChat ? 'selected-for-chat' : ''}`}
                                        title={`${source.name} - ${isSelectedForChat ? 'Included in chat context' : 'Not in chat context'}`}
                                    >
                                        <div className="source-info">
                                            <span className="source-icon">
                                                {(() => {
                                                    let icon = '📄'; // Default document icon
                                                    if (source.type === 'youtube') {
                                                        icon = '📺';
                                                    } else if (source.name && source.name.toLowerCase().endsWith('.pdf')) {
                                                        icon = '📰';
                                                    } else if (source.name && source.name.toLowerCase().endsWith('.md')) {
                                                        icon = '📝';
                                                    }
                                                    return icon;
                                                })()}
                                            </span>
                                            <span className="selection-indicator">{isSelectedForChat ? '✓ ' : '☐ '}</span>
                                            <span className="source-name-text">{source.name}</span>
                                        </div>
                                    </li>
                                );
                            })}
                            ))}
                        </ul>
                    ) : (
                        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#5f6368', textAlign: 'center' }}>
                            No sources in this notebook yet. Add one using the buttons above.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
