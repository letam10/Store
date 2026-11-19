/*
  FILE NOTE
  - Mục đích: Chân trang (Footer) storefront OmniCart hiển thị thông tin thương hiệu, logo đồng bộ (ảnh vuông), liên kết mua sắm và hỗ trợ.
  - Liên kết trực tiếp: src/App.jsx, src/components/layout/Footer.css
  - Vùng ảnh hưởng khi sửa: Phần footer ở cuối mọi trang của storefront Store.
*/
import './Footer.css'
// Chức năng Footer: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Footer({ appearance = {}, language = 'vi' }) {
  const brandName = (appearance.brandName && appearance.brandName !== 'OmiCart') ? appearance.brandName : 'OmniCart'
  const english = language === 'en'
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <img src="/brand-logo-square.jpg" alt="OmniCart" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
            <strong className="footer-brand" style={{ margin: 0 }}>{brandName}.</strong>
          </div>
          <p>{appearance.footerText || (english ? 'Everyday essentials, thoughtfully curated from clear sources.' : 'Đồ dùng mỗi ngày, chọn vừa đủ và rõ nguồn.')}</p>
        </div>
        <div><b>{appearance.footerShopTitle || (english ? 'Shop' : 'Mua sắm')}</b><a href="/products">{appearance.footerProducts || (english ? 'Products' : 'Hàng hóa')}</a><a href="/cart">{appearance.footerCart || (english ? 'Cart' : 'Giỏ hàng')}</a><a href="/membership">{appearance.footerMembership || (english ? 'Membership' : 'Thành viên')}</a><a href="/rewards">{appearance.footerRewards || (english ? 'Lucky Wheel' : 'Vòng quay may mắn')}</a></div>
        <div><b>{appearance.footerSupportTitle || (english ? 'Support' : 'Hỗ trợ')}</b><a href="/contact">{appearance.footerContact || (english ? 'Contact & Locations' : 'Địa chỉ & liên hệ')}</a><a href="/account">{appearance.footerAccount || (english ? 'Your account' : 'Tài khoản của bạn')}</a></div>
        <div><b>{appearance.footerInfoTitle || (english ? 'Information' : 'Thông tin')}</b><p>{appearance.footerInfo || (english ? 'Payment via bank transfer or cash on delivery. Points credited after confirmation.' : 'Thanh toán chuyển khoản hoặc khi nhận hàng. Điểm thành viên được cộng sau khi cửa hàng xác nhận đã thu tiền.')}</p></div>
      </div>
      <div className="container footer-bottom"><span>{appearance.footerCopyright || '© 2026 OmniCart'}</span><span>{appearance.footerSupport || (english ? 'Shop nearby · Scheduled delivery' : 'Mua sắm gần nhà · Nhận hàng theo lịch')}</span></div>
    </footer>
  )
}
