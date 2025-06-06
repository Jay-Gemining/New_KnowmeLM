// frontend/src/components/RightSidebar.js
import React, { useState, useEffect } from 'react';
import { getHtmlReport, saveHtmlReport } from '../utils/localStorageHelper'; // Ensure this path is correct

const RightSidebar = ({ selectedNotebook, showNotification, onToggleSourceChatSelection }) => {
  const [generatingReports, setGeneratingReports] = useState(false);
  const [reportGenerationStatus, setReportGenerationStatus] = useState([]);

  // Effect to clear report generation status when notebook changes
  useEffect(() => {
    setGeneratingReports(false);
    setReportGenerationStatus([]);
  }, [selectedNotebook]);

  const displayErrorInNewTab = (tab, errorTitle, errorMessage, errorDetails = "") => {
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
      showNotification("No sources selected for report generation.", 'info');
      return;
    }

    setGeneratingReports(true);
    setReportGenerationStatus(sourcesToReport.map(s => ({ id: s.id, name: s.name, status: 'pending' })));
    showNotification('Report generation process initiated for selected sources.', 'info');

    for (const source of sourcesToReport) {
      setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'generating' } : s));

      const cachedHtml = getHtmlReport(selectedNotebook.id, source.id);
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
        showNotification(`Popup blocker prevented opening tab for ${source.name}`, 'error');
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
          displayErrorInNewTab(newTab, 'API Report Generation Error', `API Error for ${source.name}: Status ${response.status}`, errorData);
          setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: `API Error: ${response.status}` } : s));
        }
      } catch (error) {
         displayErrorInNewTab(newTab, 'Network Report Generation Error', `Network Error for ${source.name}: ${error.message}`);
         setReportGenerationStatus(prev => prev.map(s => s.id === source.id ? { ...s, status: 'error', message: error.message } : s));
      }
    }
    setGeneratingReports(false);
  };

  if (!selectedNotebook) {
    return (
      <div className="right-sidebar-content" style={{ padding: '1rem' }}>
        <p>Select a notebook to see options.</p>
      </div>
    );
  }

  return (
    <div className="right-sidebar-content" style={{ padding: '1rem' }}>
      <h4>{selectedNotebook.title} - Options</h4>
      {selectedNotebook.sources && selectedNotebook.sources.length > 0 ? (
        <div className="source-selection-container card">
          <h5>Select Sources for Report</h5>
          <ul className="main-source-list">
            {selectedNotebook.sources.map(source => (
              <li key={source.id} className="main-source-list-item">
                <input
                  type="checkbox"
                  id={`report-source-select-${source.id}`}
                  checked={source.isSelectedForChat === undefined ? true : source.isSelectedForChat}
                  onChange={(e) => onToggleSourceChatSelection(selectedNotebook.id, source.id, e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <label htmlFor={`report-source-select-${source.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
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
            disabled={generatingReports || !selectedNotebook.sources.some(s => s.isSelectedForChat === undefined ? true : s.isSelectedForChat)}
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
      ) : (
        <p>This notebook has no sources to generate reports from.</p>
      )}
    </div>
  );
};

export default RightSidebar;
