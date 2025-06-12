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
    <div>
      <h4>Generate Report for "{notebook.title}"</h4>
      {notebook.sources && notebook.sources.length > 0 ? (
        <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginTop: '10px', marginBottom: '10px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notebook.sources.map(source => (
              <li key={source.id} style={{ padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedSourcesMap[source.id] || false}
                    onChange={() => handleCheckboxChange(source.id)}
                    style={{ marginRight: '10px' }}
                  />
                  {source.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>This notebook has no sources.</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
        <button onClick={onClose} disabled={generatingReports}>
          Cancel
        </button>
        <button
          onClick={handleGenerateClick}
          className="primary"
          disabled={!isAnySourceSelected || generatingReports}
        >
          {generatingReports ? 'Generating...' : 'Generate Report'}
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
