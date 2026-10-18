/**
 * @codex-vn-doc
 * Tệp: src/pages/Membership.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Membership.
 * Liên kết trực tiếp: ../storefront/promotions.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { getMembershipPlan, membershipPlans } from '../storefront/promotions'
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'

// Chức năng Membership: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Membership({ account, tier = 'bronze', language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const current = getMembershipPlan(tier)
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">{english ? 'MEMBERSHIP TIER' : 'HẠNG THÀNH VIÊN'}</p><h1>{english ? 'Store Membership' : 'Thành viên Store'}</h1></div><p className="muted">{english ? 'Points are automatically earned on paid goods after all discounts.' : 'Tích điểm tự động từ số tiền hàng hóa đã thanh toán sau mọi mã giảm giá.'}</p></header>
    <section className="membership-hero surface"><div><span className="membership-badge">{current.badge}</span><h2>{english ? `Current tier for ${account.username}` : `Hạng hiện tại của ${account.username}`}</h2><p>{account.points.toLocaleString(english ? 'en-US' : 'vi-VN')} {english ? 'points' : 'điểm'} · {current.description}</p></div><a className="button button--soft" href="/account">{english ? 'Manage account' : 'Quản lý tài khoản'}</a></section>
    <div className="membership-grid">{membershipPlans.map((plan) => <article key={plan.id} className={'membership-card ' + (plan.id === tier ? 'is-current' : '')}>
      <div><span className="membership-card__english">{plan.title}</span><h2>{plan.name}</h2><p>{plan.description}</p></div>
      <div className="membership-price">{plan.points === 0 ? (english ? 'Free' : 'Miễn phí') : plan.points.toLocaleString(english ? 'en-US' : 'vi-VN') + (english ? ' points' : ' điểm')}</div>
      <ul>{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>
      <strong>{plan.id === tier ? (english ? 'Current tier' : 'Hạng hiện tại') : account.points < plan.points ? (english ? `Need ${(plan.points - account.points).toLocaleString('en-US')} more points` : 'Còn ' + (plan.points - account.points).toLocaleString('vi-VN') + ' điểm') : (english ? 'Achieved' : 'Đã vượt mốc')}</strong>
    </article>)}</div>
    <p className="membership-disclaimer">{english ? 'Only confirmed goods payment is counted towards points. Every 1,000 ₫ earns 1 base point. Gold and Diamond bonus multipliers are calculated after confirmed orders.' : 'Chỉ tính tiền hàng hóa đã ghi nhận thanh toán. Mỗi 1.000 ₫ tròn nhận 1 điểm cơ bản; 999 ₫ không cộng điểm. Điểm thưởng hạng Vàng và Kim Cương được tính sau bước này.'}</p>
  </div>
}
