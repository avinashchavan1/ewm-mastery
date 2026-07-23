import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DataProvider } from './data/DataContext';
import { ThemeProvider } from './lib/theme';
import { ProgressProvider } from './lib/progress';
import { ToastProvider } from './lib/toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <DataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DataProvider>
      </ProgressProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
