import React, { useState, useEffect, useRef } from 'react';

const MainContent = ({ selectedNotebook, selectedSource, onUpdateNotebook }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null); // For scrolling to bottom

  // Effect to load/clear chat history when selectedNotebook changes
  useEffect(() => {
    if (selectedNotebook && selectedNotebook.chatHistory) {
      setChatMessages(selectedNotebook.chatHistory);
    } else {
      setChatMessages([]); // Clear messages if no notebook or no history
    }
  }, [selectedNotebook]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatInputChange = (event) => {
    setChatInput(event.target.value);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !selectedNotebook) return;

    const userMessage = { id: Date.now(), sender: 'user', text: chatInput.trim() };
    // More sophisticated AI response would involve actual API call and context from selectedSource
    const aiResponseText = selectedSource
      ? `AI response for '${selectedSource.name}' in notebook '${selectedNotebook.title}' (placeholder): You asked about: '${chatInput.trim()}'`
      : `AI response for notebook '${selectedNotebook.title}' (placeholder): You said: '${chatInput.trim()}'`;
    const aiMessage = { id: Date.now() + 1, sender: 'ai', text: aiResponseText };

    const newMessages = [...chatMessages, userMessage, aiMessage];
    setChatMessages(newMessages);

    // Persist chat history
    if (onUpdateNotebook && selectedNotebook) {
      onUpdateNotebook(selectedNotebook.id, { chatHistory: newMessages });
    }

    setChatInput('');
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
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </div>
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyPress={handleKeyPress} // Send on Enter
              placeholder="Type your message here..."
              disabled={!selectedNotebook} // Disable if no notebook selected
            />
            <button
                onClick={handleSendChatMessage}
                className="primary"
                disabled={!selectedNotebook || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;
