import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Pendo with anonymous visitor
if (typeof pendo !== 'undefined') {
  pendo.initialize({
    visitor: {
      id: 'ANONYMOUS_VISITOR_ID'
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
