import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Home } from '@/pages/Home'
import { Plan } from '@/pages/Plan'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Festivals } from '@/pages/Festivals'
import { SavedPlans } from '@/pages/SavedPlans'
import { Visits } from '@/pages/Visits'
import PlanVisit from '@/pages/PlanVisit'
import { About } from '@/pages/About'
import { Contact } from '@/pages/Contact'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { FAQ } from '@/pages/FAQ'
import { Profile } from '@/pages/Profile'
import { NotFound } from '@/pages/NotFound'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { Toaster } from '@/components/Toaster'
import { useAuthStore } from '@/store/useStore'

import { Chatbot } from '@/components/Chatbot'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/saved-plans" element={<SavedPlans />} />
              <Route path="/visits" element={<Visits />} />
              <Route path="/plan-visit" element={<PlanVisit />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/festivals" element={<Festivals />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Chatbot />
        </div>
        <ToastViewport />
        <Toaster />
      </Router>
    </ToastProvider>
  )
}

export default App
