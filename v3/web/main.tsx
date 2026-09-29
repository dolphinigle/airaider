import React from 'react';
import { createRoot } from 'react-dom/client';
// CSS order is the cascade: base tokens/reset/buttons/shared keyframes first, then one file per
// surface (each surface owns its file, so packages never collide), and component code last.
import './styles.css';
import './css/shell.css';
import './css/map.css';
import './css/cards.css';
import './css/quest.css';
import './css/fort.css';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(<App />);
