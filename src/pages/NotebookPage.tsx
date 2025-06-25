import React from 'react';
import { Link } from 'react-router-dom';

const NotebookPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Notebook Application</h1>
      <p style={{ marginBottom: '30px', fontSize: '18px', color: '#555' }}>
        This is where your main notebook application content will go.
      </p>
      <p style={{ marginBottom: '10px', fontSize: '16px', color: '#777' }}>
        You've successfully navigated from the homepage.
      </p>
      <div style={{ marginTop: '40px' }}>
        <Link
          to="/"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          Go Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotebookPage;
