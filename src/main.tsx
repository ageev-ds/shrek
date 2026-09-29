import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/rubik/cyrillic-700.css';
import '@fontsource/rubik/cyrillic-800.css';
import '@fontsource/rubik/cyrillic-900.css';
import '@fontsource/rubik/latin-700.css';
import '@fontsource/rubik/latin-800.css';
import '@fontsource/rubik/latin-900.css';
import '@fontsource/montserrat/cyrillic-500.css';
import '@fontsource/montserrat/cyrillic-600.css';
import '@fontsource/montserrat/cyrillic-700.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import './styles/global.css';
import './modes/GameMode/game.css';
import { App } from './App';

window.addEventListener('error', (e) => window.api?.log('error', `${e.message} @ ${e.filename}:${e.lineno}`));
window.addEventListener('unhandledrejection', (e) => window.api?.log('error', `Unhandled: ${String(e.reason)}`));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
