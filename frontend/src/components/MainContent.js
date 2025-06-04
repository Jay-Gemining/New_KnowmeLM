import React, { useState, useEffect, useRef } from 'react';

const MainContent = ({ selectedNotebook, selectedSource, onUpdateNotebook }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null); // For scrolling to bottom
  const chatMessagesRef = useRef(chatMessages); // Ref to keep track of messages for async updates

  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Effect to load/clear chat history when selectedNotebook changes
  useEffect(() => {
    if (selectedNotebook && selectedNotebook.chatHistory) {
      setChatMessages(selectedNotebook.chatHistory);
    } else {
      setChatMessages([]);
    }
    setChatError(null); // Clear errors when notebook changes
  }, [selectedNotebook]);

  // Keep chatMessagesRef updated with chatMessages state
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleSendChatMessage = async () => {
    const currentMessageText = chatInput.trim();
    if (!currentMessageText || !selectedNotebook) return;

    const newUserMessage = { id: Date.now(), sender: 'user', text: currentMessageText };

    // Update UI immediately with user's message
    setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
    setChatInput('');
    setIsAiResponding(true);
    setChatError(null);

    // Filter sources based on isSelectedForChat, then map to summaries
    const summaries = selectedNotebook?.sources
        ?.filter(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat) // Default to true if undefined
        .map(s => s.summary) || [];

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
      const TerrorMessage = error.message || 'Failed to get response from AI.';
      setChatError(TerrorMessage);
      const errorAiMessage = { id: Date.now() + 1, sender: 'ai', text: `Error: ${TerrorMessage}` };
      setChatMessages(prevMessages => [...prevMessages, errorAiMessage]);
       // Persist history even if there's an error message from AI side
      if (onUpdateNotebook && selectedNotebook) {
        const finalHistoryWithError = [...(chatMessagesRef.current || []), errorAiMessage];
        onUpdateNotebook(selectedNotebook.id, { chatHistory: finalHistoryWithError });
      }
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line in the input
      handleSendChatMessage();
    }
  };

  return (
    <div className="main-content"> {/* Ensure this has display: flex, flex-direction: column */}
      <div className="content-above-chat"> {/* Wraps existing content */}
        {!selectedNotebook && !selectedSource && (
        <div className="placeholder-message">
          <h2>Welcome to KnowmeLM!</h2>
          <p>Select or create a notebook from the sidebar to get started.</p>
        </div>
      )}

      {selectedNotebook && !selectedSource && (
        <div className="content-above-chat"> {/* Use content-above-chat for consistency if needed, or direct styling */}
          <h2 style={{textAlign: 'center'}}>{selectedNotebook.title}</h2>
          <p className="placeholder-message-main">Select a source from the sidebar to view its details, or add a new source to this notebook.</p>
          {selectedNotebook.sources && selectedNotebook.sources.length > 0 && (
            <div style={{marginTop: '20px', textAlign: 'left', maxWidth: '400px', margin: '20px auto'}}>
              <h4>Sources in this notebook:</h4>
              <ul style={{listStyle: 'none', paddingLeft: '0'}}>
                {selectedNotebook.sources.map(source => (
                  <li key={source.id} style={{padding: '5px 0', borderBottom: '1px solid #eee', cursor: 'default', color: '#5f6368'}}>
                     {source.type === 'youtube' ? '📺' : '📄'} {source.name.length > 40 ? source.name.substring(0,40) + '...' : source.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {selectedSource && (
        <div className="source-detail-view">
          <h3>{selectedSource.name}</h3>
          <p className="source-type">Type: {selectedSource.type}</p>
          <h4>Summary:</h4>
          <div className="source-summary-content">
            {selectedSource.summary || "No summary available for this source."}
          </div>
          <p className="source-timestamp">
            Added on: {new Date(selectedSource.timestamp).toLocaleString()}
          </p>
        </div>
      )}
      </div> {/* End of content-above-chat */}

      {selectedNotebook && (
        <div className="chat-area">
          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-message ${msg.sender}`}>
                {/* Basic sanitization or use a library if HTML in responses is a concern */}
                {msg.text.split('\n').map((line, index) => <span key={index}>{line}<br/></span>)}
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </div>
          {isAiResponding && <p style={{textAlign: 'center', fontStyle: 'italic', color: '#5f6368'}}>AI is thinking...</p>}
          {chatError && <p style={{textAlign: 'center', color: 'red'}}>Error: {chatError}</p>}
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={handleKeyPress} // Send on Enter
              placeholder={selectedNotebook ? "Type your message here..." : "Select a notebook to chat"}
              disabled={!selectedNotebook || isAiResponding}
            />
            <button
                onClick={handleSendChatMessage}
                className="primary"
                disabled={!selectedNotebook || !chatInput.trim() || isAiResponding}
            >
              {isAiResponding ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
