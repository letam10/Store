import './Footer.css'
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><strong className="footer-brand">store.</strong><p>Đồ dùng mỗi ngày, chọn vừa đủ và rõ nguồn.</p></div>
        <div><b>Mua sắm</b><a href="/products">Hàng hóa</a><a href="/cart">Giỏ hàng</a><a href="/membership">Thành viên</a><a href="/rewards">Vòng quay may mắn</a></div>
        <div><b>Hỗ trợ</b><a href="/contact">Địa chỉ & liên hệ</a><a href="/account">Tài khoản của bạn</a></div>
        <div><b>Thông tin</b><p>Danh mục và giá là dữ liệu mẫu. Chưa kết nối cổng thanh toán trực tuyến; điểm được cộng sau khi quản trị viên xác nhận thanh toán.</p></div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Store</span><span>Thiết kế ưu tiên tốc độ · rõ ràng · mobile-first</span></div>
    </footer>
  )
}
