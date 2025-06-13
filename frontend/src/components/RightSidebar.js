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
        className="action" /* Changed from primary to action */
        style={{ width: 'fit-content', marginTop: 'var(--spacing-xl)' }} /* Used CSS variable */
      >
        <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>summarize</span>
        Generate HTML Report
      </button>
    </div>
  );
};

export default RightSidebar;
