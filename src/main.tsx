import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Analytics } from '@vercel/analytics/react';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);
