/*
  FILE NOTE
  - Mục đích: Trang giao diện Thành viên OmniCart (Membership), quản lý hiển thị thẻ VIP hội viên, thanh tiến trình thăng hạng, số điểm tích lũy, các đặc quyền chiết khấu/điểm/quay thưởng và 4 hạng thành viên Đồng, Bạc, Vàng, Kim Cương đồng bộ theo API /api/storefront/membership.
  - Liên kết trực tiếp: src/services/membershipPolicy.js, src/services/promotions.js, src/context/i18n.js
  - Vùng ảnh hưởng khi sửa: Toàn bộ giao diện trang /membership, thẻ thành viên, quyền lợi và thanh tiến độ lên hạng của khách hàng.
*/
import { useLanguage } from '../context/i18n'
import { useMembershipPolicy, formatPoints, resolveTierFromPolicy } from '../services/membershipPolicy'
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
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <circle cx="22" cy="4" r="1" fill="currentColor" />
    </svg>
  ),
  diamond: (
    <svg className="membership-tier-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M11 3 8 9l4 12 4-12-3-6" />
      <path d="M2 9h20" />
    </svg>
  )
}

export default function Membership({ account, tier = 'bronze', language: propLanguage, membershipPolicy: propPolicy }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish

  const { policy: hookPolicy } = useMembershipPolicy()
  const policy = propPolicy || hookPolicy

  const tiers = policy?.tiers || []
  const currentTierId = String(account ? resolveTierFromPolicy(account.points, policy).id : (tier || 'bronze')).toLowerCase()
  const current = tiers.find((t) => t.id === currentTierId) || tiers[0] || {
    id: 'bronze',
    englishLabel: 'BRONZE',
    name: 'Đồng',
    subtitle: 'Hạng mặc định, miễn phí.',
    minPoints: 0,
    discountPercent: 0,
    multiplier: 1.0,
    benefits: []
  }

  const isGuest = !account

  // Tính toán tiến trình lên hạng tiếp theo
  const currentIndex = tiers.findIndex((p) => p.id === current.id)
  const nextPlan = tiers[currentIndex + 1] || null
  const userPoints = Number(account?.points || 0)
  const nextPointsRemaining = nextPlan ? Math.max(0, nextPlan.minPoints - userPoints) : 0
  const progressPercent = nextPlan
    ? Math.min(100, Math.max(0, Math.round(((userPoints - current.minPoints) / Math.max(1, nextPlan.minPoints - current.minPoints)) * 100)))
    : 100

  const maxDiscount = Math.max(0, ...tiers.map((t) => t.discountPercent || 0))

  return (
    <div className="container page-shell membership-page">
      <header className="page-head membership-head">
        <div>
          <p className="eyebrow">{english ? 'MEMBERSHIP TIER' : 'HẠNG THÀNH VIÊN'}</p>
          <h1>{english ? 'OmniCart Membership' : 'Thành viên OmniCart'}</h1>
        </div>
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
                <strong>{english ? `1 point per ${formatPoints(policy.goodsPerBasePoint, 'en-US')} ₫` : `Tích 1 điểm / ${formatPoints(policy.goodsPerBasePoint)} ₫`}</strong>
                <p>{english ? 'Auto accumulated from checkout' : 'Tự động tích sau khi thanh toán'}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">🏷️</span>
              <div>
                <strong>{english ? `Up to ${maxDiscount}% discount` : `Chiết khấu tới ${maxDiscount}%`}</strong>
                <p>{english ? 'Applied instantly on all orders' : 'Giảm trực tiếp theo từng hạng'}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">🎡</span>
              <div>
                <strong>{english ? 'Free lucky spins' : 'Lượt quay trúng thưởng'}</strong>
                <p>{english ? `Every ${formatPoints(policy.goodsPerSpin, 'en-US')} ₫ gets 1 spin` : `Mỗi ${formatPoints(policy.goodsPerSpin)} ₫ nhận 1 lượt quay`}</p>
              </div>
            </div>
            <div className="guest-perk-item">
              <span className="guest-perk-icon">👑</span>
              <div>
                <strong>{english ? `${tiers.length} Exclusive Tiers` : `${tiers.length} Hạng đặc quyền`}</strong>
                <p>{tiers.map((t) => t.name).join(', ')}</p>
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
          <section className={`membership-hero surface membership-hero--${current.id}`}>
            <div className="membership-hero__ambient" aria-hidden="true" />
            <div className="membership-hero__ambient-glow" aria-hidden="true" />

            <div className="membership-hero__main">
              <div className="membership-hero__badge-row">
                <div className="membership-hero__icon-bubble" aria-hidden="true">
                  {tierIcons[current.id] || tierIcons.bronze}
                </div>
                <div className="membership-hero__badge-meta">
                  <span className="membership-badge">{current.englishLabel}</span>
                  <span className="membership-hero__rank-name">{current.name} ({current.englishLabel}) Member</span>
                </div>
              </div>

              <div className="membership-hero__title-group">
                <h2>{english ? `Current tier for ${account.username}` : `Hạng hiện tại của ${account.username}`}</h2>
                <p className="membership-hero__subtitle">
                  {english
                    ? 'Earn points automatically on paid goods after all discounts.'
                    : 'Tự động tích lũy điểm thưởng và nâng hạng sau khi hoàn tất thanh toán đơn hàng.'}
                </p>
              </div>

              <div className="membership-hero__points-summary">
                <div className="membership-hero__points-stat">
                  <span className="membership-hero__points-value">
                    {account.points.toLocaleString(english ? 'en-US' : 'vi-VN')}
                  </span>
                  <span className="membership-hero__points-unit">{english ? 'points' : 'điểm'}</span>
                </div>
                <div className="membership-hero__points-condition">
                  <span className="membership-hero__points-tag">
                    {english ? 'Unlock condition' : 'Điều kiện mở khóa'}
                  </span>
                  <span className="membership-hero__points-desc">{current.subtitle}</span>
                </div>
              </div>

              {nextPlan ? (
                <div className="membership-hero__progress-card">
                  <div className="membership-hero__progress-head">
                    <span className="membership-hero__progress-title">
                      {english ? 'Progress to ' : 'Tiến trình lên hạng '}
                      <b>{nextPlan.name}</b>
                    </span>
                    <span className="membership-hero__points-needed">
                      {nextPointsRemaining === 0
                        ? english
                          ? 'Eligible for next tier!'
                          : 'Đã đủ điểm thăng hạng!'
                        : english
                          ? `${nextPointsRemaining.toLocaleString('en-US')} more points needed`
                          : `Còn ${nextPointsRemaining.toLocaleString('vi-VN')} điểm nữa (${progressPercent}%)`}
                    </span>
                  </div>
                  <div className="membership-hero__progress-bar">
                    <div className="membership-hero__progress-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              ) : (
                <div className="membership-hero__progress-card membership-hero__progress-card--max">
                  <div className="membership-hero__progress-head">
                    <span className="membership-hero__progress-title">
                      ★ {english ? 'Maximum VIP Tier reached!' : 'Đã đạt thứ hạng cao nhất!'}
                    </span>
                    <span className="membership-hero__points-needed">
                      {english ? 'Full benefits unlocked' : 'Trọn bộ quyền lợi VIP'}
                    </span>
                  </div>
                  <div className="membership-hero__progress-bar">
                    <div className="membership-hero__progress-fill" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="membership-hero__side">
              <div className="membership-hero__side-header">
                <span className="membership-hero__side-eyebrow">
                  {english ? 'VIP PRIVILEGES' : 'ĐẶC QUYỀN HẠNG CỦA BẠN'}
                </span>
                <span className="membership-hero__side-status">
                  ★ {english ? 'VIP Active' : 'Đang kích hoạt'}
                </span>
              </div>

              <div className="membership-hero__perks-row membership-hero__perks-grid">
                <div className="hero-perk-card">
                  <div className="hero-perk-card__icon" aria-hidden="true">🏷️</div>
                  <div className="hero-perk-card__body">
                    <span className="hero-perk-card__val">-{current.discountPercent}%</span>
                    <span className="hero-perk-card__label">{english ? 'Direct discount' : 'Chiết khấu'}</span>
                    <small className="hero-perk-card__hint">{english ? 'On all orders' : 'Trừ thẳng vào hóa đơn'}</small>
                  </div>
                </div>

                <div className="hero-perk-card">
                  <div className="hero-perk-card__icon" aria-hidden="true">⚡</div>
                  <div className="hero-perk-card__body">
                    <span className="hero-perk-card__val">x{String(current.multiplier).replace('.', ',')}</span>
                    <span className="hero-perk-card__label">{english ? 'Multiplier' : 'Hệ số điểm'}</span>
                    <small className="hero-perk-card__hint">{english ? 'Per completed order' : 'Nhân điểm tích lũy'}</small>
                  </div>
                </div>

                <div className="hero-perk-card">
                  <div className="hero-perk-card__icon" aria-hidden="true">🎡</div>
                  <div className="hero-perk-card__body">
                    <span className="hero-perk-card__val">{account.spinCredits || 0}</span>
                    <span className="hero-perk-card__label">{english ? 'Wheel spins' : 'Lượt quay'}</span>
                    <small className="hero-perk-card__hint">{english ? 'Win vouchers' : 'Vòng quay may mắn'}</small>
                  </div>
                </div>
              </div>

              <div className="membership-hero__actions">
                <a className="button button--vip-primary membership-hero__manage-btn" href="/account">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{english ? 'Manage account' : 'Quản lý tài khoản'}</span>
                </a>
                <a className="button button--soft button--vip-secondary membership-hero__spin-btn" href="/rewards">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="12 8 8 12 12 16 16 12 12 8" />
                  </svg>
                  <span>{english ? 'Play wheel' : 'Vòng quay may mắn'}</span>
                </a>
              </div>
            </div>
          </section>

          <div className="membership-grid">
            {tiers.map((plan) => {
              const isCurrentTier = plan.id === current.id
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
                    <div className="membership-card__header-icon">{tierIcons[plan.id] || tierIcons.bronze}</div>
                    <div className="membership-card__title-group">
                      <span className="membership-card__english">{plan.englishLabel}</span>
                      <h2>{plan.name}</h2>
                    </div>
                    <p className="membership-card__desc">{plan.subtitle}</p>
                  </div>

                  <div className="membership-price">
                    {plan.minPoints === 0
                      ? english
                        ? 'Free'
                        : 'Miễn phí'
                      : formatPoints(plan.minPoints, english ? 'en-US' : 'vi-VN') + (english ? ' points' : ' điểm')}
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
                      : account.points < plan.minPoints
                        ? english
                          ? `Need ${(plan.minPoints - account.points).toLocaleString('en-US')} more points`
                          : 'Còn ' + (plan.minPoints - account.points).toLocaleString('vi-VN') + ' điểm'
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
            <span>{policy.footerNote}</span>
          </p>
        </>
      )}
    </div>
  )
}
