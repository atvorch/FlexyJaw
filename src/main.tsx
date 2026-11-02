// must run before anything creates a three.js Color
import './scene/colorSetup';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/theme.css';
import './styles/layout.css';
import './styles/viewport.css';
import './styles/compare.css';
import './styles/report.css';
import './styles/saves.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
