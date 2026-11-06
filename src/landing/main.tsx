import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './landing.css'
import { Landing } from './Landing'
import { initAnalytics, pageview, trackVisit } from '../lib/analytics'

// Medición de uso (PostHog): solo si el proyecto tiene la clave
initAnalytics()
trackVisit()
pageview()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
