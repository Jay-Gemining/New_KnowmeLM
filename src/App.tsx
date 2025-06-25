import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IndexPage from './pages/IndexPage';
import NotebookPage from './pages/NotebookPage'; // We'll create this next

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/notebook" element={<NotebookPage />} />
        {/* Add other routes here as your application grows */}
      </Routes>
    </Router>
  );
}

export default App;
