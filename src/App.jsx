import { useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Admin from './pages/Admin'
import CustomerSupport from './components/ui/CustomerSupport'
import './App.css'

export default function App() {
  const [cartCount, setCartCount] = useState(0)
  const isAdminRoute = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')

  if (isAdminRoute) return <Admin />

  return (
    <>
      <Header cartCount={cartCount} />
      <main id="main-content"><Home onAddToCart={() => setCartCount((count) => count + 1)} /></main>
      <Footer />
      <CustomerSupport />
    </>
  )
}
