import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Debug logging for app initialization
console.log('=== Smart Retail Pro - ROCS Frontend ===');
console.log('Environment:', import.meta.env.MODE);
console.log('Backend API: http://localhost:8080/api/v1');
console.log('==========================================');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
