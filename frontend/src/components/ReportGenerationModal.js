import React, { useState, useEffect } from 'react';

const ReportGenerationModal = ({ notebook, onClose, onGenerateReport, generatingReports, reportGenerationStatus }) => {
  const [selectedSourcesMap, setSelectedSourcesMap] = useState({});

  // Effect to initialize selectedSourcesMap based on notebook sources
  useEffect(() => {
    if (notebook && notebook.sources) {
      const initialMap = notebook.sources.reduce((acc, source) => {
        acc[source.id] = source.isSelectedForChat === undefined ? true : source.isSelectedForChat;
        return acc;
      }, {});
      setSelectedSourcesMap(initialMap);
    }
  }, [notebook]);

  const handleCheckboxChange = (sourceId) => {
    setSelectedSourcesMap(prevMap => ({
      ...prevMap,
      [sourceId]: !prevMap[sourceId]
    }));
  };

  const isAnySourceSelected = Object.values(selectedSourcesMap).some(isSelected => isSelected);

  const handleGenerateClick = () => {
    if (!notebook || !notebook.sources) return;

    const selectedSourceDetails = notebook.sources.filter(
      source => selectedSourcesMap[source.id]
    );

    // Call the passed-in onGenerateReport function with the full source details
    onGenerateReport(selectedSourceDetails);
    onClose(); // Close modal immediately after initiating report generation
  };

  if (!notebook) {
    return <p>No notebook selected.</p>; // Should ideally not happen if modal is opened correctly
  }

  return (
    // The parent div for modal content is styled by Modal.css
    // We are styling the internal layout of the ReportGenerationModal specifically
    <div>
      <h4>Generate Report for "{notebook.title}"</h4>
      {notebook.sources && notebook.sources.length > 0 ? (
        // Using class names similar to those in RightSidebar for source listing
        <div className="source-selection-container" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)'}}>
          {/* Removed h4 from here as it's redundant with modal title, or rephrase if needed */}
          <ul className="main-source-list"> {/* Re-using class from App.css potentially */}
            {notebook.sources.map(source => (
              <li key={source.id} className="main-source-list-item"> {/* Re-using class */}
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%', padding: 'var(--spacing-xs) 0' }}>
                  <input
                    type="checkbox"
                    checked={selectedSourcesMap[source.id] || false}
                    onChange={() => handleCheckboxChange(source.id)}
                    style={{ marginRight: 'var(--spacing-md)' }} // Use variable
                  />
                  <span className="source-name">{source.name}</span> {/* Added class for consistent styling */}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0', color: 'var(--color-text-secondary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)', display: 'block' }}>
                filter_none
            </span>
            <p style={{ fontSize: 'var(--font-size-base)', margin: 0, color: 'var(--color-text-primary)' }}>
                No sources available.
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)'}}>
                Add sources to this notebook to generate a report.
            </p>
        </div>
      )}
      {/* Using button-group class for styling button containers */}
      <div className="button-group" style={{ marginTop: 'var(--spacing-xl)', justifyContent: 'flex-end' }}>
        <button onClick={onClose} disabled={generatingReports} className="secondary"> {/* Changed to secondary */}
          Cancel
        </button>
        <button
          onClick={handleGenerateClick}
          className="action" /* Changed to action */
          disabled={!isAnySourceSelected || generatingReports}
        >
          {generatingReports ? 'Generating...' : (
            <>
              <span className="material-symbols-outlined" style={{ marginRight: 'var(--spacing-sm)'}}>summarize</span>
              Generate Report
            </>
          )}
        </button>
      </div>
      {/* Optional: Display detailed status from reportGenerationStatus if needed in modal */}
      {/* {generatingReports && reportGenerationStatus && reportGenerationStatus.length > 0 && (
        <div style={{marginTop: '10px', maxHeight: '100px', overflowY: 'auto'}}>
          {reportGenerationStatus.map(s => (
            <p key={s.id} style={{fontSize: '0.9em', margin: '2px 0'}}>
              <em>{s.name}: {s.status}{s.message ? ` - ${s.message}` : ''}</em>
            </p>
          ))}
        </div>
      )} */}
    </div>
  );
};

export default ReportGenerationModal;
