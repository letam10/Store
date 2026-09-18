import './Header.css'

const links = [
  ['/', 'Trang chủ'],
  ['/products', 'Hàng hóa'],
  ['/locations', 'Địa chỉ'],
  ['/contact', 'Liên hệ'],
]

export default function Header({ cartCount, account }) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <div className="container header-inner">
        <a className="brand" href="/">store<span>.</span><small>EVERYDAY</small></a>
        <nav aria-label="Điều hướng chính">
          {links.map(([href,label]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <a className="account-link" href="/account">{account?.username ? 'Hi, ' + account.username : 'Đăng nhập'}</a>
          <a className="cart-count" href="/cart" aria-label={'Giỏ hàng có ' + cartCount + ' sản phẩm'}>Giỏ hàng <b>{cartCount}</b></a>
        </div>
      </div>
    </header>
  )
}
