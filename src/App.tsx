import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import AutomationWork from './components/AutomationWork'
import WebDesignSection from './components/WebDesignSection'
import Process from './components/Process'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import StudioLogin from './studio/StudioLogin'
import StudioDashboard from './studio/StudioDashboard'
import RequireOwnerAuth from './studio/RequireOwnerAuth'

function PortfolioHome() {
  return (
    <div className="min-h-screen bg-white text-black">
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portfolio Route */}
          <Route path="/" element={<PortfolioHome />} />

          {/* Private Owner CMS Routes */}
          <Route path="/studio/login" element={<StudioLogin />} />
          <Route
            path="/studio"
            element={
              <RequireOwnerAuth>
                <StudioDashboard />
              </RequireOwnerAuth>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
