import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import './styles/globals.css';
import { StoreProvider, applyTheme, applyCustomColors } from './state/store';
import App from './App';

// Apply theme and custom colors before first paint to avoid flash
const saved = localStorage.getItem('studytracker');
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    if (parsed.theme) applyTheme(parsed.theme);
    if (parsed.settings?.customColors) applyCustomColors(parsed.settings.customColors);
  } catch {
    // ignore
  }
}

// Listen for system theme changes
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const raw = localStorage.getItem('studytracker');
    if (!raw) return;
    try {
      const { theme } = JSON.parse(raw);
      if (theme === 'auto') applyTheme('auto');
    } catch {
      // ignore
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
