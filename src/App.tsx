import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import AutomationWork from './components/AutomationWork'
import WebDesignSection from './components/WebDesignSection'
import Process from './components/Process'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
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

