import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const VALID_REDIRECT_PREFIXES = [
  '/',
  '/home',
  '/study',
  '/dialogue',
  '/character',
  '/inventory',
  '/story',
  '/goal',
  '/stats',
  '/stats-v0',
  '/missions',
  '/calendar',
  '/gacha',
  '/review',
  '/profile',
  '/login',
  '/friends',
  '/ranking',
  '/character-select',
  '/multiplayer-match',
]

const isValidRedirectPath = (path) => {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/')) return false

  return VALID_REDIRECT_PREFIXES.some((prefix) => {
    if (prefix === '/') {
      return path === '/'
    }

    return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}#`)
  })
}

const redirectPath = sessionStorage.getItem('spa-redirect-path')
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect-path')
  if (isValidRedirectPath(redirectPath)) {
    window.history.replaceState(null, '', redirectPath)
  }
}

createRoot(document.getElementById('root')).render(
  <App />
)
