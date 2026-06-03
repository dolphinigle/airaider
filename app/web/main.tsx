import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useGame } from './store.js';
import { App } from './App.js';
import './styles.css';

function Root() {
  const init = useGame((s) => s.init);
  const eng = useGame((s) => s.eng);
  useEffect(() => { if (!eng) void init(); }, [eng, init]);
  return <App />;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><Root /></React.StrictMode>);
