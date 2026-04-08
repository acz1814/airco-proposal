import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { cleanupLegacyKeys } from './utils/estimateStorage';

// One-time purge of unscoped legacy sessionStorage keys
cleanupLegacyKeys();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
