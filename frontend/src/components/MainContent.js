import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Removed getHtmlReport, saveHtmlReport

const MainContent = ({
  selectedNotebook,
  // selectedSource, // Removed prop
  onUpdateNotebook,
  // showWebsiteSummarizerInMain, // Removed
  // onToggleWebsiteSummarizerInMain, // Removed
  // showTextFileSummarizerInMain, // Removed
  // onToggleTextFileSummarizerInMain, // Removed
  onAddSourceToNotebook, // Kept for potential future use or if other parts of MainContent need it
  selectedNotebookId, // Kept for potential future use
  onToggleSourceChatSelection,
  showNotification // Destructure showNotification
}) => {
  // Removed activeTab state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(chatMessages);

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatError, setChatError] = useState(null); // Will be used with showNotification
  // Removed generatingReports, reportGenerationStatus
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

  // Removed useEffect that resets activeTab

  // Removed handleSummaryCompleteInMain function

  // Removed displayErrorInNewTab and handleGenerateReportForSelectedSources functions

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
    // Removed if (selectedSource) block
    if (selectedNotebook && selectedNotebook.sources) {
      const activeSources = selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat);
      if (activeSources.length === 0 && selectedNotebook.sources.length > 0) {
        contextDescription = "Context: All sources in this notebook are available. Select specific sources in the sidebar to focus the chat.";
      } else if (activeSources.length === 1) {
        contextDescription = `Context: ${activeSources[0].name}`;
      } else if (activeSources.length > 1) {
        contextDescription = `Context: ${activeSources.length} selected sources.`;
      } else { // No sources selected, but notebook exists
        contextDescription = "Context: General chat for this notebook. No specific sources selected.";
      }
    } else if (selectedNotebook) { // Notebook exists but has no sources
      contextDescription = "Context: General chat for this notebook.";
    } else { // No notebook selected
      contextDescription = "";
    }
    setChatContextInfo(contextDescription);
  }, [selectedNotebook]); // Dependency only on selectedNotebook (and its inner properties like sources)

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
    const updatedChatMessagesForAPI = [...chatMessages, newUserMessage];

    setChatMessages(updatedChatMessagesForAPI);

    setChatInput('');
    const textarea = document.querySelector('.chat-input-area textarea');
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
    }

    setIsAiResponding(true);
    setChatError(null);

    let summaries = [];
    // Context description is now set by useEffect, but we still need to determine summaries for API
    // Removed if (selectedSource && activeTab === 'chat') condition
    if (selectedNotebook && selectedNotebook.sources) {
      const activeSources = selectedNotebook.sources.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat);

      summaries = activeSources.map(s => {
        // Check if s.summary is likely an error message from our backend's summarization process.
        // These checks should align with error strings returned by `generate_detailed_summary_with_ai`.
        const summaryIsError = s.summary && (
            s.summary.startsWith("Error: OpenAI API key not configured") ||
            s.summary.startsWith("LLM returned a very short or empty summary for") ||
            s.summary.startsWith("Error generating detailed summary for")
        );

        if (summaryIsError) {
          // If summary is an error, and original_content exists, use original_content.
          // Ensure original_content is not null/undefined before using.
          return s.original_content || ""; // Fallback to empty string if original_content is also missing
        } else {
          // Otherwise, use the summary (which should be the detailed one).
          return s.summary;
        }
      }).filter(Boolean); // Keep the filter to remove empty strings that might result from fallbacks.
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
          chat_history: updatedChatMessagesForAPI
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

  // Removed SourceDetailViewWithTabs component

  // Main return statement for MainContent
  return (
    <div className="main-content">

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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
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
