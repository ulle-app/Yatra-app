import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Home } from '@/pages/Home'
import { Plan } from '@/pages/Plan'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Festivals } from '@/pages/Festivals'
import { SavedPlans } from '@/pages/SavedPlans'
import { Visits } from '@/pages/Visits'
import CrowdCalendar from '@/pages/CrowdCalendar'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { Toaster } from '@/components/Toaster'
import { useAuthStore } from '@/store/useStore'

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
              <Route path="/crowd-calendar" element={<CrowdCalendar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/festivals" element={<Festivals />} />
            </Routes>
          </main>
          <footer className="border-t py-6 mt-12">
            <div className="container text-center text-sm text-muted-foreground">
              <p>TempleTrip - Plan your temple visits with live crowd predictions</p>
              <p className="mt-1">Data based on historical patterns, time analysis, and festival calendar</p>
            </div>
          </footer>
        </div>
        <ToastViewport />
        <Toaster />
      </Router>
    </ToastProvider>
  )
}

export default App
