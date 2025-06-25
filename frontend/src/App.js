import React, { useState, useEffect, useCallback } from 'react';
import './App.css'; // Import new CSS
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar'; // Import RightSidebar
import Dashboard from './components/Dashboard'; // Import Dashboard
import Notification from './components/Notification'; // New import
import './components/Notification.css'; // New import for CSS
import Modal from './components/Modal'; // Import Modal
import WebsiteSummarizer from './components/WebsiteSummarizer'; // Import WebsiteSummarizer
import TextFileSummarizer from './components/TextFileSummarizer'; // Import TextFileSummarizer
import ReportGenerationModal from './components/ReportGenerationModal'; // Import ReportGenerationModal
import { getNotebooks, saveNotebooks as saveNotebooksToStorage, getHtmlReport, saveHtmlReport } from './utils/localStorageHelper'; // Renamed for clarity, added report helpers

function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'notebookWorkspace'
  const [activeModal, setActiveModal] = useState(null); // New state for active modal
  const [notification, setNotification] = useState({ message: '', type: '' }); // New state for notification
  const [generatingReports, setGeneratingReports] = useState(false); // Moved from RightSidebar
  const [reportGenerationStatus, setReportGenerationStatus] = useState([]); // Moved from RightSidebar


  // Load notebooks from localStorage on mount
  // Determine currentView based on selectedNotebookId
  useEffect(() => {
    if (selectedNotebookId) {
      setCurrentView('notebookWorkspace');
    } else {
      setCurrentView('dashboard');
    }
  }, [selectedNotebookId]);

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
  };

  // Renamed from handleAddNotebook for clarity in Dashboard context
  const handleCreateNewNotebook = (title = `Untitled notebook ${notebooks.length + 1}`) => {
    // const title = prompt("Enter new notebook title:", `Untitled notebook ${notebooks.length + 1}`);
    // For now, let's use a default title as per PRD, can be changed later via rename from dashboard
    const newNotebook = {
      id: Date.now(), // Simple unique ID
      title: title,
      createdAt: new Date().toISOString(),
      sources: [],
      chatHistory: [] // Initialize chat history
    };
    const updatedNotebooks = [...notebooks, newNotebook];
    setNotebooks(updatedNotebooks);
    saveNotebooksToStorage(updatedNotebooks);
    setSelectedNotebookId(newNotebook.id); // Select the new notebook to navigate to workspace
    return newNotebook.id; // Return new notebook ID
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
      }
    }
  }, [notebooks, selectedNotebookId]);

  const handleCloseModal = () => setActiveModal(null);

  const handleSummaryCompleteAndCloseModal = (summaryData) => {
    if (selectedNotebookId) {
      handleAddSourceToNotebook(selectedNotebookId, summaryData);
      showNotification(`Source '${summaryData.name}' added successfully!`, 'success');
    } else {
      showNotification('No notebook selected. Cannot add source.', 'error');
    }
    handleCloseModal();
  };

  const showNotification = (message, type = 'info') => { // New function to show notification
    setNotification({ message, type });
  };

  // Derived state for selected notebook
  const selectedNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

  // Moved from RightSidebar.js
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

  // Moved from RightSidebar.js and modified to accept sourcesToReport
  const handleGenerateReportForSelectedSources = async (sourcesToReport) => {
    if (!selectedNotebook) {
      showNotification("No notebook selected for report generation.", 'error');
      return;
    }
    if (!sourcesToReport || sourcesToReport.length === 0) {
      showNotification("No sources provided for report generation.", 'info');
      return;
    }

    setGeneratingReports(true);
    setReportGenerationStatus(sourcesToReport.map(s => ({ id: s.id, name: s.name, status: 'pending' })));
    showNotification('Report generation process initiated for selected sources.', 'info');

    for (const source of sourcesToReport) {
      setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'generating' } : s));

      const cachedHtml = getHtmlReport(selectedNotebook.id, source.id);
      if (cachedHtml) {
        const newTabCached = window.open('', '_blank');
        if (newTabCached) {
          newTabCached.document.open();
          newTabCached.document.write(cachedHtml);
          newTabCached.document.close();
          newTabCached.focus();
          setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'cached' } : s));
          continue;
        }
      }

      const newTab = window.open('', '_blank');
      if (!newTab) {
        showNotification(`Popup blocker prevented opening tab for ${source.name}`, 'error');
        setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: 'Popup blocker' } : s));
        continue;
      }
      newTab.document.open();
      newTab.document.write(`<!DOCTYPE html><html><head><title>Generating Report for ${source.name}</title><body><h1>Generating Report...</h1><p>Please wait for ${source.name}.</p></body></html>`);
      newTab.document.close();

      try {
        const response = await fetch('http://localhost:5001/generate-html-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary_text: source.summary, title: source.name }),
        });
        if (response.ok) {
          const data = await response.json();
          if (newTab && !newTab.closed) {
            newTab.document.open();
            newTab.document.write(data.html_content);
            newTab.document.close();
            saveHtmlReport(selectedNotebook.id, source.id, data.html_content);
            newTab.focus();
            setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'success' } : s));
          } else {
             setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: 'Tab closed by user' } : s));
          }
        } else {
          const errorData = await response.json().catch(() => response.text());
          displayErrorInNewTab(newTab, 'API Report Generation Error', `API Error for ${source.name}: Status ${response.status}`, errorData);
          setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: `API Error: ${response.status}` } : s));
        }
      } catch (error) {
         displayErrorInNewTab(newTab, 'Network Report Generation Error', `Network Error for ${source.name}: ${error.message}`);
         setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: error.message } : s));
      }
    }
    setGeneratingReports(false);
  };


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
      {currentView === 'dashboard' ? (
        <Dashboard
          notebooks={notebooks}
          onNavigateToNotebook={handleSelectNotebook} // Used to select and switch view
          onCreateNotebook={handleCreateNewNotebook} // Used to create and switch view
          onEditNotebookTitle={handleEditNotebookTitle}
          onDeleteNotebook={handleDeleteNotebook}
          // TODO: Add other props like sorting, view toggle handlers later
        />
      ) : (
        <>
          <Sidebar
            notebooks={notebooks} // Still needed for context, though not primary display
            selectedNotebookId={selectedNotebookId}
            onSelectNotebook={handleSelectNotebook} // To switch between notebooks if needed from here
            onAddNotebook={handleCreateNewNotebook} // Or a more specific "add source" trigger
            onAddSourceToNotebook={handleAddSourceToNotebook}
            onToggleSourceChatSelection={handleToggleSourceChatSelection}
            onEditNotebookTitle={handleEditNotebookTitle}
            onDeleteNotebook={(notebookId) => {
              handleDeleteNotebook(notebookId);
              // If the deleted notebook was the selected one, go back to dashboard
              if (selectedNotebookId === notebookId) {
                setSelectedNotebookId(null);
              }
            }}
            onToggleWebsiteSummarizer={() => setActiveModal('website')}
            onToggleTextFileSummarizer={() => setActiveModal('file')}
            onNavigateToDashboard={() => setSelectedNotebookId(null)} // Prop to go to dashboard
          />
          <MainContent
            selectedNotebook={selectedNotebook}
            onUpdateNotebook={handleUpdateNotebook}
            onAddSourceToNotebook={handleAddSourceToNotebook}
            selectedNotebookId={selectedNotebookId}
            onToggleSourceChatSelection={handleToggleSourceChatSelection}
            showNotification={showNotification}
          />
          <RightSidebar
            selectedNotebook={selectedNotebook}
            showNotification={showNotification}
            onToggleSourceChatSelection={handleToggleSourceChatSelection}
            onOpenReportModal={() => setActiveModal('reportGeneration')}
          />
        </>
      )}
      <Notification
        message={notification.message}
        type={notification.type}
        onDismiss={() => setNotification({ message: '', type: '' })}
      />
      {activeModal && (
        <Modal isOpen={!!activeModal} onClose={handleCloseModal}>
          {activeModal === 'website' && (
            <WebsiteSummarizer
              onSummaryComplete={handleSummaryCompleteAndCloseModal}
              onCancel={handleCloseModal}
            />
          )}
          {activeModal === 'file' && (
            <TextFileSummarizer
              onSummaryComplete={handleSummaryCompleteAndCloseModal}
              onCancel={handleCloseModal}
            />
          )}
          {activeModal === 'reportGeneration' && (
            <ReportGenerationModal
              notebook={selectedNotebook}
              onClose={handleCloseModal}
              onGenerateReport={handleGenerateReportForSelectedSources}
              generatingReports={generatingReports}
              reportGenerationStatus={reportGenerationStatus}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

export default App;
