import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Import new CSS
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar'; // Import RightSidebar
import Notification from './components/Notification'; // New import
import './components/Notification.css'; // New import for CSS
import { getNotebooks, saveNotebooks as saveNotebooksToStorage } from './utils/localStorageHelper'; // Renamed for clarity

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);
  // Removed selectedSourceId state
  const [showWebsiteSummarizerInMain, setShowWebsiteSummarizerInMain] = useState(false);
  const [showTextFileSummarizerInMain, setShowTextFileSummarizerInMain] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' }); // New state for notification

  // Load notebooks from localStorage on mount
  useEffect(() => {
    const loadedNotebooksFromStorage = getNotebooks();
    const migratedNotebooks = loadedNotebooksFromStorage.map(notebook => ({
        ...notebook,
        sources: (notebook.sources || []).map(source => ({
            ...source,
            // Default to true if property is missing (for migration)
            isSelectedForChat: source.isSelectedForChat === undefined ? true : source.isSelectedForChat
        }))
    }));
    setNotebooks(migratedNotebooks);
    // Optionally, select the first notebook by default or the last selected one
    if (migratedNotebooks.length > 0) {
      // setSelectedNotebookId(migratedNotebooks[0].id);
    }
  }, []);

  const handleSelectNotebook = (notebookId) => {
    setSelectedNotebookId(notebookId);
    // setSelectedSourceId(null); // No longer needed
  };

  // Removed handleSelectSource function

  const handleAddNotebook = () => {
    const title = prompt("Enter new notebook title:", `Untitled notebook ${notebooks.length + 1}`);
    if (title) {
      const newNotebook = {
        id: Date.now(), // Simple unique ID
        title: title,
        createdAt: new Date().toISOString(),
        sources: []
      };
      const updatedNotebooks = [...notebooks, newNotebook];
      setNotebooks(updatedNotebooks);
      saveNotebooksToStorage(updatedNotebooks);
      setSelectedNotebookId(newNotebook.id); // Select the new notebook
      // setSelectedSourceId(null); // No longer needed
    }
  };

  const handleAddSourceToNotebook = useCallback((notebookId, sourceData) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === notebookId) {
        // Initialize new source with isSelectedForChat: true
        const newSource = { ...sourceData, id: Date.now(), isSelectedForChat: true };
        return { ...nb, sources: [...(nb.sources || []), newSource] };
      }
      return nb;
    });
    setNotebooks(updatedNotebooks);
    saveNotebooksToStorage(updatedNotebooks);
  }, [notebooks]);

  const handleToggleSourceChatSelection = useCallback((notebookId, sourceId, isSelected) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === notebookId) {
        return {
          ...nb,
          sources: (nb.sources || []).map(source => {
            if (source.id === sourceId) {
              return { ...source, isSelectedForChat: isSelected };
            }
            return source;
          })
        };
      }
      return nb;
    });
    setNotebooks(updatedNotebooks);
    saveNotebooksToStorage(updatedNotebooks);
  }, [notebooks]);

  const handleEditNotebookTitle = useCallback((notebookId) => {
    const notebookToEdit = notebooks.find(nb => nb.id === notebookId);
    if (!notebookToEdit) return;
    const newTitle = prompt("Enter new notebook title:", notebookToEdit.title);
    if (newTitle && newTitle !== notebookToEdit.title) {
      const updatedNotebooks = notebooks.map(nb =>
        nb.id === notebookId ? { ...nb, title: newTitle, updatedAt: new Date().toISOString() } : nb
      );
      setNotebooks(updatedNotebooks);
      saveNotebooksToStorage(updatedNotebooks);
    }
  }, [notebooks]);

  const handleDeleteNotebook = useCallback((notebookId) => {
    if (window.confirm("Are you sure you want to delete this notebook and all its sources? This action cannot be undone.")) {
      const updatedNotebooks = notebooks.filter(nb => nb.id !== notebookId);
      setNotebooks(updatedNotebooks);
      saveNotebooksToStorage(updatedNotebooks);
      if (selectedNotebookId === notebookId) {
        setSelectedNotebookId(updatedNotebooks.length > 0 ? updatedNotebooks[0].id : null);
        // setSelectedSourceId(null); // No longer needed
      }
    }
  }, [notebooks, selectedNotebookId]);

  const handleToggleWebsiteSummarizerInMain = (show) => setShowWebsiteSummarizerInMain(show);
  const handleToggleTextFileSummarizerInMain = (show) => setShowTextFileSummarizerInMain(show);

  const showNotification = (message, type = 'info') => { // New function to show notification
    setNotification({ message, type });
  };

  // Derived state for selected notebook and source (optional, can also be done in child components)
  const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);
  // Removed selectedSource derived variable

  const handleUpdateNotebook = useCallback((notebookId, updatedProps) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === notebookId) {
        return { ...nb, ...updatedProps, updatedAt: new Date().toISOString() }; // Merge and update timestamp
      }
      return nb;
    });
    setNotebooks(updatedNotebooks);
    saveNotebooksToStorage(updatedNotebooks);
  }, [notebooks]);

  return (
    <div className="app-container">
      <Sidebar
        notebooks={notebooks}
        selectedNotebookId={selectedNotebookId}
        onSelectNotebook={handleSelectNotebook}
        onAddNotebook={handleAddNotebook}
        onAddSourceToNotebook={handleAddSourceToNotebook}
        // Removed onSelectSource and selectedSourceId props
        onToggleSourceChatSelection={handleToggleSourceChatSelection} // Ensured this is passed
        onEditNotebookTitle={handleEditNotebookTitle}
        onDeleteNotebook={handleDeleteNotebook}
        onToggleWebsiteSummarizer={handleToggleWebsiteSummarizerInMain}
        onToggleTextFileSummarizer={handleToggleTextFileSummarizerInMain}
      />
      <MainContent
        selectedNotebook={selectedNotebook}
        // Removed selectedSource prop
        onUpdateNotebook={handleUpdateNotebook} // Pass this down
        showWebsiteSummarizerInMain={showWebsiteSummarizerInMain}
        onToggleWebsiteSummarizerInMain={handleToggleWebsiteSummarizerInMain}
        showTextFileSummarizerInMain={showTextFileSummarizerInMain}
        onToggleTextFileSummarizerInMain={handleToggleTextFileSummarizerInMain}
        onAddSourceToNotebook={handleAddSourceToNotebook}
        selectedNotebookId={selectedNotebookId}
        onToggleSourceChatSelection={handleToggleSourceChatSelection}
        showNotification={showNotification} // Pass showNotification to MainContent
      />
      <RightSidebar
        selectedNotebook={selectedNotebook}
        showNotification={showNotification}
        onToggleSourceChatSelection={handleToggleSourceChatSelection}
      />
      <Notification
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotification({ message: '', type: '' })}
      />
    </div>
  );
}

export default App;
