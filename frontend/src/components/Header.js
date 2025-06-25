import React from 'react';
import './Header.css'; // We will create this file next

const Header = ({ onNavigateToDashboard }) => {
  return (
    <div className="header-bar">
      <div className="header-logo" onClick={onNavigateToDashboard} style={{ cursor: 'pointer' }}>
        {/* Placeholder for actual logo icon */}
        <span role="img" aria-label="logo-icon" style={{ marginRight: '8px', fontSize: '1.5em' }}>📚</span>
        NotebookLM
      </div>
      <div className="header-actions">
        {/* Placeholders for right-side elements */}
        <button className="header-button">设置</button>
        <span className="header-pro-tag">PRO</span>
        <button className="header-button app-switcher">
          {/* Placeholder for 3x3 dot icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="6" r="2"/>
            <circle cx="12" cy="6" r="2"/>
            <circle cx="18" cy="6" r="2"/>
            <circle cx="6" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="18" cy="12" r="2"/>
            <circle cx="6" cy="18" r="2"/>
            <circle cx="12" cy="18" r="2"/>
            <circle cx="18" cy="18" r="2"/>
          </svg>
        </button>
        <div className="header-avatar">
          {/* Placeholder for avatar - e.g., an astronaut */}
          <span role="img" aria-label="user-avatar" style={{ fontSize: '1.8em' }}>🧑‍🚀</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
