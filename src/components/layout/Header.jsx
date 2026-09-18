import { products } from '../../data/products'
import './Header.css'

const links = [
  ['/', 'Trang chủ'],
  ['/products', 'Hàng hóa'],
  ['/rewards', 'May mắn'],
  ['/membership', 'VIP'],
  ['/locations', 'Địa chỉ'],
  ['/contact', 'Liên hệ'],
]

export default function Header({ cartCount, account, membershipTier='standard' }) {
  const pathname = window.location.pathname
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <div className="container header-inner">
        <a className="brand" href="/">store<span>.</span><small>EVERYDAY</small></a>
        <form className="site-search" action="/products" method="get" role="search">
          <label className="sr-only" htmlFor="site-search-input">Tìm sản phẩm</label>
          <input id="site-search-input" name="q" type="search" list="site-search-suggestions" placeholder="Tìm sản phẩm, danh mục…" defaultValue={new URLSearchParams(window.location.search).get('q') || ''} />
          <datalist id="site-search-suggestions">{products.map((product)=><option key={product.id} value={product.name} />)}</datalist>
          <button type="submit" aria-label="Tìm kiếm">⌕</button>
        </form>
        <nav aria-label="Điều hướng chính">
          {links.map(([href,label]) => <a key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="account-link" href="/account">{account?.username ? (membershipTier!=='standard' ? membershipTier.toUpperCase()+' · ' : '') + account.username : 'Đăng nhập'}</a>
          <a className="cart-count" href="/cart" aria-label={'Giỏ hàng có ' + cartCount + ' sản phẩm'}><span aria-hidden="true">🛒</span> Giỏ hàng <b>{cartCount}</b></a>
        </div>
      </div>
    </header>
  )
}
