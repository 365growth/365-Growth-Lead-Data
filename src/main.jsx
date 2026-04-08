import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installStorageShim } from './lib/storage.js'

installStorageShim()
if (typeof window !== "undefined" && window.storage && typeof window.storage.remove !== "function") {
  window.storage.remove = (key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return Promise.resolve();
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
