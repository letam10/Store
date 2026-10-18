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
export default function Footer({ appearance = {}, language = 'vi' }) {
  const brandName = appearance.brandName || 'store'
  const english = language === 'en'
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div><strong className="footer-brand">{brandName}.</strong><p>{appearance.footerText || (english ? 'Everyday essentials, thoughtfully curated from clear sources.' : 'Đồ dùng mỗi ngày, chọn vừa đủ và rõ nguồn.')}</p></div>
        <div><b>{appearance.footerShopTitle || (english ? 'Shop' : 'Mua sắm')}</b><a href="/products">{appearance.footerProducts || (english ? 'Products' : 'Hàng hóa')}</a><a href="/cart">{appearance.footerCart || (english ? 'Cart' : 'Giỏ hàng')}</a><a href="/membership">{appearance.footerMembership || (english ? 'Membership' : 'Thành viên')}</a><a href="/rewards">{appearance.footerRewards || (english ? 'Lucky Wheel' : 'Vòng quay may mắn')}</a></div>
        <div><b>{appearance.footerSupportTitle || (english ? 'Support' : 'Hỗ trợ')}</b><a href="/contact">{appearance.footerContact || (english ? 'Contact & Locations' : 'Địa chỉ & liên hệ')}</a><a href="/account">{appearance.footerAccount || (english ? 'Your account' : 'Tài khoản của bạn')}</a></div>
        <div><b>{appearance.footerInfoTitle || (english ? 'Information' : 'Thông tin')}</b><p>{appearance.footerInfo || (english ? 'Payment via bank transfer or cash on delivery. Points credited after confirmation.' : 'Thanh toán chuyển khoản hoặc khi nhận hàng. Điểm thành viên được cộng sau khi cửa hàng xác nhận đã thu tiền.')}</p></div>
      </div>
      <div className="container footer-bottom"><span>{appearance.footerCopyright || '© 2026 Store'}</span><span>{appearance.footerSupport || (english ? 'Shop nearby · Scheduled delivery' : 'Mua sắm gần nhà · Nhận hàng theo lịch')}</span></div>
    </footer>
  )
}
