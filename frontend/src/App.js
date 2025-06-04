import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import NotebookDetail from './components/NotebookDetail'; // Import NotebookDetail

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'notebookDetail'
  const [selectedNotebookId, setSelectedNotebookId] = useState(null);

  const navigateToNotebook = (notebookId) => {
    setSelectedNotebookId(notebookId);
    setCurrentView('notebookDetail');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedNotebookId(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <h1>AI Content Summarizer</h1>
          {currentView !== 'dashboard' && (
            <button onClick={navigateToDashboard} style={{ marginRight: '20px', padding: '8px 15px' }}>
              Back to Dashboard
            </button>
          )}
        </div>
      </header>
      <main>
        {currentView === 'dashboard' && (
          <Dashboard onNavigateToNotebook={navigateToNotebook} />
        )}
        {currentView === 'notebookDetail' && selectedNotebookId && (
          <NotebookDetail
            notebookId={selectedNotebookId}
            onNavigateToDashboard={navigateToDashboard}
          />
        )}
      </main>
    </div>
  );
}

export default App;
