import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics, trackVisit } from './lib/analytics'

// Medición de uso (PostHog): solo si el proyecto tiene la clave
initAnalytics()
trackVisit()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
