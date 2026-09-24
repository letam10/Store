import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import CustomerSupport from './components/ui/CustomerSupport'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Account from './pages/Account'
import Favorites from './pages/Favorites'
import Auth from './pages/Auth'
import Membership from './pages/Membership'
import Rewards from './pages/Rewards'
import NotFound from './pages/NotFound'
import { enrichProducts } from './storefront/catalog'
import { customerApi } from './api/customer'
import { addCartItem, canPurchase, cartCount, loadJson, routeName, setCartQuantity } from './storefront/state'
import './App.css'
import './storefront/design.css'
import './storefront/updates.css'
import './storefront/phase2.css'
import './storefront/commerce.css'

const CART_KEY = 'storeCartV1'
const THEME_KEY = 'storeThemeV1'

function currentLocation() {
  return { pathname: window.location.pathname, search: window.location.search }
}

export default function App() {
  const [notice, setNotice] = useState('')
  const [cart, setCart] = useState(() => loadJson(CART_KEY, []))
  const [account, setAccount] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [orders, setOrders] = useState([])
  const [wallet, setWallet] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])
  const [selectedVoucherCodes, setSelectedVoucherCodes] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')
  const [offers, setOffers] = useState([])
  const [location, setLocation] = useState(currentLocation)
  const scrollPositions = useRef(new Map())
  const navigationAction = useRef('initial')
  const viewedLocation = useRef(null)
  const products = useMemo(() => enrichProducts(offers), [offers])
  const route = routeName(location.pathname)
  const protectedPage = ['account', 'checkout', 'membership', 'favorites'].includes(route)
  const isAuth = route === 'auth' || (protectedPage && !account)
  const liveCart = useMemo(() => cart.map((item) => {
    const currentProduct = products.find((product) => String(product.id) === String(item.id))
    return { ...item, ...currentProduct, quantity: item.quantity, selected: item.selected === true }
  }), [cart, products])
  const selectedCart = liveCart.filter((item) => item.selected && canPurchase(item))

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer) }, [notice])
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); document.documentElement.dataset.theme = theme }, [theme])

  const refreshCustomer = useCallback(async () => {
    try {
      const session = await customerApi('/api/customer/session')
      setAccount(session.account)
      const [ordersResponse, vouchersResponse, favoritesResponse] = await Promise.all([
        customerApi('/api/customer/orders'), customerApi('/api/customer/vouchers'), customerApi('/api/customer/favorites'),
      ])
      setOrders(ordersResponse.orders || [])
      setWallet(vouchersResponse.vouchers || [])
      setSelectedVoucherCodes((current) => current.filter((code) => (vouchersResponse.vouchers || []).some((voucher) => voucher.code === code)))
      setFavoriteIds(favoritesResponse.ids || [])
    } catch {
      setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]); setSelectedVoucherCodes([])
    } finally { setAuthReady(true) }
  }, [])

  useEffect(() => {
    customerApi('/api/customer/session')
      .then(async (session) => {
        setAccount(session.account)
        const [ordersResponse, vouchersResponse, favoritesResponse] = await Promise.all([
          customerApi('/api/customer/orders'), customerApi('/api/customer/vouchers'), customerApi('/api/customer/favorites'),
        ])
        setOrders(ordersResponse.orders || [])
        setWallet(vouchersResponse.vouchers || [])
        setSelectedVoucherCodes((current) => current.filter((code) => (vouchersResponse.vouchers || []).some((voucher) => voucher.code === code)))
        setFavoriteIds(favoritesResponse.ids || [])
      })
      .catch(() => { setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]) })
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    window.addEventListener('focus', refreshCustomer)
    const timer = setInterval(refreshCustomer, 60000)
    return () => { window.removeEventListener('focus', refreshCustomer); clearInterval(timer) }
  }, [refreshCustomer])

  useEffect(() => {
    const controller = new AbortController()
    async function refreshCatalog() {
      try {
        const response = await fetch('/api/storefront/catalog', { signal: controller.signal, cache: 'no-store' })
        if (response.ok) {
          const payload = await response.json()
          if (Array.isArray(payload.products)) setOffers(payload.products)
        }
      } catch { /* Danh mục tĩnh vẫn dùng được khi API demo tắt. */ }
    }
    refreshCatalog()
    window.addEventListener('focus', refreshCatalog)
    const timer = setInterval(refreshCatalog, 30000)
    return () => { controller.abort(); window.removeEventListener('focus', refreshCatalog); clearInterval(timer) }
  }, [])

  useEffect(() => {
    const old = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const onPop = () => {
      scrollPositions.current.set(location.pathname + location.search, window.scrollY)
      navigationAction.current = 'pop'
      setLocation(currentLocation())
    }
    window.addEventListener('popstate', onPop)
    return () => { window.removeEventListener('popstate', onPop); window.history.scrollRestoration = old }
  }, [location])

  useLayoutEffect(() => {
    if (navigationAction.current === 'initial') return
    const y = navigationAction.current === 'pop' ? scrollPositions.current.get(location.pathname + location.search) || 0 : 0
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' })))
  }, [location])

  useEffect(() => {
    if (route !== 'product' || viewedLocation.current === location) return
    viewedLocation.current = location
    const id = decodeURIComponent(location.pathname.split('/')[2] || '')
    if (!products.some((product) => String(product.id) === id)) return
    fetch('/api/storefront/products/' + encodeURIComponent(id) + '/view', { method: 'POST' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload) setOffers((current) => current.some((offer) => String(offer.id) === id)
        ? current.map((offer) => String(offer.id) === id ? { ...offer, viewCount: payload.viewCount } : offer)
        : [...current, { id, viewCount: payload.viewCount }]) })
      .catch(() => {})
  }, [location, route, products])

  function navigate(url) {
    const next = new URL(url, window.location.href)
    scrollPositions.current.set(location.pathname + location.search, window.scrollY)
    window.history.pushState({}, '', next.pathname + next.search + next.hash)
    navigationAction.current = 'push'
    setLocation(currentLocation())
  }

  function handleLink(event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    const anchor = event.target.closest?.('a[href]')
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return
    const url = new URL(anchor.href, window.location.href)
    if (url.origin !== window.location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return
    event.preventDefault()
    navigate(url.href)
  }

  function handleSearch(event) {
    if (!event.target.matches('form.site-search')) return
    event.preventDefault()
    const query = new FormData(event.target).get('q')?.toString().trim() || ''
    navigate('/products' + (query ? '?q=' + encodeURIComponent(query) : ''))
  }

  const addToCart = (product) => {
    if (product.stockCount === 0) return
    const inCart = cart.find((item) => String(item.id) === String(product.id))?.quantity || 0
    if (product.stockCount !== null && inCart >= product.stockCount) {
      setNotice('Đã đạt số lượng tồn kho demo của ' + product.name + '.')
      return
    }
    setCart((current) => addCartItem(current, { ...product, selected: false }))
    setNotice('Đã thêm ' + product.name + ' vào giỏ hàng.')
  }
  const updateQuantity = (id, quantity) => setCart((current) => setCartQuantity(current, id, quantity))
  const toggleCartItem = (id) => setCart((current) => current.map((item) => String(item.id) === String(id) ? { ...item, selected: !item.selected } : item))
  const completeOrder = (order, purchasedItems) => {
    setOrders((current) => [order, ...current])
    const purchasedIds = new Set(purchasedItems.map((item) => String(item.id)))
    setCart((current) => current.filter((item) => !purchasedIds.has(String(item.id))))
    setSelectedVoucherCodes([])
    refreshCustomer()
  }
  const membershipTier = account?.tier || 'bronze'
  function requireLogin() { navigate('/login?next=' + encodeURIComponent(location.pathname + location.search)) }
  async function toggleFavorite(id) {
    if (!account) { requireLogin(); return }
    const saved = favoriteIds.includes(String(id))
    try {
      await customerApi('/api/customer/favorites/' + encodeURIComponent(id), {
        method: saved ? 'DELETE' : 'PUT', csrfToken: account.csrfToken,
      })
      setFavoriteIds((current) => saved ? current.filter((item) => item !== String(id)) : [String(id), ...current])
    } catch (error) { setNotice(error.message) }
  }
  function toggleVoucher(code) {
    setSelectedVoucherCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
  }
  async function logout() {
    try { await customerApi('/api/customer/logout', { method: 'POST', csrfToken: account.csrfToken }) } catch { /* Clear local account view even if the session expired. */ }
    setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]); setSelectedVoucherCodes([])
  }

  let page = <NotFound />
  if (!authReady && protectedPage) page = <div className="container page-shell"><p>Đang kiểm tra phiên đăng nhập…</p></div>
  else if (isAuth) page = <Auth key={location.pathname} mode={route === 'auth' ? location.pathname : '/login'} next={route === 'auth' ? new URLSearchParams(location.search).get('next') || '/account' : location.pathname + location.search} onLogin={(value) => { setAccount(value); refreshCustomer() }} onNavigate={navigate} />
  else if (route === 'home') page = <Home products={products} onAddToCart={addToCart} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
  else if (route === 'products') page = <Catalog key={location.search} products={products} search={location.search} onAddToCart={addToCart} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
  else if (route === 'product') page = <ProductDetail key={location.pathname} products={products} pathname={location.pathname} onAddToCart={addToCart} account={account} membershipTier={membershipTier} wallet={wallet} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onRequireLogin={requireLogin} onToggleVoucher={toggleVoucher} selectedVoucherCodes={selectedVoucherCodes} />
  else if (route === 'contact') page = <Contact />
  else if (route === 'cart') page = <Cart cart={liveCart} products={products} onQuantity={updateQuantity} onToggle={toggleCartItem} onAddToCart={addToCart} />
  else if (route === 'checkout') page = <Checkout cart={selectedCart} account={account} membershipTier={membershipTier} wallet={wallet} selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher} onComplete={completeOrder} />
  else if (route === 'membership') page = <Membership account={account} tier={membershipTier} />
  else if (route === 'rewards') page = <Rewards account={account} tier={membershipTier} wallet={wallet} onReward={refreshCustomer} onRequireLogin={requireLogin} onToggleVoucher={toggleVoucher} selectedVoucherCodes={selectedVoucherCodes} />
  else if (route === 'favorites') page = <Favorites products={products} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />
  else if (route === 'account') page = <Account account={account} orders={orders} membershipTier={membershipTier} wallet={wallet} selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher} onLogout={logout} />

  return <div className={'site-frame' + (isAuth ? ' site-frame--auth' : '')} onClick={handleLink} onSubmitCapture={handleSearch}>
    {!isAuth && <Header cartCount={cartCount(cart)} account={account} membershipTier={membershipTier} theme={theme} onThemeChange={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />}
    <main id="main-content">{page}</main>
    {!isAuth && <Footer />}
    {!isAuth && notice && <div className="cart-notice" role="status"><span>✓ {notice}</span><a href="/cart">Xem giỏ hàng →</a><button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
    {!isAuth && <CustomerSupport account={account} onRequireLogin={requireLogin} />}
  </div>
}
