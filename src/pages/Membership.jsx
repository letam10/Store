/**
 * @codex-vn-doc
 * Tệp: src/pages/Membership.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Membership.
 * Liên kết trực tiếp: ../storefront/promotions.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { getMembershipPlan, membershipPlans } from '../services/promotions'
import { useLanguage } from '../context/i18n'
import './Storefront.css'

const tierIcons = {
  bronze: (
    <svg className="membership-tier-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  silver: (
    <svg className="membership-tier-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  gold: (
    <svg className="membership-tier-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      <circle cx="2" cy="4" r="1" fill="currentColor" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <circle cx="16" cy="11" r="1" fill="currentColor" />
      <circle cx="22" cy="4" r="1" fill="currentColor" />
    </svg>
  ),
  diamond: (
    <svg className="membership-tier-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12l4 6-10 13L2 9Z" />
      <path d="M11 3 8 9l4 13 4-13-3-6" />
      <path d="M2 9h20" />
    </svg>
  ),
}

// Chức năng Membership: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Membership({ account, tier = 'bronze', language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const current = getMembershipPlan(tier)
  const isGuest = !account

  // Calculate next tier progress if logged in
  const currentIndex = membershipPlans.findIndex((p) => p.id === current.id)
  const nextPlan = membershipPlans[currentIndex + 1] || null
  const userPoints = Number(account?.points || 0)
  const nextPointsRemaining = nextPlan ? Math.max(0, nextPlan.points - userPoints) : 0
  const progressPercent = nextPlan
    ? Math.min(100, Math.max(0, Math.round(((userPoints - current.points) / Math.max(1, nextPlan.points - current.points)) * 100)))
    : 100

  return (
    <div className="container page-shell membership-page">
      <header className="page-head membership-head">
        <div>
          <p className="eyebrow">{english ? 'MEMBERSHIP TIER' : 'HẠNG THÀNH VIÊN'}</p>
          <h1>{english ? 'OmniCart Membership' : 'Thành viên OmniCart'}</h1>
        </div>
        <p className="muted">
          {english
            ? 'Points are automatically earned on paid goods after all discounts.'
            : 'Tích điểm tự động từ số tiền hàng hóa đã thanh toán sau mọi mã giảm giá.'}
        </p>
      </header>

      {isGuest ? (
        <section className="membership-guest-gate surface">
          <div className="membership-guest-gate__glow" aria-hidden="true" />
          <div className="membership-guest-gate__emblem" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              <circle cx="2" cy="4" r="1" fill="currentColor" />
              <circle cx="12" cy="4" r="1" fill="currentColor" />
              <circle cx="22" cy="4" r="1" fill="currentColor" />
            </svg>
          </div>
          <span className="membership-badge">OMNICART VIP</span>
          <h2>{english ? 'Explore membership benefits' : 'Khám phá quyền lợi thành viên'}</h2>
          <p className="membership-guest-gate__subtitle">
            {english
              ? 'Sign in or register to save points, track your tier and receive account benefits.'
              : 'Đăng nhập hoặc đăng ký để lưu điểm, theo dõi hạng và nhận ưu đãi theo tài khoản của bạn.'}
          </p>

          <div className="membership-guest-perks">
            <div className="guest-perk-item">
              <span className="guest-perk-icon">🎁</span>
              <div>
                <strong>{english ? '1 point per 1,000 ₫' : 'Tích 1 điểm / 1.000 ₫'}</strong>
                <p>{english ? 'Auto accumulated from checkout' : 'Tự động tích sau khi thanh toán'}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">🏷️</span>
              <div>
                <strong>{english ? 'Up to 5% discount' : 'Chiết khấu tới 5%'}</strong>
                <p>{english ? 'Applied instantly on all orders' : 'Giảm trực tiếp theo từng hạng'}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">🎡</span>
              <div>
                <strong>{english ? 'Free lucky spins' : 'Lượt quay trúng thưởng'}</strong>
                <p>{english ? 'Earn spins to win vouchers' : 'Tặng thêm lượt quay may mắn'}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">👑</span>
              <div>
                <strong>{english ? '4 Exclusive Tiers' : '4 Hạng đặc quyền'}</strong>
                <p>{english ? 'Bronze, Silver, Gold, Diamond' : 'Đồng, Bạc, Vàng, Kim Cương'}</p>
              </div>
            </div>
          </div>

          <div className="membership-auth-actions">
            <a className="button button--vip-primary" href="/login?next=%2Fmembership">
              {english ? 'Sign in' : 'Đăng nhập'}
            </a>
            <a className="button button--soft button--vip-secondary" href="/register?next=%2Fmembership">
              {english ? 'Register' : 'Đăng ký'}
            </a>
          </div>
        </section>
      ) : (
        <>
          <section className={`membership-hero surface membership-hero--${tier}`}>
            <div className="membership-hero__ambient" aria-hidden="true" />
            <div className="membership-hero__main">
              <div className="membership-hero__badge-row">
                <span className="membership-badge">{current.badge}</span>
                <span className="membership-hero__rank-name">{current.title} Member</span>
              </div>
              <h2>{english ? `Current tier for ${account.username}` : `Hạng hiện tại của ${account.username}`}</h2>
              <div className="membership-hero__points-summary">
                <span className="membership-hero__points-value">{account.points.toLocaleString(english ? 'en-US' : 'vi-VN')}</span>
                <span className="membership-hero__points-unit">{english ? 'points · ' : ' điểm · '}</span>
                <span className="membership-hero__points-desc">{current.description}</span>
              </div>

              {nextPlan ? (
                <div className="membership-hero__progress-card">
                  <div className="membership-hero__progress-head">
                    <span>
                      {english ? 'Progress to ' : 'Tiến trình lên '}
                      <b>{nextPlan.name}</b>
                    </span>
                    <span className="membership-hero__points-needed">
                      {nextPointsRemaining === 0
                        ? english
                          ? 'Eligible for next tier!'
                          : 'Đã đủ điểm thăng hạng!'
                        : english
                          ? `${nextPointsRemaining.toLocaleString('en-US')} more points needed`
                          : `Còn ${nextPointsRemaining.toLocaleString('vi-VN')} điểm nữa`}
                    </span>
                  </div>
                  <div className="membership-hero__progress-bar">
                    <div className="membership-hero__progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              ) : (
                <div className="membership-hero__progress-card membership-hero__progress-card--max">
                  <div className="membership-hero__progress-head">
                    <span>★ {english ? 'Maximum VIP Tier reached!' : 'Đã đạt thứ hạng cao nhất!'}</span>
                    <span>{english ? 'Full benefits unlocked' : 'Trọn bộ quyền lợi VIP'}</span>
                  </div>
                  <div className="membership-hero__progress-bar">
                    <div className="membership-hero__progress-fill" style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              <div className="membership-hero__perks-row">
                <div className="hero-perk-chip">
                  <span className="hero-perk-chip__label">{english ? 'Discount' : 'Chiết khấu'}</span>
                  <span className="hero-perk-chip__val">-{current.discount}%</span>
                </div>
                <div className="hero-perk-chip">
                  <span className="hero-perk-chip__label">{english ? 'Multiplier' : 'Hệ số điểm'}</span>
                  <span className="hero-perk-chip__val">x{current.multiplier}</span>
                </div>
                <div className="hero-perk-chip">
                  <span className="hero-perk-chip__label">{english ? 'Wheel spins' : 'Lượt quay'}</span>
                  <span className="hero-perk-chip__val">{account.spinCredits || 0}</span>
                </div>
              </div>
            </div>

            <div className="membership-hero__side">
              <a className="button button--soft membership-hero__manage-btn" href="/account">
                {english ? 'Manage account' : 'Quản lý tài khoản'}
              </a>
            </div>
          </section>

          <div className="membership-grid">
            {membershipPlans.map((plan) => {
              const isCurrentTier = plan.id === tier
              return (
                <article
                  key={plan.id}
                  className={`membership-card membership-card--${plan.id} ${isCurrentTier ? 'is-current' : ''}`}
                >
                  {isCurrentTier && (
                    <div className="membership-card__crown-tag">
                      ★ {english ? 'CURRENT TIER' : 'HẠNG HIỆN TẠI'}
                    </div>
                  )}

                  <div className="membership-card__top">
                    <div className="membership-card__header-icon">{tierIcons[plan.id]}</div>
                    <div className="membership-card__title-group">
                      <span className="membership-card__english">{plan.title}</span>
                      <h2>{plan.name}</h2>
                    </div>
                    <p className="membership-card__desc">{plan.description}</p>
                  </div>

                  <div className="membership-price">
                    {plan.points === 0
                      ? english
                        ? 'Free'
                        : 'Miễn phí'
                      : plan.points.toLocaleString(english ? 'en-US' : 'vi-VN') + (english ? ' points' : ' điểm')}
                  </div>

                  <ul className="membership-card__benefits">
                    {plan.benefits.map((benefit) => (
                      <li key={benefit}>
                        <span className="benefit-icon" aria-hidden="true">✓</span>
                        <span className="benefit-text">{benefit.replace(/^✓\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>

                  <strong>
                    {isCurrentTier
                      ? english
                        ? 'Current tier'
                        : 'Hạng hiện tại'
                      : account.points < plan.points
                        ? english
                          ? `Need ${(plan.points - account.points).toLocaleString('en-US')} more points`
                          : 'Còn ' + (plan.points - account.points).toLocaleString('vi-VN') + ' điểm'
                        : english
                          ? 'Achieved'
                          : 'Đã vượt mốc'}
                  </strong>
                </article>
              )
            })}
          </div>

          <p className="membership-disclaimer">
            <span className="membership-disclaimer__icon" aria-hidden="true">ℹ</span>
            <span>
              {english
                ? 'Only confirmed goods payment after discounts counts; shipping and service fees are excluded. Each full 1,000 ₫ earns 1 base point. Apply the tier multiplier saved at checkout, then drop fractional points. Exchanges and returns adjust the points for that order.'
                : 'Chỉ tính tiền hàng đã thanh toán sau giảm giá, không gồm phí vận chuyển và phí dịch vụ. Mỗi 1.000 ₫ tròn nhận 1 điểm cơ bản; 999 ₫ không cộng điểm. Sau đó nhân quyền lợi hạng tại lúc đặt đơn và bỏ phần lẻ điểm. Đổi/trả hàng sẽ điều chỉnh điểm của đơn tương ứng.'}
            </span>
          </p>
        </>
      )}
    </div>
  )
}
