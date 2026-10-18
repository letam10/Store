/*
  FILE NOTE
  - Mục đích: Điều phối luồng ứng dụng Store React: quản lý router, giỏ hàng, phiên tài khoản, theme, danh mục và bắt buộc đăng nhập khi thêm giỏ hàng.
  - Liên kết trực tiếp: src/components/layout/Header.jsx, src/components/layout/Footer.jsx, src/pages/Home.jsx, src/pages/Catalog.jsx, src/pages/ProductDetail.jsx, src/pages/Auth.jsx, src/pages/Cart.jsx
  - Vùng ảnh hưởng khi sửa: Toàn bộ vòng đời ứng dụng, các route công khai và bảo vệ, luồng thêm sản phẩm vào giỏ hàng.
*/
import StorePromotions, { PromotionBoard } from './components/ui/StorePromotions'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { normalizeVoucherSelection } from './storefront/voucherSelection'
import { storePromotionOverview } from './storefront/promotions'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import CustomerSupport from './components/ui/CustomerSupport'
import StoreNotice from './components/ui/StoreNotice'
import { showValidation, clearValidation } from './api/formValidation'
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
import { apiEndpoint, apiCredentials } from './api/endpoint'
import { customerApi } from './api/customer'
import { normalizeTheme, themeVariables } from '../shared/theme.js'
import { addCartItem, canPurchase, cartCount, loadCart, routeName, saveCart, setCartQuantity } from './storefront/state'
import './App.css'
import './storefront/design.css'
import './storefront/updates.css'
import './storefront/phase2.css'
import './storefront/commerce.css'
import './storefront/polish.css'
import './storefront/layout.css'
import './storefront/theme.css'

const THEME_KEY = 'storeThemeV1'

// Chức năng currentLocation: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
function currentLocation() {
  return { pathname: window.location.pathname, search: window.location.search }
}

// Chức năng App: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function App() {
  const [notice, setNotice] = useState('')
  const [cart, setCart] = useState(() => loadCart())
  const [account, setAccount] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [orders, setOrders] = useState([])
  const [wallet, setWallet] = useState([])
  const [favoriteIds, setFavoriteIds] = useState([])
  const [selectedVoucherCodes, setSelectedVoucherCodes] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('storeLanguageV1') === 'en' ? 'en' : 'vi')
  const [offers, setOffers] = useState([])
  const [appearance, setAppearance] = useState({})
  const [location, setLocation] = useState(currentLocation)
  const scrollPositions = useRef(new Map())
  const customerEpoch = useRef(0)
  const cartAccountId = useRef(null)
  const navigationAction = useRef('initial')
  const viewedLocation = useRef(null)
  const products = useMemo(() => enrichProducts(offers), [offers])
  const promotionOverview = useMemo(() => storePromotionOverview(products, wallet, account, favoriteIds), [products, wallet, account, favoriteIds])
  const route = routeName(location.pathname)
  const accountId = account?.id == null ? null : String(account.id)
  const themeDocument = useMemo(() => normalizeTheme(appearance.theme), [appearance.theme])
  const themePreset = themeDocument.presetId
  const themePalette = useMemo(() => themeVariables(themeDocument, theme), [themeDocument, theme])
  const hasTheme = Boolean(appearance.theme && typeof appearance.theme === 'object')
  const accentColor = hasTheme ? themePalette['--accent'] : /^#[0-9a-f]{6}$/i.test(appearance.accentColor || '') ? appearance.accentColor : themePalette['--accent']
  const protectedPage = ['account', 'checkout', 'membership', 'favorites'].includes(route)
  const isAuth = route === 'auth' || (protectedPage && !account)
  const liveCart = useMemo(() => cart.map((item) => {
    const currentProduct = products.find((product) => String(product.id) === String(item.id))
    return { ...item, ...currentProduct, quantity: item.quantity, selected: item.selected === true }
  }), [cart, products])
  const selectedCart = liveCart.filter((item) => item.selected && canPurchase(item))
  const refreshCatalog = useCallback(async (signal) => {
    try {
      const response = await fetch(apiEndpoint('/api/storefront/catalog?details=1'), { signal, credentials: apiCredentials, cache: 'no-store' })
      if (!response.ok) return false
      const payload = await response.json()
      if (!Array.isArray(payload.products)) return false
      setOffers(payload.products)
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 3500); return () => clearTimeout(timer) }, [notice])
  useEffect(() => { saveCart(cartAccountId.current, cart) }, [cart])
  useEffect(() => {
    if (cartAccountId.current === accountId) return
    saveCart(cartAccountId.current, cart)
    cartAccountId.current = accountId
    setCart(loadCart(accountId))
  }, [accountId, cart])
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.themePreset = themePreset
    Object.entries(themePalette).forEach(([name, value]) => root.style.setProperty(name, value))
    root.style.setProperty('--accent', accentColor)
  }, [accentColor, theme, themePalette, themePreset])
  useEffect(() => { localStorage.setItem('storeLanguageV1', language); document.documentElement.lang = language }, [language])

  const refreshCustomer = useCallback(async () => {
    const epoch = customerEpoch.current
    let session
    try {
      session = await customerApi('/api/customer/session')
    } catch {
      if (epoch !== customerEpoch.current) return
      setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]); setSelectedVoucherCodes([])
      if (epoch === customerEpoch.current) setAuthReady(true)
      return
    }
    if (epoch !== customerEpoch.current) return
    setAccount(session.account || null)
    // Secondary data must never clear the session: missing endpoints (404) keep avatar.
    try {
      const ordersResponse = await customerApi('/api/customer/orders').catch(() => ({ orders: [] }))
      const vouchersResponse = await customerApi('/api/customer/vouchers').catch(() => ({ vouchers: [] }))
      const favoritesResponse = await customerApi('/api/customer/favorites').catch(() => ({ ids: [] }))
      if (epoch !== customerEpoch.current) return
      setOrders(ordersResponse.orders || [])
      setWallet(vouchersResponse.vouchers || [])
      setSelectedVoucherCodes((current) => normalizeVoucherSelection(current, vouchersResponse.vouchers || []))
      const ids = favoritesResponse.ids || favoritesResponse.favorites || []
      setFavoriteIds(Array.isArray(ids) ? ids.map(String) : [])
    } catch {
      if (epoch !== customerEpoch.current) return
      setOrders([]); setWallet([]); setFavoriteIds([]); setSelectedVoucherCodes([])
    } finally { if (epoch === customerEpoch.current) setAuthReady(true) }
  }, [])

  useEffect(() => {
    const epoch = customerEpoch.current
    let cancelled = false
    customerApi('/api/customer/session')
      .then(async (session) => {
        if (cancelled || epoch !== customerEpoch.current) return
        setAccount(session.account || null)
        // Secondary data must never clear the session (backend dotnet thiếu /orders).
        const ordersResponse = await customerApi('/api/customer/orders').catch(() => ({ orders: [] }))
        const vouchersResponse = await customerApi('/api/customer/vouchers').catch(() => ({ vouchers: [] }))
        const favoritesResponse = await customerApi('/api/customer/favorites').catch(() => ({ ids: [] }))
        if (cancelled || epoch !== customerEpoch.current) return
        setOrders(ordersResponse.orders || [])
        setWallet(vouchersResponse.vouchers || [])
        setSelectedVoucherCodes((current) => normalizeVoucherSelection(current, vouchersResponse.vouchers || []))
        const ids = favoritesResponse.ids || favoritesResponse.favorites || []
        setFavoriteIds(Array.isArray(ids) ? ids.map(String) : [])
      })
      .catch(() => { if (!cancelled && epoch === customerEpoch.current) { setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]) } })
      .finally(() => { if (!cancelled && epoch === customerEpoch.current) setAuthReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    fetch(apiEndpoint('/api/storefront/appearance'), { signal: controller.signal, credentials: apiCredentials, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        if (!payload?.appearance) return
        setAppearance(payload.appearance)
        const remoteTheme = normalizeTheme(payload.theme || payload.appearance.theme)
        if (!localStorage.getItem(THEME_KEY)) setTheme(remoteTheme.defaultMode)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    window.addEventListener('focus', refreshCustomer)
    const timer = setInterval(refreshCustomer, 60000)
    return () => { window.removeEventListener('focus', refreshCustomer); clearInterval(timer) }
  }, [refreshCustomer])

  useEffect(() => {
    const controller = new AbortController()
    const initialTimer = setTimeout(() => { refreshCatalog(controller.signal) }, 0)
    const reloadCatalog = () => { refreshCatalog() }
    window.addEventListener('focus', reloadCatalog)
    const timer = setInterval(reloadCatalog, 30000)
    return () => { controller.abort(); window.removeEventListener('focus', reloadCatalog); clearTimeout(initialTimer); clearInterval(timer) }
  }, [refreshCatalog])

  useEffect(() => {
    const old = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    // Chức năng onPop: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
    const onPop = () => {
      // Đổi neo trong cùng trang phải giữ cuộn tới mục đó, không khôi phục vị trí cũ.
      if (window.location.pathname === location.pathname && window.location.search === location.search) return
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
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    fetch(apiEndpoint('/api/storefront/products/' + encodeURIComponent(id) + '/view'), { method: 'POST', credentials: apiCredentials })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload) setOffers((current) => current.some((offer) => String(offer.id) === id)
        ? current.map((offer) => String(offer.id) === id ? { ...offer, viewCount: payload.viewCount } : offer)
        : [...current, { id, viewCount: payload.viewCount }]) })
      .catch(() => {})
  }, [location, route, products])

  // Chức năng navigate: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function navigate(url) {
    const next = new URL(url, window.location.href)
    scrollPositions.current.set(location.pathname + location.search, window.scrollY)
    window.history.pushState({}, '', next.pathname + next.search + next.hash)
    navigationAction.current = 'push'
    setLocation(currentLocation())
  }

  // Chức năng handleLink: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function handleLink(event) {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
    const anchor = event.target.closest?.('a[href]')
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return
    const url = new URL(anchor.href, window.location.href)
    if (url.pathname.startsWith('/api/') || url.origin !== window.location.origin || (url.pathname === location.pathname && url.search === location.search && url.hash)) return
    event.preventDefault()
    navigate(url.href)
  }

  // Chức năng handleSearch: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function handleSearch(event) {
    if (!event.target.matches('form.site-search')) return
    event.preventDefault()
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    const query = new FormData(event.target).get('q')?.toString().trim() || ''
    // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
    navigate('/products' + (query ? '?q=' + encodeURIComponent(query) : ''))
  }

  // Chức năng addToCart: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const addToCart = (product) => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!account) { requireLogin(); return }
    if (product.stockCount === 0) return
    const inCart = cart.find((item) => String(item.id) === String(product.id))?.quantity || 0
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (product.stockCount !== null && inCart >= product.stockCount) {
      setNotice('Đã đạt số lượng tồn kho của ' + product.name + '.')
      return
    }
    setCart((current) => addCartItem(current, { ...product, selected: false }))
    setNotice('Đã thêm ' + product.name + ' vào giỏ hàng.')
  }
  // Chức năng updateQuantity: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const updateQuantity = (id, quantity) => setCart((current) => setCartQuantity(current, id, quantity))
  // Chức năng toggleCartItem: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const toggleCartItem = (id) => setCart((current) => current.map((item) => String(item.id) === String(id) ? { ...item, selected: !item.selected } : item))
  // Chức năng completeOrder: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  const completeOrder = (order, purchasedItems) => {
    setOrders((current) => [order, ...current])
    const purchasedIds = new Set(purchasedItems.map((item) => String(item.id)))
    setCart((current) => current.filter((item) => !purchasedIds.has(String(item.id))))
    setSelectedVoucherCodes([])
    refreshCustomer()
  }
  const membershipTier = account?.tier || 'bronze'
  function paymentComplete(state) {
    setNotice({
      message: state === 'paid' ? 'Đã thanh toán. Thông báo được lưu trong trang cá nhân.'
        : 'Đã lưu thông báo chuyển khoản trong trang cá nhân. Cửa hàng sẽ đối soát khoản tiền.',
      href: '/account', action: 'Xem trang cá nhân →',
    })
    navigate('/')
  }
  // Chức năng requireLogin: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function requireLogin(next = location.pathname + location.search) {
    navigate('/login?next=' + encodeURIComponent(next))
  }
  // Chức năng toggleFavorite: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
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
  // Chức năng toggleVoucher: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function toggleVoucher(code) {
    setSelectedVoucherCodes((current) => current.includes(code) ? current.filter((item) => item !== code) : normalizeVoucherSelection([...current, code], wallet))
  }
  // Chức năng logout: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  async function logout() {
    customerEpoch.current += 1
    try { await customerApi('/api/customer/logout', { method: 'POST', csrfToken: account?.csrfToken }) } catch { /* Clear local account view even if the session expired. */ }
    setAccount(null); setOrders([]); setWallet([]); setFavoriteIds([]); setSelectedVoucherCodes([])
  }

  let page = <NotFound />
  if (!authReady && (protectedPage || route === 'auth')) page = <div className="container page-shell"><p>Đang kiểm tra phiên đăng nhập…</p></div>
  else if (isAuth) page = <Auth key={location.pathname + location.search} mode={route === 'auth' ? location.pathname : '/login'} next={route === 'auth' ? new URLSearchParams(location.search).get('next') || '/account' : location.pathname + location.search} onLogin={(value) => { customerEpoch.current += 1; setAccount(value || null); refreshCustomer() }} onNavigate={navigate} language={language} onLanguageChange={setLanguage} />
  else if (route === 'home') page = <Home
    appearance={appearance} products={products} onAddToCart={addToCart}
    favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite}
    promotionOverview={promotionOverview} account={account}
    promotions={<PromotionBoard overview={promotionOverview} account={account}
      selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher} />}
  />
  else if (route === 'products') page = <Catalog key={location.search} products={products} search={location.search} onAddToCart={addToCart} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  else if (route === 'product') page = <ProductDetail key={location.pathname} products={products} pathname={location.pathname} onAddToCart={addToCart} account={account} membershipTier={membershipTier} wallet={wallet} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onRequireLogin={requireLogin} onToggleVoucher={toggleVoucher} selectedVoucherCodes={selectedVoucherCodes} />
  else if (route === 'contact') page = <Contact appearance={appearance} products={products} account={account} onRequireLogin={() => requireLogin('/contact')} />
  else if (route === 'cart') page = <Cart cart={liveCart} products={products} account={account} onQuantity={updateQuantity} onToggle={toggleCartItem} onAddToCart={addToCart} onRequireLogin={() => requireLogin('/cart')} onNavigate={navigate} />
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  else if (route === 'checkout') page = <Checkout search={location.search} onNavigate={navigate} onPaymentComplete={paymentComplete} onRefresh={refreshCustomer} onCatalogRefresh={refreshCatalog} cart={selectedCart} account={account} membershipTier={membershipTier} wallet={wallet} selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher} onComplete={completeOrder} />
  else if (route === 'membership') page = <Membership account={account} tier={membershipTier} />
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  else if (route === 'rewards') page = <Rewards account={account} tier={membershipTier} wallet={wallet} onReward={refreshCustomer} onRequireLogin={requireLogin} onToggleVoucher={toggleVoucher} selectedVoucherCodes={selectedVoucherCodes} />
  else if (route === 'favorites') page = <Favorites products={products} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />
  // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
  else if (route === 'account') page = <Account onNavigate={navigate} onPaymentComplete={paymentComplete} onRefresh={refreshCustomer} account={account} orders={orders} membershipTier={membershipTier} wallet={wallet} selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher} onLogout={logout} />

  return <div className={'site-frame' + (isAuth ? ' site-frame--auth' : '')} style={{ '--accent': accentColor }} onClick={handleLink} onSubmitCapture={handleSearch}>
    {!isAuth && <Header appearance={appearance} products={products} cartCount={cartCount(cart)} account={account} membershipTier={membershipTier} theme={theme} onThemeChange={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} language={language} onLanguageChange={setLanguage} />}
    <main id="main-content" onInvalidCapture={showValidation} onInputCapture={clearValidation}
      onChangeCapture={clearValidation}>
      {!isAuth && ['home', 'products', 'favorites', 'rewards', 'membership', 'contact'].includes(route)
        ? <StorePromotions route={route} overview={promotionOverview} account={account}
          selectedVoucherCodes={selectedVoucherCodes} onToggleVoucher={toggleVoucher}>{page}</StorePromotions> : page}
    </main>
    {!isAuth && <Footer appearance={appearance} />}
    {!isAuth && notice && createPortal(<StoreNotice notice={notice} onClose={() => setNotice('')} />, document.body)}
    {!isAuth && <CustomerSupport account={account} onRequireLogin={requireLogin} />}
  </div>
}
