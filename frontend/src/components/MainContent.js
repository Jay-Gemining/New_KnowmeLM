import React, { useState, useEffect, useRef } from 'react';
import YoutubeSummarizer from './YoutubeSummarizer';
import TextFileSummarizer from './TextFileSummarizer';
import { getHtmlReport, saveHtmlReport } from '../utils/localStorageHelper'; // Added import

const MainContent = ({
  selectedNotebook,
  selectedSource,
  onUpdateNotebook,
  showYoutubeSummarizerInMain, // New
  onToggleYoutubeSummarizerInMain,
  showTextFileSummarizerInMain,
  onToggleTextFileSummarizerInMain,
  onAddSourceToNotebook,
  selectedNotebookId,
  onToggleSourceChatSelection,
  showNotification // Destructure showNotification
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(chatMessages);

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatError, setChatError] = useState(null); // Will be used with showNotification
  const [generatingReports, setGeneratingReports] = useState(false);
  const [reportGenerationStatus, setReportGenerationStatus] = useState([]);
  const [chatContextInfo, setChatContextInfo] = useState('');

  // Effect to load/clear chat history when selectedNotebook changes
  useEffect(() => {
    if (selectedNotebook && selectedNotebook.chatHistory) {
      setChatMessages(selectedNotebook.chatHistory);
    } else {
      setChatMessages([]);
    }
    setChatError(null); // Clear errors when notebook changes
  }, [selectedNotebook]);

  // Reset activeTab when selectedSource changes
  useEffect(() => {
    if (selectedSource) {
      setActiveTab('chat'); // Default to 'chat' or 'summary' as preferred
    }
  }, [selectedSource]);

  const handleSummaryCompleteInMain = (summaryData) => {
    if (selectedNotebookId) {
      onAddSourceToNotebook(selectedNotebookId, summaryData);
      showNotification(`Source '${summaryData.name}' added successfully!`, 'success'); // Notification
    }
    onToggleYoutubeSummarizerInMain(false);
    onToggleTextFileSummarizerInMain(false);
  };

  // Helper function to display error in new tab
  const displayErrorInNewTab = (tab, errorTitle, errorMessage, errorDetails = "") => {
    // This function's implementation is provided in the prompt and should be inserted here.
    // For brevity in this diff, assuming it's correctly implemented as per prompt.
    // (Actual implementation involves writing HTML to the new tab)
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

  const handleGenerateReportForSelectedSources = async () => {
    if (!selectedNotebook || !selectedNotebook.sources) return;
    const sourcesToReport = selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat);
    if (sourcesToReport.length === 0) {
      showNotification("No sources selected for report generation.", 'info'); // Notification
      return;
    }

    setGeneratingReports(true);
    setReportGenerationStatus(sourcesToReport.map(s => ({ id: s.id, name: s.name, status: 'pending' })));
    showNotification('Report generation process initiated for selected sources.', 'info'); // Notification

    for (const source of sourcesToReport) {
      setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'generating' } : s));

      const cachedHtml = getHtmlReport(selectedNotebook.id, source.id); // Assuming getHtmlReport is imported
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
        showNotification(`Popup blocker prevented opening tab for ${source.name}`, 'error'); // Notification
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
          if (newTab && !newTab.closed) newTab.document.body.innerHTML = `<h1>Error</h1><p>API Error: ${response.status}. ${JSON.stringify(errorData)}</p>`;
          setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: `API Error: ${response.status}` } : s));
        }
      } catch (error) {
         if (newTab && !newTab.closed) newTab.document.body.innerHTML = `<h1>Error</h1><p>Network Error: ${error.message}</p>`;
        setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: error.message } : s));
      }
    }
    setGeneratingReports(false);
  };

  // Keep chatMessagesRef updated with chatMessages state
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Update chatContextInfo based on selection
  useEffect(() => {
    let contextDescription = "";
    if (selectedSource && activeTab === 'chat') {
      contextDescription = `Chatting with: ${selectedSource.name}`;
    } else if (selectedNotebook && selectedNotebook.sources) {
      const activeSources = selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat);
        if (activeSources.length === 0 && selectedNotebook.sources.length > 0) {
          contextDescription = "Context: All sources in this notebook (or select specific sources above).";
      } else if (activeSources.length === 1) {
          contextDescription = `Context: ${activeSources[0].name}`;
      } else if (activeSources.length > 1) {
          contextDescription = `Context: ${activeSources.length} selected sources.`;
      } else {
          contextDescription = "Context: General chat for this notebook.";
      }
    } else if (selectedNotebook) {
      contextDescription = "Context: General chat for this notebook.";
    } else {
      contextDescription = "";
    }
    setChatContextInfo(contextDescription);
  }, [selectedNotebook, selectedSource, activeTab]); // Consider selectedNotebook.sources if it can change independently

  const autoResizeTextarea = (element) => {
    element.style.height = 'auto';
    const maxHeight = 150;
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
  };

  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
    autoResizeTextarea(event.target);
  };

  const handleSendChatMessage = async () => {
    const currentMessageText = chatInput.trim();
    if (!currentMessageText || !selectedNotebook) return;

    const newUserMessage = { id: Date.now(), sender: 'user', text: currentMessageText };
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);

    setChatInput('');
    const textarea = document.querySelector('.chat-input-area textarea');
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
    }

    setIsAiResponding(true);
    setChatError(null);

    let summaries = [];
    // Context description is now set by useEffect, but we still need to determine summaries for API
    if (selectedSource && activeTab === 'chat') {
      summaries = selectedSource.summary ? [selectedSource.summary] : [];
    } else if (selectedNotebook && selectedNotebook.sources) {
      const activeSources = selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat);
      summaries = activeSources.map(s => s.summary).filter(Boolean);
    }
    // If no specific source context, summaries array remains empty, backend handles general chat

    try {
      const response = await fetch('http://localhost:5001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessageText,
          summaries: summaries,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = { id: Date.now() + 1, sender: 'ai', text: data.reply };

      setChatMessages(prevMessages => [...prevMessages, aiMessage]);

      // Persist updated chat history including AI response
      if (onUpdateNotebook && selectedNotebook) {
        // chatMessagesRef.current should have the user message already because setChatMessages for user message was called.
        // However, the state update for chatMessages might not be flushed yet for chatMessagesRef to pick it up
        // if we directly use it here.
        // So, it's safer to construct the new history based on the previous state + new messages.
        const newHistoryForStorage = [...chatMessagesRef.current, aiMessage]; // Assumes ref updated after user msg + ai msg
                                                                                // This might be tricky. Let's directly use the state update pattern
                                                                                // by ensuring chatMessagesRef is updated after each setChatMessages call.
                                                                                // Or, simpler: build the array explicitly.
        const finalHistory = [...(chatMessagesRef.current || []), aiMessage]; // chatMessagesRef.current already includes newUserMessage due to useEffect
        onUpdateNotebook(selectedNotebook.id, { chatHistory: finalHistory });
      }

    } catch (error) {
      console.error('Error fetching AI chat response:', error);
      const terrorMessage = error.message || 'Failed to get response from AI.';
      setChatError(terrorMessage); // This will trigger the useEffect for chatError notification
      // No need to add AI error message to chatMessages here if notification handles it,
      // or keep it if you want error in chat log AND as notification.
      // For now, let's assume notification is sufficient and don't add to chat log.
    } finally {
      setIsAiResponding(false);
    }
  };

  // useEffect for chat error notification
  useEffect(() => {
    if (chatError) {
      showNotification(`Chat Error: ${chatError}`, 'error');
      // setChatError(null); // Optionally clear error after showing notification to prevent re-showing on re-render
    }
  }, [chatError, showNotification]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendChatMessage();
    }
    autoResizeTextarea(event.target); // Also call on key press for dynamic resizing
  };

  // Internal component for Notebook Overview
  const NotebookOverviewContent = () => (
    <div className="notebook-overview">
      <h2 style={{ textAlign: 'center' }}>{selectedNotebook.title}</h2>
      {!(showYoutubeSummarizerInMain || showTextFileSummarizerInMain) && (
        <>
          <p className="placeholder-message-main" style={{ textAlign: 'center', margin: '20px 0' }}>
            Welcome to your notebook! Select a source from the sidebar to view its details,
            or add new sources below.
          </p>
          <div className="add-source-buttons-main-content" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
            <button onClick={() => onToggleYoutubeSummarizerInMain(true)} className="primary icon-button">
              ➕ Add YouTube Source
            </button>
            <button onClick={() => onToggleTextFileSummarizerInMain(true)} className="primary icon-button">
              ➕ Add File Source
            </button>
          </div>
        </>
      )}
      {showYoutubeSummarizerInMain && (
        <div className="summarizer-container-main">
          <YoutubeSummarizer onSummaryComplete={handleSummaryCompleteInMain} />
          <button onClick={() => onToggleYoutubeSummarizerInMain(false)} style={{ marginTop: '10px' }}>Cancel</button>
        </div>
      )}
      {showTextFileSummarizerInMain && (
        <div className="summarizer-container-main">
          <TextFileSummarizer onSummaryComplete={handleSummaryCompleteInMain} />
          <button onClick={() => onToggleTextFileSummarizerInMain(false)} style={{ marginTop: '10px' }}>Cancel</button>
        </div>
      )}
      {!(showYoutubeSummarizerInMain || showTextFileSummarizerInMain) && selectedNotebook.sources && selectedNotebook.sources.length > 0 && (
        <div className="source-selection-container card">
          <h4>Select Sources for Chat / Report</h4>
          <ul className="main-source-list">
            {selectedNotebook.sources.map(source => (
              <li key={source.id} className="main-source-list-item">
                <input
                  type="checkbox"
                  id={`source-select-${source.id}`}
                  checked={source.isSelectedForChat === undefined ? true : source.isSelectedForChat}
                  onChange={(e) => onToggleSourceChatSelection(selectedNotebook.id, source.id, e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <label htmlFor={`source-select-${source.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <span className="source-icon">
                    {source.type === 'youtube' ? '📺' : source.name?.toLowerCase().endsWith('.pdf') ? '📰' : '📄'}
                  </span>
                  <span className="source-name" title={source.name}>{source.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={handleGenerateReportForSelectedSources}
            disabled={generatingReports || selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat).length === 0}
            className="primary"
            style={{ marginTop: '20px', width: '100%' }}
          >
            {generatingReports ? 'Generating Reports...' : 'Generate HTML Report(s) for Selected'}
          </button>
          {generatingReports && (
            <div className="report-status-area" style={{ marginTop: '15px' }}>
              {reportGenerationStatus.map(s => (
                <p key={s.id}><em>{s.name}: {s.status} {s.message ? `- ${s.message}` : ''}</em></p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Internal component for Source Detail View with Tabs
  const SourceDetailViewWithTabs = () => (
    <div className="source-detail-view">
      <div className="source-header">
        <h3>{selectedSource.name}</h3>
        <p className="source-type">Type: {selectedSource.type}</p>
        <p className="source-timestamp">
          Added on: {new Date(selectedSource.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
        <button className={`tab-button ${activeTab === 'original' ? 'active' : ''}`} onClick={() => setActiveTab('original')}>Original Content</button>
        <button className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat with this Source</button>
      </div>
      <div className="tab-content">
        {activeTab === 'summary' && (
          <>
            {selectedSource.type === 'file' ? (
              <p className="empty-state-message">Summary for file sources is available directly through chat. Engage with the AI below using this file as context.</p>
            ) : (
              selectedSource.summary ? <div className="source-summary-content">{selectedSource.summary}</div> : <p>No summary available for this source.</p>
            )}
          </>
        )}
        {activeTab === 'original' && (
          <>
            {selectedSource.type === 'file' ? (
              <p className="empty-state-message">Original content for file sources can be queried via chat if needed, or downloaded (feature to be added).</p>
            ) : (
              selectedSource.type === 'youtube' && selectedSource.originalContent ? <div className="source-original-content">{selectedSource.originalContent}</div> : <p>No original content display available for this source type yet.</p>
            )}
          </>
        )}
        {activeTab === 'chat' && (
          <p className="info-message">The chat below is configured to use <strong>{selectedSource.name}</strong> as primary context. You can also select other sources for a broader discussion (feature to be enhanced in chat section).</p>
        )}
      </div>
    </div>
  );

  // Main return statement for MainContent
  return (
    <div className="main-content">
      <div className="content-above-chat">
        {!selectedNotebook && !selectedSource && (
          <div className="placeholder-message">
            <h2>Welcome to KnowmeLM!</h2>
            <p>Select or create a notebook from the sidebar to get started.</p>
          </div>
        )}
        {selectedNotebook && !selectedSource && <NotebookOverviewContent />}
        {selectedSource && <SourceDetailViewWithTabs />}
      </div>

      {selectedNotebook && (
        <div className="chat-area">
          {chatContextInfo && (
            <div className="chat-context-display">
              {chatContextInfo}
            </div>
          )}
          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {msg.text.split('\n').map((line, index) => <span key={index}>{line}<br/></span>)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {isAiResponding && <div className="ai-thinking-message"><div className="spinner-inline"></div>AI is thinking...</div>}
          <div className="chat-input-area">
            <textarea
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={handleKeyPress}
              placeholder={selectedNotebook ? "Type your message here... (Shift+Enter for new line)" : "Select a notebook to chat"}
              disabled={!selectedNotebook || isAiResponding}
              rows="1"
              style={{ resize: 'none', overflowY: 'auto' }}
            />
            <button
                onClick={handleSendChatMessage}
                className="primary send-button"
                disabled={!selectedNotebook || !chatInput.trim() || isAiResponding}
            >
              {isAiResponding ? "Sending..." : "Send"}
              <span className="send-icon">➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
