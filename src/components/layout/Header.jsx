import { useEffect, useRef, useState } from 'react'
import { products } from '../../data/products'
import { getMembershipPlan } from '../../storefront/promotions'
import './Header.css'

export default function Header({ appearance = {}, cartCount, account, membershipTier = 'bronze', theme = 'light', onThemeChange }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const searchRef = useRef(null)
  const pathname = window.location.pathname
  const currentQuery = new URLSearchParams(window.location.search).get('q') || ''
  const links = [
    ['/', appearance.navHome || 'Trang chủ'],
    ['/products', appearance.navProducts || 'Hàng hóa'],
    ['/favorites', appearance.navFavorites || 'Yêu thích'],
    ['/rewards', appearance.navRewards || 'May mắn'],
    ['/membership', appearance.navMembership || 'Thành viên'],
    ['/contact', appearance.navContact || 'Địa chỉ & liên hệ'],
  ]
  const brandName = appearance.brandName || 'store'
  const searchPlaceholder = appearance.headerSearchPlaceholder || 'Tìm sản phẩm, danh mục…'

  useEffect(() => {
    if (!searchOpen) return undefined
    searchRef.current?.focus()
    const closeOnEscape = (event) => { if (event.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [searchOpen])

  return <>
    <header className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <div className="container header-inner">
        <a className="brand" href="/" aria-label="Store - trang chủ"><span className="brand__mark" aria-hidden="true">✦</span><span className="brand__word">{brandName}<span>.</span></span><small>{appearance.brandTagline || 'EVERYDAY'}</small></a>
        <form className="site-search header-inline-search" action="/products" method="get" role="search" onFocus={() => setSearchOpen(true)}>
          <label className="sr-only" htmlFor="header-inline-search-input">Tìm sản phẩm</label>
          <input id="header-inline-search-input" name="q" type="search" list="site-search-suggestions-inline" placeholder={searchPlaceholder} defaultValue={currentQuery} />
          <datalist id="site-search-suggestions-inline">{products.slice(0, 80).map((product) => <option key={product.id} value={product.name} />)}</datalist>
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>
        <nav className={'header-nav' + (menuOpen ? ' is-open' : '')} aria-label="Điều hướng chính">
          {links.map(([href, label]) => <a key={href} href={href} aria-current={pathname === href ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="mobile-account-link" href="/account" onClick={() => setMenuOpen(false)}>{account ? 'Tài khoản của bạn' : 'Đăng nhập / Đăng ký'}</a>
        </nav>
        <div className="header-actions">
          <button className="header-search-trigger" type="button" aria-label="Mở tìm kiếm" aria-expanded={searchOpen} onClick={() => setSearchOpen(true)}>⌕</button>
          <button className="theme-switch" type="button" role="switch" aria-checked={theme === 'dark'} aria-label="Giao diện tối" onClick={onThemeChange} title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}><span className="theme-switch__icon" aria-hidden="true">☀</span><span className="theme-switch__track" aria-hidden="true"><span className="theme-switch__thumb" /></span><span className="theme-switch__icon" aria-hidden="true">☾</span></button>
          <a className="account-link" href="/account"><span className="account-link__avatar" aria-hidden="true">{account?.username ? account.username.slice(0, 1).toUpperCase() : '♙'}</span><span className="account-link__name">{account?.username ? getMembershipPlan(membershipTier).badge + ' · ' + account.username : 'Đăng nhập'}</span></a>
          <a className="cart-count" href="/cart" aria-label={'Giỏ hàng có ' + cartCount + ' sản phẩm'}><span aria-hidden="true">🛒</span><span className="cart-count__text">Giỏ hàng</span><b>{cartCount}</b></a>
          <button className="header-menu-trigger" type="button" aria-label="Mở menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>☰</button>
        </div>
      </div>
    </header>
    {searchOpen && <div className="header-search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
      <form className="site-search header-search-popover" action="/products" method="get" role="search" onSubmit={() => setSearchOpen(false)}>
        <label className="sr-only" htmlFor="site-search-input">Tìm sản phẩm</label>
        <input ref={searchRef} id="site-search-input" name="q" type="search" list="site-search-suggestions-popup" placeholder={searchPlaceholder} defaultValue={currentQuery} />
        <datalist id="site-search-suggestions-popup">{products.slice(0, 80).map((product) => <option key={product.id} value={product.name} />)}</datalist>
        <button type="submit" aria-label="Tìm kiếm">⌕</button>
        <button className="header-search-close" type="button" aria-label="Đóng tìm kiếm" onClick={() => setSearchOpen(false)}>×</button>
      </form>
    </div>}
  </>
}
