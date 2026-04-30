import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import './styles/index.css'

// Register PWA service worker with refresh logic
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('A new version of WapiPulse is available! Update now to see the latest features?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
