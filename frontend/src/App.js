import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Import new CSS
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { getNotebooks, saveNotebooks as saveNotebooksToStorage } from './utils/localStorageHelper'; // Renamed for clarity

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  // Load notebooks from localStorage on mount
  useEffect(() => {
    const loadedNotebooks = getNotebooks();
    setNotebooks(loadedNotebooks);
    // Optionally, select the first notebook by default or the last selected one
    if (loadedNotebooks.length > 0) {
      // setSelectedNotebookId(loadedNotebooks[0].id);
    }
  }, []);

  const handleSelectNotebook = (notebookId) => {
    setSelectedNotebookId(notebookId);
    setSelectedSourceId(null); // Clear source selection when notebook changes
  };

  const handleSelectSource = (sourceId) => {
    setSelectedSourceId(sourceId);
  };

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
      setSelectedSourceId(null);
    }
  };

  const handleAddSourceToNotebook = useCallback((notebookId, sourceData) => {
    const updatedNotebooks = notebooks.map(nb => {
      if (nb.id === notebookId) {
        const newSource = { ...sourceData, id: Date.now() };
        return { ...nb, sources: [...(nb.sources || []), newSource] };
      }
      return nb;
    });
    setNotebooks(updatedNotebooks);
    saveNotebooksToStorage(updatedNotebooks);
    // Optionally, select the new source
    // const newSourceInArray = updatedNotebooks.find(nb => nb.id === notebookId)?.sources.find(s => s.id === sourceData.id);
    // if(newSourceInArray) setSelectedSourceId(newSourceInArray.id);

  }, [notebooks]);

  // Derived state for selected notebook and source (optional, can also be done in child components)
  const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);
  const selectedSource = selectedNotebook?.sources.find(src => src.id === selectedSourceId);

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
        onSelectSource={handleSelectSource}
        selectedSourceId={selectedSourceId}
      />
      <MainContent
        selectedNotebook={selectedNotebook}
        selectedSource={selectedSource}
        onUpdateNotebook={handleUpdateNotebook} // Pass this down
      />
    </div>
  );
}

export default App;
