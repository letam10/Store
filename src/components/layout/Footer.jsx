import './Footer.css'
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><strong className="footer-brand">store.</strong><p>Đồ dùng mỗi ngày, chọn vừa đủ và rõ nguồn.</p></div>
        <div><b>Mua sắm</b><a href="/products">Hàng hóa</a><a href="/cart">Giỏ hàng</a><a href="/account">Tài khoản</a></div>
        <div><b>Hỗ trợ</b><a href="/contact">Liên hệ</a><a href="/locations">Địa chỉ cửa hàng</a><a href="/admin">Khu vực admin</a></div>
        <div><b>Thông tin</b><p>Prototype thương mại điện tử. Thanh toán và tồn kho hiện là giao diện demo.</p></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Store</span><span>Thiết kế ưu tiên tốc độ · rõ ràng · mobile-first</span></div>
    </footer>
  )
}
