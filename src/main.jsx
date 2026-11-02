import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { SmoothScrollProvider } from './components/motion/SmoothScrollProvider.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SmoothScrollProvider>
      <App />
    </SmoothScrollProvider>
  </React.StrictMode>
);

