import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // بينادي ملف App اللي فيه الـ Routes

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
