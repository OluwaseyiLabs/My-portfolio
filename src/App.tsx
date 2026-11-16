import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ContentProvider } from './context/ContentContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import AutomationWork from './components/AutomationWork'
import WebDesignSection from './components/WebDesignSection'
import Process from './components/Process'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CaseStudy from './pages/CaseStudy'
import AnalyticsTracker from './components/AnalyticsTracker'
import SmoothAnchors from './components/SmoothAnchors'
import { OWNER_FLAG } from './lib/analytics'
import { configIsValid, missingEnv } from './lib/env'
import StudioLogin from './studio/StudioLogin'
import StudioDashboard from './studio/StudioDashboard'
import RequireOwnerAuth from './studio/RequireOwnerAuth'

/** Studio screens are light-only: lock the theme while mounted, restore on leave. */
function LightOnly({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.theme
    root.dataset.theme = 'light'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    try {
      localStorage.setItem(OWNER_FLAG, '1') // don't count the owner's own visits
    } catch {
      /* ignore */
    }
    return () => {
      robots.remove()
      if (previous) root.dataset.theme = previous
    }
  }, [])
  return <>{children}</>
}

function PortfolioHome() {
  const { hash } = useLocation()

  // Arriving via /#section (e.g. "Back" from a project page): scroll there, then keep the section pinned in
  // place while content above it finishes loading (carousels fill in and push things down), until the
  // visitor scrolls or 3 seconds pass.
  useEffect(() => {
    if (!hash) return
    const id = hash.slice(1)
    let tries = 0
    let ro: ResizeObserver | null = null
    let stopTimer = 0
    const release = () => {
      ro?.disconnect()
      window.clearTimeout(stopTimer)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
    }
    const align = () => {
      const el = document.getElementById(id)
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 64)
    }
    const timer = window.setInterval(() => {
      const el = document.getElementById(id)
      if (el || ++tries > 20) {
        window.clearInterval(timer)
        if (!el) return
        align()
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(align)
          ro.observe(document.body)
          stopTimer = window.setTimeout(release, 3000)
          window.addEventListener('wheel', release, { passive: true })
          window.addEventListener('touchstart', release, { passive: true })
          window.addEventListener('keydown', release)
        }
      }
    }, 50)
    return () => {
      window.clearInterval(timer)
      release()
    }
  }, [hash])

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header />
      <main>
        <Hero />
        <Services />
        <AutomationWork />
        <WebDesignSection />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  if (!configIsValid) {
    // Owner-facing detail goes to the console only; visitors just see a neutral message.
    console.error(`Configuration missing: ${missingEnv.join(', ')}. Set them in .env (local) or Vercel > Environment Variables, then redeploy.`)
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center bg-white text-black">
        <div>
          <p className="text-2xl font-black">This site is being set up.</p>
          <p className="mt-2 text-sm text-neutral-600">Please check back shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ContentProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <SmoothAnchors />
          <Routes>
            {/* Public Portfolio Route */}
            <Route path="/" element={<PortfolioHome />} />
            <Route path="/work/:slug" element={<CaseStudy />} />

            {/* Private Owner CMS Routes (light-only) */}
            <Route
              path="/studio/login"
              element={
                <LightOnly>
                  <StudioLogin />
                </LightOnly>
              }
            />
            <Route
              path="/studio"
              element={
                <LightOnly>
                  <RequireOwnerAuth>
                    <StudioDashboard />
                  </RequireOwnerAuth>
                </LightOnly>
              }
            />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ContentProvider>
    </ThemeProvider>
  )
}
