import './Header.css'
export default function Header({ cartCount }) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <div className="container header-inner">
        <a className="brand" href="#">store<span>.</span></a>
        <nav aria-label="Điều hướng chính"><a href="#products">Sản phẩm</a><a href="#about">Về Store</a></nav>
        <span className="cart-count" role="status">Giỏ hàng · {cartCount}</span>
      </div>
    </header>
  )
}
