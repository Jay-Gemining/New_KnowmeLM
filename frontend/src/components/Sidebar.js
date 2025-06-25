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
    onToggleWebsiteSummarizer, // Changed from onToggleYoutubeSummarizer
    onToggleTextFileSummarizer, // New prop
    onNavigateToDashboard, // New prop to go back to dashboard
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
            {/* Simple way to navigate back to Dashboard from Sidebar */}
            <button
                onClick={onNavigateToDashboard}
                className="action"
                style={{ width: '100%', marginBottom: 'var(--spacing-md)', backgroundColor: 'var(--color-background-secondary)' }}
            >
                <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>arrow_back</span>
                Back to Dashboard
            </button>

            <h2>Notebooks</h2>
            <button
                onClick={onAddNotebook}
                className="action" // Changed from primary to action
                style={{ width: '100%', marginBottom: 'var(--spacing-lg)' }} // Used CSS var
            >
                {/* Using Material Symbol for consistency if desired, or keep text */}
                {/* <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>add_circle</span> */}
                Create New Notebook
            </button>
            {notebooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)', display: 'block' }}>
                        note_add
                    </span>
                    <p style={{ fontSize: 'var(--font-size-base)', margin: 0, color: 'var(--color-text-primary)' }}>
                        No notebooks yet.
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)'}}>
                        Click "Create New Notebook" to get started.
                    </p>
                </div>
            ) : (
                <ul className="notebook-list">
                    {notebooks.map((notebook) => (
                        <li
                            key={notebook.id}
                            className={`${notebook.id === selectedNotebookId ? 'selected' : ''} notebook-item`}
                        >
                            <span onClick={() => onSelectNotebook(notebook.id)} style={{ flexGrow: 1, cursor: 'pointer', padding: 'var(--spacing-sm) 0' }}>
                                {notebook.title}
                            </span>
                            <div className="notebook-actions">
                                <button onClick={(e) => { e.stopPropagation(); onEditNotebookTitle(notebook.id); }} title="Edit notebook title">
                                    <span className="material-symbols-outlined">edit</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteNotebook(notebook.id); }} title="Delete notebook">
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <hr className="sidebar-section-separator" />

            {selectedNotebook && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}> {/* Consistent spacing */}
                    {/* Add Source Buttons */}
                    <div className="add-source-buttons-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}> {/* Consistent spacing */}
                        <button onClick={() => onToggleWebsiteSummarizer(true)} className="action icon-button"> {/* Changed from primary to action */}
                            <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)' }}>add_link</span>
                            Add Website Source
                        </button>
                        <button onClick={() => onToggleTextFileSummarizer(true)} className="action icon-button"> {/* Changed from primary to action */}
                            <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)' }}>note_add</span>
                            Add File Source
                        </button>
                    </div>

                    <h3>Sources for: {selectedNotebook.title}</h3>

                    {selectedNotebook.sources && selectedNotebook.sources.length > 0 ? (
                        <ul className="source-list" style={{ marginTop: 'var(--spacing-md)' }}>
                            {selectedNotebook.sources.slice().reverse().map((source) => {
                                const isSelectedForChat = source.isSelectedForChat === undefined ? true : source.isSelectedForChat;
                                let iconName = 'description'; // Default for TXT or other files
                                if (source.type === 'website') {
                                    iconName = 'language';
                                } else if (source.name && source.name.toLowerCase().endsWith('.pdf')) {
                                    iconName = 'picture_as_pdf';
                                } else if (source.name && source.name.toLowerCase().endsWith('.md')) {
                                    iconName = 'article';
                                }
                                return (
                                    <li
                                        key={source.id}
                                        onClick={() => onToggleSourceChatSelection(selectedNotebook.id, source.id, !isSelectedForChat)}
                                        className={`source-list-item ${isSelectedForChat ? 'selected-for-chat' : ''}`}
                                        title={`${source.name} - ${isSelectedForChat ? 'Included in chat context' : 'Not in chat context'}`}
                                    >
                                        <div className="source-info">
                                            <span className="material-symbols-outlined source-icon">{iconName}</span>
                                            <span className="selection-indicator">
                                                {/* Using Material Symbols for checkbox state */}
                                                <span className="material-symbols-outlined">
                                                    {isSelectedForChat ? 'check_box' : 'check_box_outline_blank'}
                                                </span>
                                            </span>
                                            <span className="source-name-text">{source.name}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)', display: 'block' }}>
                                playlist_add
                            </span>
                            <p style={{ fontSize: 'var(--font-size-base)', margin: 0, color: 'var(--color-text-primary)' }}>
                                This notebook is empty.
                            </p>
                            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)'}}>
                                Add a website or file source to begin.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
