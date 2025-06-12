// frontend/src/components/RightSidebar.js
import React from 'react'; // Removed useState, useEffect

// Props received: selectedNotebook, showNotification, onToggleSourceChatSelection, onOpenReportModal
// showNotification and onToggleSourceChatSelection are not used here anymore but passed by App.js.
// They can be removed from props if not planned for future use in this component.
// For now, keep them as per current App.js structure.
const RightSidebar = ({ selectedNotebook, showNotification, onToggleSourceChatSelection, onOpenReportModal }) => {

  if (!selectedNotebook) {
    return (
      <div className="right-sidebar-content" style={{ padding: '1rem' }}>
        <p>Select a notebook to see options.</p>
      </div>
    );
  }

  return (
    <div className="right-sidebar-content" style={{ padding: '1rem' }}>
      <button
        onClick={onOpenReportModal} // This prop is from App.js to open the modal
        className="primary"
        style={{ width: 'fit-content', marginTop: '20px' }}
      >
        Generate HTML Report
      </button>
    </div>
  );
};

export default RightSidebar;
