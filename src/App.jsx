import { useEffect, useMemo, useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import CustomerSupport from './components/ui/CustomerSupport'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import Locations from './pages/Locations'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Account from './pages/Account'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import { addCartItem, cartCount, loadJson, normalizeSearch, routeName, setCartQuantity } from './storefront/state'
import './App.css'

const CART_KEY = 'storeCartV1'
const ACCOUNT_KEY = 'storeCustomerAccountV1'
const ORDERS_KEY = 'storeDemoOrdersV1'

export default function App() {
  const [cart, setCart] = useState(() => loadJson(CART_KEY, []))
  const [account, setAccount] = useState(() => loadJson(ACCOUNT_KEY, null))
  const [orders, setOrders] = useState(() => loadJson(ORDERS_KEY, []))
  const route = useMemo(() => routeName(window.location.pathname), [])

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)) }, [orders])
  useEffect(() => {
    if (account) localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
    else localStorage.removeItem(ACCOUNT_KEY)
  }, [account])

  if (route === 'admin') return <Admin />

  const addToCart = (product) => setCart((current) => addCartItem(current, product))
  const updateQuantity = (id, quantity) => setCart((current) => setCartQuantity(current, id, quantity))
  const completeOrder = (order) => {
    setOrders((current) => [order, ...current].slice(0, 20))
    setCart([])
  }
  const accountOrders = account?.username
    ? orders.filter((order) => order.owner === normalizeSearch(account.username).trim())
    : []

  let page = <NotFound />
  if (route === 'home') page = <Home onAddToCart={addToCart} />
  else if (route === 'products') page = <Catalog onAddToCart={addToCart} />
  else if (route === 'product') page = <ProductDetail onAddToCart={addToCart} />
  else if (route === 'contact') page = <Contact />
  else if (route === 'locations') page = <Locations />
  else if (route === 'cart') page = <Cart cart={cart} onQuantity={updateQuantity} />
  else if (route === 'checkout') page = <Checkout cart={cart} account={account} onComplete={completeOrder} />
  else if (route === 'account') page = <Account account={account} orders={accountOrders} onLogin={setAccount} onLogout={() => setAccount(null)} />

  return (
    <div className="site-frame">
      <Header cartCount={cartCount(cart)} account={account} />
      <main id="main-content">{page}</main>
      <Footer />
      <CustomerSupport />
    </div>
  )
}
