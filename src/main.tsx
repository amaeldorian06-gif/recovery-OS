import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AppErrorBoundary} from './components/AppErrorBoundary.tsx';
import './index.css';

/**
 * Filet de sécurité global : toute exception de rendu affiche désormais un
 * écran explicatif au lieu d'une page blanche.
 */
createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
