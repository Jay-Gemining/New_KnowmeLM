// Helper functions for localStorage

export const getNotebooks = () => {
    try {
        const notebooksJson = localStorage.getItem('notebooks');
        return notebooksJson ? JSON.parse(notebooksJson) : [];
    } catch (error) {
        console.error("Error parsing notebooks from localStorage:", error);
        return []; // Return empty array on error
    }
};

export const saveNotebooks = (notebooks) => {
    try {
        const notebooksJson = JSON.stringify(notebooks);
        localStorage.setItem('notebooks', notebooksJson);
    } catch (error) {
        console.error("Error saving notebooks to localStorage:", error);
    }
};

export const addNotebook = (newNotebook) => {
    const notebooks = getNotebooks();
    const updatedNotebooks = [...notebooks, newNotebook];
    saveNotebooks(updatedNotebooks);
    return updatedNotebooks; // Return updated list for immediate state update
};

// Example of a function to get a single notebook by ID (might be useful later)
export const getNotebookById = (id) => {
    const notebooks = getNotebooks();
    return notebooks.find(notebook => notebook.id === id);
};

// Example of a function to update a notebook by ID (might be useful later)
export const updateNotebook = (updatedNotebook) => {
    let notebooks = getNotebooks();
    notebooks = notebooks.map(notebook =>
        notebook.id === updatedNotebook.id ? updatedNotebook : notebook
    );
    saveNotebooks(notebooks);
    return notebooks; // Return updated list
};

export const updateNotebookTitle = (notebookId, newTitle) => {
    const notebooks = getNotebooks();
    let notebookFound = false;
    const updatedNotebooks = notebooks.map(notebook => {
        if (notebook.id === notebookId) {
            notebookFound = true;
            return { ...notebook, title: newTitle, updatedAt: new Date().toISOString() };
        }
        return notebook;
    });

    if (notebookFound) {
        saveNotebooks(updatedNotebooks);
        return updatedNotebooks;
    }
    // Optionally, handle notebook not found (e.g., log an error or return original notebooks)
    console.warn(`Notebook with ID ${notebookId} not found for title update.`);
    return notebooks; // Or throw an error, or return null/undefined
};

export const updateNotebookTimestamp = (notebookId) => {
    const notebooks = getNotebooks();
    let notebookFound = false;
    const updatedNotebooks = notebooks.map(notebook => {
        if (notebook.id === notebookId) {
            notebookFound = true;
            return { ...notebook, updatedAt: new Date().toISOString() };
        }
        return notebook;
    });

    if (notebookFound) {
        saveNotebooks(updatedNotebooks);
        return updatedNotebooks;
    }
    // Optionally, handle notebook not found
    console.warn(`Notebook with ID ${notebookId} not found for timestamp update.`);
    return notebooks; // Or throw an error, or return null/undefined
};

// HTML Report Storage Functions

export const saveHtmlReport = (notebookId, sourceId, htmlContent) => {
    const key = `html_report_${notebookId}_${sourceId}`;
    try {
        localStorage.setItem(key, htmlContent);
    } catch (error) {
        console.error('Error saving HTML report to localStorage:', error);
        // Potentially throw error or return a status if needed by calling code
    }
};

export const getHtmlReport = (notebookId, sourceId) => {
    const key = `html_report_${notebookId}_${sourceId}`;
    try {
        return localStorage.getItem(key); // Returns null if key doesn't exist
    } catch (error) {
        console.error('Error retrieving HTML report from localStorage:', error);
        return null;
    }
};

export const deleteHtmlReport = (notebookId, sourceId) => {
    const key = `html_report_${notebookId}_${sourceId}`;
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error deleting HTML report from localStorage:', error);
    }
};

// Example of a function to delete a notebook by ID (might be useful later)
export const deleteNotebookById = (id) => {
    let notebooks = getNotebooks();
    notebooks = notebooks.filter(notebook => notebook.id !== id);
    saveNotebooks(notebooks);
    return notebooks; // Return updated list
};
