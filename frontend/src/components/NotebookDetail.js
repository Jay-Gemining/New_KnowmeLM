import React, { useState, useEffect, useCallback } from 'react';
import { getNotebookById, updateNotebook } from '../utils/localStorageHelper';
import YoutubeSummarizer from './YoutubeSummarizer';
import TextFileSummarizer from './TextFileSummarizer';

function NotebookDetail({ notebookId, onNavigateToDashboard }) {
    const [notebook, setNotebook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotebook = useCallback(() => {
        setIsLoading(true);
        try {
            const fetchedNotebook = getNotebookById(notebookId);
            if (fetchedNotebook) {
                setNotebook(fetchedNotebook);
                setError(null);
            } else {
                setError('Notebook not found.');
                setNotebook(null);
            }
        } catch (e) {
            setError('Failed to load notebook data.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [notebookId]);

    useEffect(() => {
        fetchNotebook();
    }, [fetchNotebook]);

    const handleAddSource = (sourceData) => {
        if (!notebook) return;

        const newSource = {
            id: Date.now(), // Unique ID for the source
            ...sourceData,
        };

        const updatedSources = notebook.sources ? [...notebook.sources, newSource] : [newSource];
        const updatedNotebookData = { ...notebook, sources: updatedSources };

        try {
            updateNotebook(updatedNotebookData);
            setNotebook(updatedNotebookData); // Update local state to re-render
        } catch (e) {
            console.error("Failed to update notebook with new source:", e);
            setError("Failed to save new source. Please try again.");
            // Optionally, revert notebook state if save fails, though localStorage is usually reliable
        }
    };

    if (isLoading) return <p>Loading notebook...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!notebook) return <p>Notebook not found. <button onClick={onNavigateToDashboard}>Go to Dashboard</button></p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{notebook.title}</h2>
                {/* Back button is in App.js header, but can be added here too if design prefers */}
            </div>

            <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '5px' }}>
                <h3>Add New Source</h3>
                <YoutubeSummarizer onSummaryComplete={handleAddSource} />
                <hr style={{ margin: '20px 0' }} />
                <TextFileSummarizer onSummaryComplete={handleAddSource} />
            </div>

            <h3>Sources in this Notebook:</h3>
            {notebook.sources && notebook.sources.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {notebook.sources.slice().reverse().map((source) => ( // Show newest first
                        <li key={source.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                            <strong>Type:</strong> {source.type === 'youtube' ? 'YouTube Video' : 'Text File'}<br />
                            <strong>Name:</strong> {source.name}<br />
                            <strong>Date Added:</strong> {new Date(source.timestamp).toLocaleString()}<br />
                            <strong>Summary:</strong>
                            <p style={{ whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '5px' }}>
                                {source.summary || "No summary available."}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No sources yet. Add one using the forms above!</p>
            )}
        </div>
    );
}

export default NotebookDetail;
