import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const redirectPath = sessionStorage.getItem('spa-redirect-path')
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect-path')
  window.history.replaceState(null, '', redirectPath)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
