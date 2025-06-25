import React, { useState, useEffect } from 'react';
import Header from './Header'; // Import Header
import './Dashboard.css'; // We will create this file

// Helper to format date as "YYYY年M月D日"
const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};


function Dashboard({ notebooks, onNavigateToNotebook, onCreateNotebook, onEditNotebookTitle, onDeleteNotebook }) {
    const [searchTerm, setSearchTerm] = useState(''); // For future search functionality
    const [sortOption, setSortOption] = useState('recent'); // Default sort: 'recent', 'nameAsc', 'nameDesc', 'createdAsc', 'createdDesc'
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [editingNotebookId, setEditingNotebookId] = useState(null); // For inline rename
    const [renameTitle, setRenameTitle] = useState(''); // For inline rename input

    // Filter and Sort Notebooks
    const processedNotebooks = notebooks
        .filter(notebook => notebook.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            switch (sortOption) {
                case 'nameAsc':
                    return a.title.localeCompare(b.title);
                case 'nameDesc':
                    return b.title.localeCompare(a.title);
                case 'createdAsc':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'createdDesc':
                case 'recent': // Default to recent (createdDesc)
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

    const handleCreateAndNavigate = () => {
        // Default title as per PRD
        const newNotebookId = onCreateNotebook("未命名笔记本");
        // Navigation to workspace is handled in App.js after selectedNotebookId is set
    };

    const startRename = (notebook) => {
        setEditingNotebookId(notebook.id);
        setRenameTitle(notebook.title);
    };

    const cancelRename = () => {
        setEditingNotebookId(null);
        setRenameTitle('');
    };

    const submitRename = () => {
        if (editingNotebookId && renameTitle.trim() !== '') {
            onEditNotebookTitle(editingNotebookId, renameTitle.trim()); // Pass ID and new title
        }
        cancelRename();
    };

    const handleRenameKeyPress = (event) => {
        if (event.key === 'Enter') {
            submitRename();
        } else if (event.key === 'Escape') {
            cancelRename();
        }
    };

    // Placeholder for duplicate
    const handleDuplicateNotebook = (notebookId) => {
        const notebookToDuplicate = notebooks.find(nb => nb.id === notebookId);
        if (notebookToDuplicate) {
            // Create a new title for the duplicate
            const duplicateTitle = `${notebookToDuplicate.title} 的副本`;
            // Create the new notebook object
            const newNotebook = {
                // id: Date.now(), // Handled by onCreateNotebook or similar logic in App.js
                title: duplicateTitle,
                // createdAt: new Date().toISOString(), // Handled by onCreateNotebook
                sources: notebookToDuplicate.sources.map(source => ({ ...source, id: Date.now() + Math.random() })), // Deep copy sources with new IDs
                chatHistory: notebookToDuplicate.chatHistory ? notebookToDuplicate.chatHistory.map(entry => ({...entry})) : [] // Deep copy chat history
            };
            // Call App.js function to actually add it. This function needs to be created or adapted in App.js
            // For now, let's assume onCreateNotebook can take a full notebook object or specific parts.
            // This part needs careful implementation in App.js.
            // Let's simplify for now: App.js's handleCreateNewNotebook already creates a new notebook.
            // We'll need a new function in App.js like `handleDuplicateExistingNotebook(notebookToDuplicate)`

            // Simplified: use onCreateNotebook and then update it. This is not ideal.
            // A dedicated duplication function in App.js is better.
            // For this step, we'll just log it.
            console.log("Attempting to duplicate notebook:", notebookToDuplicate.title, "as", duplicateTitle);
            alert(`Duplicating "${notebookToDuplicate.title}" - (Full implementation requires App.js changes)`);

            // Ideal flow:
            // const duplicatedNotebookId = onDuplicateNotebook(notebookId); // This function would live in App.js
            // if (duplicatedNotebookId) {
            //   console.log("Notebook duplicated with ID:", duplicatedNotebookId);
            // }
        }
    };


    const handleDeleteWithConfirmation = (notebookId, notebookTitle) => {
        if (window.confirm(`您确定要永久删除 ‘${notebookTitle}’ 吗？此操作无法撤销。`)) {
            onDeleteNotebook(notebookId);
        }
    };


    // Empty State Content
    const EmptyState = () => (
        <div className="dashboard-empty-state">
            <span role="img" aria-label="empty-notebooks" style={{fontSize: '4em', marginBottom: '20px'}}>🗂️</span>
            <p>您的知识库空空如也。</p>
            <p>点击‘新建’，开始整理您的第一个项目吧！</p>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Header onNavigateToDashboard={() => onNavigateToNotebook(null)} /> {/* Clicking logo goes to dashboard (clears selection) */}

            <div className="dashboard-main-content">
                <div className="dashboard-welcome-area">
                    <h1>欢迎使用 NotebookLM</h1>
                    <button onClick={handleCreateAndNavigate} className="dashboard-create-new-button">
                        <span className="plus-icon">+</span> 新建
                    </button>
                </div>

                <div className="dashboard-list-area">
                    <div className="dashboard-list-toolbar">
                        <div className="view-toggle">
                            <button
                                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List view"
                            >
                                <span className="material-symbols-outlined">list</span>
                            </button>
                            <button
                                className={`view-button ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid view"
                            >
                                <span className="material-symbols-outlined">grid_view</span>
                            </button>
                        </div>
                        {/* Placeholder for search: <input type="text" placeholder="Search notebooks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> */}
                        <div className="sort-dropdown">
                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="dashboard-select">
                                <option value="recent">最近修改</option>
                                <option value="createdDesc">创建时间 (从新到旧)</option>
                                <option value="createdAsc">创建时间 (从旧到新)</option>
                                <option value="nameAsc">名称 (A-Z)</option>
                                <option value="nameDesc">名称 (Z-A)</option>
                            </select>
                        </div>
                    </div>

                    {processedNotebooks.length === 0 && !searchTerm ? (
                        <EmptyState />
                    ) : processedNotebooks.length === 0 && searchTerm ? (
                        <p className="dashboard-no-results">No notebooks found for "{searchTerm}".</p>
                    ) : (
                        viewMode === 'list' ? (
                            <table className="dashboard-notebook-table">
                                <thead>
                                    <tr>
                                        <th>标题</th>
                                        <th>来源数量</th>
                                        <th>创建时间</th>
                                        <th>角色</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedNotebooks.map((notebook) => (
                                        <tr key={notebook.id} onDoubleClick={() => onNavigateToNotebook(notebook.id)}>
                                            <td onClick={() => onNavigateToNotebook(notebook.id)} className="notebook-title-cell">
                                                {editingNotebookId === notebook.id ? (
                                                    <input
                                                        type="text"
                                                        value={renameTitle}
                                                        onChange={(e) => setRenameTitle(e.target.value)}
                                                        onBlur={submitRename}
                                                        onKeyPress={handleRenameKeyPress}
                                                        autoFocus
                                                        className="rename-input"
                                                    />
                                                ) : (
                                                    notebook.title
                                                )}
                                            </td>
                                            <td>{notebook.sources?.length || 0} 个来源</td>
                                            <td>{formatDate(notebook.createdAt)}</td>
                                            <td>Owner</td> {/* Placeholder as per PRD */}
                                            <td>
                                                <div className="notebook-actions-menu">
                                                    <button className="kebab-button" onClick={(e) => e.currentTarget.nextElementSibling.classList.toggle('show')}>
                                                        <span className="material-symbols-outlined">more_vert</span>
                                                    </button>
                                                    <div className="actions-dropdown">
                                                        <button onClick={() => startRename(notebook)}>重命名</button>
                                                        <button onClick={() => handleDuplicateNotebook(notebook.id)}>创建副本</button>
                                                        <button onClick={() => handleDeleteWithConfirmation(notebook.id, notebook.title)}>删除</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            // Grid View (Basic Placeholder)
                            <div className="dashboard-notebook-grid">
                                {processedNotebooks.map((notebook) => (
                                   <div key={notebook.id} className="grid-item" onClick={() => onNavigateToNotebook(notebook.id)}>
                                        <h3>{notebook.title}</h3>
                                        <p>{notebook.sources?.length || 0} 个来源</p>
                                        <p>Created: {formatDate(notebook.createdAt)}</p>
                                        {/* Simplified actions for grid view for now */}
                                        <div className="grid-item-actions">
                                            <button onClick={(e) => { e.stopPropagation(); startRename(notebook);}} title="Rename">✏️</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteWithConfirmation(notebook.id, notebook.title);}} title="Delete">🗑️</button>
                                        </div>
                                   </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
