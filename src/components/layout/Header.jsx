/*
  FILE NOTE
  - Mục đích: Header chính của Store, điều hướng menu, thanh tìm kiếm thông minh với gợi ý sản phẩm mẫu ngay dưới thanh tìm kiếm, bộ chọn giao diện/ngôn ngữ và trạng thái giỏ hàng/tài khoản.
  - Liên kết trực tiếp: src/App.jsx, src/data/products.js, src/storefront/promotions.js, src/components/layout/Header.css, src/storefront/polish.css
  - Vùng ảnh hưởng khi sửa: Toàn bộ header trang chủ và các trang storefront, trải nghiệm tìm kiếm gợi ý, điều hướng menu.
*/
import { useEffect, useRef, useState } from 'react'
import { products as defaultProducts } from '../../data/products'
import { getMembershipPlan } from '../../storefront/promotions'
import './Header.css'

const fallbackPictures = { 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }
const currencyFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

function SearchSuggestions({ items, query, onSelect, id }) {
  const normalizedQuery = query.trim().toLowerCase()
  const allMatches = items.filter((product) => {
    if (!product?.name) return false
    if (!normalizedQuery) return true
    return `${product.name} ${product.category || ''}`.toLowerCase().includes(normalizedQuery)
  })
  const limit = 5
  const matches = allMatches.slice(0, limit)
  const remainingCount = allMatches.length - matches.length

  return <div id={id} className="search-suggestions" role="listbox" aria-label="Sản phẩm gợi ý">
    <div className="search-suggestions__heading">
      <span>{normalizedQuery ? 'Gợi ý sản phẩm tìm kiếm' : 'Sản phẩm mẫu nổi bật'}</span>
      <small>{allMatches.length} sản phẩm</small>
    </div>
    {matches.length ? matches.map((product) => {
      const image = product.image || fallbackPictures[product.id]
      return <a key={product.id} className="search-suggestion" href={'/products/' + encodeURIComponent(product.id)} role="option" onClick={onSelect}>
        <span className="search-suggestion__image">{image ? <img src={image.startsWith('/') || image.startsWith('http') ? image : '/products/' + image + '.svg'} alt="" loading="lazy" /> : <span aria-hidden="true">{product.symbol || '✦'}</span>}</span>
        <span className="search-suggestion__copy"><strong>{product.name}</strong><small>{product.category || 'Sản phẩm Store'}{product.price ? ` · ${currencyFormat.format(product.price)}` : ''}</small></span>
        <span className="search-suggestion__arrow" aria-hidden="true">↗</span>
      </a>
    }) : <p className="search-suggestions__empty">Chưa có sản phẩm phù hợp. Thử từ khóa khác.</p>}
    {remainingCount > 0 && <a href={query.trim() ? '/products?q=' + encodeURIComponent(query.trim()) : '/products'} className="search-suggestions__more" onClick={onSelect}>
      ... còn {remainingCount} sản phẩm nữa. Nhấn Enter để xem toàn bộ kết quả →
    </a>}
  </div>
}

// Chức năng Header: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Header({ appearance = {}, products = defaultProducts, cartCount, account, membershipTier = 'bronze', theme = 'light', onThemeChange, language = 'vi', onLanguageChange }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const searchRef = useRef(null)
  const searchShellRef = useRef(null)
  const headerRef = useRef(null)
  const pathname = window.location.pathname
  const english = language === 'en'
  const links = [
    ['/', appearance.navHome || (english ? 'Home' : 'Trang chủ')],
    ['/products', appearance.navProducts || (english ? 'Products' : 'Hàng hóa')],
    ['/favorites', appearance.navFavorites || (english ? 'Favorites' : 'Yêu thích')],
    ['/rewards', appearance.navRewards || (english ? 'Rewards' : 'May mắn')],
    ['/membership', appearance.navMembership || (english ? 'Membership' : 'Thành viên')],
    ['/contact', appearance.navContact || (english ? 'Contact' : 'Địa chỉ & liên hệ')],
  ]
  const brandName = appearance.brandName || 'store'
  const searchPlaceholder = appearance.headerSearchPlaceholder || (english ? 'Search products or categories…' : 'Tìm sản phẩm, danh mục…')

  // Truyền chiều cao thật cho các vùng sticky, kể cả khi menu/ngôn ngữ đổi kích thước.
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined' || !headerRef.current) return undefined
    const measure = () => document.documentElement.style.setProperty('--store-header-height', `${headerRef.current.getBoundingClientRect().height}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (!searchOpen) return undefined
    searchRef.current?.focus()
    // Chức năng closeOnEscape: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
    const closeOnEscape = (event) => { if (event.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])

  useEffect(() => {
    if (!accountOpen) return undefined
    // Dropdown avatar đóng khi bấm ra ngoài hoặc nhấn Escape.
    const closeAccount = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !accountRef.current?.contains(event.target))) setAccountOpen(false)
    }
    document.addEventListener('keydown', closeAccount)
    document.addEventListener('pointerdown', closeAccount)
    return () => {
      document.removeEventListener('keydown', closeAccount)
      document.removeEventListener('pointerdown', closeAccount)
    }
  }, [accountOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    // Menu mobile đóng khi bấm ra ngoài hoặc nhấn Escape để không che nội dung.
    const closeMenu = (event) => {
      if (event.key === 'Escape' || (event.type === 'pointerdown' && !headerRef.current?.contains(event.target))) setMenuOpen(false)
    }
    document.addEventListener('keydown', closeMenu)
    document.addEventListener('pointerdown', closeMenu)
    return () => {
      document.removeEventListener('keydown', closeMenu)
      document.removeEventListener('pointerdown', closeMenu)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!suggestionsOpen) return undefined
    const closeSuggestions = (event) => {
      if (event.key === 'Escape') setSuggestionsOpen(false)
      if ((event.type === 'pointerdown' || event.type === 'focusin') && !searchShellRef.current?.contains(event.target)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('keydown', closeSuggestions)
    document.addEventListener('pointerdown', closeSuggestions)
    document.addEventListener('focusin', closeSuggestions)
    return () => {
      document.removeEventListener('keydown', closeSuggestions)
      document.removeEventListener('pointerdown', closeSuggestions)
      document.removeEventListener('focusin', closeSuggestions)
    }
  }, [suggestionsOpen])

  return <>
    <header ref={headerRef} className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <div className="container header-inner">
        <a className="brand" href="/" aria-label="Store - trang chủ"><span className="brand__mark" aria-hidden="true">✦</span><span className="brand__word">{brandName}<span>.</span></span><small>{appearance.brandTagline || 'EVERYDAY'}</small></a>
        <div className="header-search-shell" ref={searchShellRef}>
        <form className="site-search header-inline-search" action="/products" method="get" role="search" onFocus={() => setSuggestionsOpen(true)} onSubmit={() => setSuggestionsOpen(false)}>
          <label className="sr-only" htmlFor="header-inline-search-input">Tìm sản phẩm</label>
          <input id="header-inline-search-input" name="q" type="search" autoComplete="off" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setSuggestionsOpen(true) }} aria-controls="header-inline-suggestions" aria-expanded={suggestionsOpen} placeholder={searchPlaceholder} />
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>
        {suggestionsOpen && <SearchSuggestions id="header-inline-suggestions" items={products} query={searchTerm} onSelect={() => setSuggestionsOpen(false)} />}
        </div>
        <nav id="header-navigation" className={'header-nav' + (menuOpen ? ' is-open' : '')} aria-label="Điều hướng chính">
          {links.map(([href, label]) => <a key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="mobile-account-link" href="/account" onClick={() => setMenuOpen(false)}>{account ? (english ? 'Your account' : 'Tài khoản của bạn') : (english ? 'Sign in / Register' : 'Đăng nhập / Đăng ký')}</a>
        </nav>
        <div className="header-actions">
          <button className="header-search-trigger" type="button" aria-label="Mở tìm kiếm" aria-expanded={searchOpen} onClick={() => { setMenuOpen(false); setSearchOpen(true); setSuggestionsOpen(true); setAccountOpen(false) }}>⌕</button>
          <label className="header-language"><span className="sr-only">{english ? 'Language' : 'Ngôn ngữ'}</span><select aria-label={english ? 'Language' : 'Ngôn ngữ'} value={language} onChange={(event) => onLanguageChange?.(event.target.value)}><option value="vi">VI</option><option value="en">EN</option></select></label>
          <button className="theme-switch" type="button" role="switch" aria-checked={theme === 'dark'} aria-label="Giao diện tối" onClick={onThemeChange} title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}><span className="theme-switch__icon" aria-hidden="true">☀</span><span className="theme-switch__track" aria-hidden="true"><span className="theme-switch__thumb" /></span><span className="theme-switch__icon" aria-hidden="true">☾</span></button>
          {account?.username ? <div ref={accountRef} className={'account-menu' + (accountOpen ? ' is-open' : '')}>
            <button type="button" className="account-link account-menu__trigger" aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => { setMenuOpen(false); setSearchOpen(false); setAccountOpen((current) => !current) }} title={english ? 'Open user dashboard' : 'Mở dashboard người dùng'}>
              <span className="account-link__avatar" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</span><span className="account-link__name">{getMembershipPlan(membershipTier).badge + ' · ' + account.username}</span><span className="account-menu__caret" aria-hidden="true">▾</span>
            </button>
            {accountOpen && <div className="account-menu__dropdown" role="menu" aria-label={english ? 'User dashboard' : 'Dashboard người dùng'}>
              <p className="account-menu__hello">{english ? 'Hello,' : 'Xin chào,'} <b>{account.username}</b> · {getMembershipPlan(membershipTier).badge}</p>
              <a role="menuitem" href="/account" onClick={() => setAccountOpen(false)}>🏠 {english ? 'Dashboard / My account' : 'Dashboard / Tài khoản của tôi'}</a>
              <a role="menuitem" href="/account" onClick={() => setAccountOpen(false)}>📦 {english ? 'Orders & history' : 'Đơn hàng của bạn'}</a>
              <a role="menuitem" href="/favorites" onClick={() => setAccountOpen(false)}>♥ {english ? 'Favorites' : 'Sản phẩm yêu thích'}</a>
              <a role="menuitem" href="/rewards" onClick={() => setAccountOpen(false)}>🎁 {english ? 'Rewards & vouchers' : 'Ưu đãi & voucher'}</a>
              <a role="menuitem" href="/membership" onClick={() => setAccountOpen(false)}>★ {english ? 'Membership tier' : 'Hạng thành viên'}</a>
            </div>}
          </div> : <a className="account-link" href="/account"><span className="account-link__avatar" aria-hidden="true">♙</span><span className="account-link__name">{english ? 'Sign in' : 'Đăng nhập'}</span></a>}
          <a className="cart-count" href="/cart" aria-label={(english ? 'Cart with ' : 'Giỏ hàng có ') + cartCount + (english ? ' products' : ' sản phẩm')}><span aria-hidden="true">🛒</span><span className="cart-count__text">{english ? 'Cart' : 'Giỏ hàng'}</span><b>{cartCount}</b></a>
          <button className="header-menu-trigger" type="button" aria-controls="header-navigation" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => { setSearchOpen(false); setMenuOpen((current) => !current) }}>☰</button>
        </div>
      </div>
    </header>
    {searchOpen && <div className="header-search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSearchOpen(false); setSuggestionsOpen(false) } }}>
      <div className="header-search-shell header-search-shell--popover">
      <form className="site-search header-search-popover" action="/products" method="get" role="search" onSubmit={() => { setSearchOpen(false); setSuggestionsOpen(false) }}>
        <label className="sr-only" htmlFor="site-search-input">Tìm sản phẩm</label>
        <input ref={searchRef} id="site-search-input" name="q" type="search" autoComplete="off" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setSuggestionsOpen(true) }} aria-controls="header-popup-suggestions" aria-expanded={suggestionsOpen} placeholder={searchPlaceholder} />
        <button type="submit" aria-label="Tìm kiếm">⌕</button>
        <button className="header-search-close" type="button" aria-label="Đóng tìm kiếm" onClick={() => { setSearchOpen(false); setSuggestionsOpen(false) }}>×</button>
      </form>
      {suggestionsOpen && <SearchSuggestions id="header-popup-suggestions" items={products} query={searchTerm} onSelect={() => { setSearchOpen(false); setSuggestionsOpen(false) }} />}
      </div>
    </div>}
  </>
}
