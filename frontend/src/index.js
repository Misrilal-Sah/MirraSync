import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
    <Toaster
      position="bottom-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '14px',
          boxShadow: 'var(--shadow-lg)',
          padding: '12px 16px',
          maxWidth: '380px',
        },
        success: {
          iconTheme: { primary: 'var(--accent-teal)', secondary: 'var(--bg-elevated)' },
          style: { borderLeftColor: 'var(--success)', borderLeftWidth: '3px' },
        },
        error: {
          iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-elevated)' },
          style: { borderLeftColor: 'var(--danger)', borderLeftWidth: '3px' },
        },
      }}
    />
  </BrowserRouter>
);
