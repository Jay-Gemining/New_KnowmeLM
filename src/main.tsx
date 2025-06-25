import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // We'll create this for Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
