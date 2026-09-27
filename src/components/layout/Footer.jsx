/**
 * @codex-vn-doc
 * Tệp: src/components/layout/Footer.jsx
 * Mục đích: Footer Store và các liên kết mua sắm/hỗ trợ lấy từ cấu hình giao diện.
 * Thành phần chính: Footer.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import './Footer.css'
// Chức năng Footer: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Footer({ appearance = {} }) {
  const brandName = appearance.brandName || 'store'
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><strong className="footer-brand">{brandName}.</strong><p>{appearance.footerText || 'Đồ dùng mỗi ngày, chọn vừa đủ và rõ nguồn.'}</p></div>
        <div><b>{appearance.footerShopTitle || 'Mua sắm'}</b><a href="/products">{appearance.footerProducts || 'Hàng hóa'}</a><a href="/cart">{appearance.footerCart || 'Giỏ hàng'}</a><a href="/membership">{appearance.footerMembership || 'Thành viên'}</a><a href="/rewards">{appearance.footerRewards || 'Vòng quay may mắn'}</a></div>
        <div><b>{appearance.footerSupportTitle || 'Hỗ trợ'}</b><a href="/contact">{appearance.footerContact || 'Địa chỉ & liên hệ'}</a><a href="/account">{appearance.footerAccount || 'Tài khoản của bạn'}</a></div>
        <div><b>{appearance.footerInfoTitle || 'Thông tin'}</b><p>{appearance.footerInfo || 'Danh mục và giá là dữ liệu mẫu. Chưa kết nối cổng thanh toán trực tuyến; điểm được cộng sau khi quản trị viên xác nhận thanh toán.'}</p></div>
      </div>
      <div className="container footer-bottom"><span>{appearance.footerCopyright || '© 2026 Store'}</span><span>{appearance.footerSupport || 'Thiết kế ưu tiên tốc độ · rõ ràng · mobile-first'}</span></div>
    </footer>
  )
}
