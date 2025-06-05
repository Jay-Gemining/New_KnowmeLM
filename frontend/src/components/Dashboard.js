import React, { useState, useEffect } from 'react';
import { getNotebooks, addNotebook } from '../utils/localStorageHelper';

function Dashboard({ onNavigateToNotebook }) { // Accept onNavigateToNotebook as a prop
    const [notebooks, setNotebooks] = useState([]);

    useEffect(() => {
        setNotebooks(getNotebooks());
    }, []);

    const handleCreateNotebook = () => {
        const newNotebook = {
            id: Date.now(), // Simple unique ID
            title: `Untitled notebook ${notebooks.length + 1}`,
            createdAt: new Date().toISOString(),
            sources: [] // To store summaries later
        };
        const updatedNotebooks = addNotebook(newNotebook);
        setNotebooks(updatedNotebooks);
        // Optionally, navigate to the new notebook immediately
        if (onNavigateToNotebook) {
            onNavigateToNotebook(newNotebook.id);
        }
    };

    return (
        <div>
            <h2>Dashboard</h2>
            <button onClick={handleCreateNotebook} style={{ marginBottom: '20px' }}>
                Create New Notebook
            </button>
            <h3>My Notebooks:</h3>
            {notebooks.length === 0 ? (
                <p>No notebooks yet. Create one to get started!</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {notebooks.map((notebook) => (
                        <li key={notebook.id} style={{ marginBottom: '10px' }}>
                            <button
                                onClick={() => onNavigateToNotebook && onNavigateToNotebook(notebook.id)}
                                style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer', padding: '5px', textAlign: 'left' }}
                            >
                                {notebook.title}
                            </button>
                            <p style={{fontSize: '0.8em', color: 'gray'}}>Created: {new Date(notebook.createdAt).toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Dashboard;
