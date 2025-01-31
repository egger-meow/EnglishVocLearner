import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MistakesProvider } from './context/MistakesContext';
import { StatsProvider } from './context/StatsContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MistakesProvider>
    <StatsProvider>
      <App />
    </StatsProvider>
  </MistakesProvider>
);
