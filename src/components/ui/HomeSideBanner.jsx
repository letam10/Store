import { membershipPlans } from '../../storefront/promotions'
import './HomeSideBanner.css'

export default function HomeSideBanner({ side, overview, account }) {
  const { sales, maxDiscount, vouchers, plan, points } = overview
  const isStore = side === 'left'
  const bestPlan = membershipPlans.at(-1)
  const discount = account ? plan.discount : bestPlan.discount

  return (
    <article className={'home-side-banner home-side-banner--' + (isStore ? 'store' : 'member')}>
      <p className="home-side-banner__brand">
        <span>store.</span>
        <span aria-hidden="true">✦</span>
      </p>
      <svg className="home-side-banner__art" viewBox="0 0 160 114" aria-hidden="true" focusable="false">
        <ellipse cx="80" cy="102" rx="60" ry="7" fill="currentColor" opacity=".1" />
        {isStore ? <g>
          <path d="M40 42h83l-8 58H47z" fill="#e4bd77" />
          <path d="M57 44V29c0-27 42-27 42 0v15" fill="none" stroke="#426e4b" strokeWidth="7" />
          <path d="M81 31C59 29 51 15 55 7c16-2 26 6 26 24" fill="#86aa69" />
          <path d="M87 31C91 15 104 9 113 15c0 13-10 19-26 16" fill="#537e52" />
          <path d="M31 51c-12-16-30-8-24 11 5 18 28 23 36 4 5-12 1-22-12-15" fill="#df8559" />
          <path d="m31 52 1-14" stroke="#4f7443" strokeWidth="4" />
          <path d="M118 52h28v45h-28z" fill="#f5efdc" />
          <path d="m118 52 6-13h16l6 13" fill="#85a58d" />
          <path d="M125 66h15v21h-15z" fill="#426e4b" />
          <text x="81" y="80" textAnchor="middle" fill="#31573e" fontSize="16" fontWeight="900">
            store.
          </text>
        </g> : <g>
          <path d="m80 8 48 29-13 56H45L32 37z" fill="#d7ba77" opacity=".16" />
          <path d="m80 21 34 24-34 46-34-46z" fill="#f2cf80" />
          <path d="m46 45 34 5 34-5M66 34l14 16 14-16M80 50v41" fill="none" stroke="#aa743b" strokeWidth="2" />
          <path d="m27 23 3 9 9 3-9 3-3 9-3-9-9-3 9-3zM134 65l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e9bc63" />
        </g>}
      </svg>
      <p className="home-side-banner__kicker">
        {isStore ? 'GẦN NHÀ · GẦN BẠN' : 'THÀNH VIÊN STORE'}
      </p>
      <h2>
        {isStore ? 'Ghé một chút. Chọn món cần.'
          : account ? 'Quyền lợi hạng ' + plan.name : 'Gắn bó hơn. Tiết kiệm hơn.'}
      </h2>
      <div className="home-side-banner__offer">
        <span>{isStore ? sales.length ? 'Ưu đãi hàng hóa đến' : 'Khám phá Store' : 'Giảm thêm khi thanh toán'}</span>
        <strong>
          {isStore ? sales.length ? '−' + maxDiscount : 'Mỗi ngày' : discount}
          {(!isStore || sales.length > 0) && <small>%</small>}
        </strong>
        <p>
          {isStore
            ? sales.length ? sales.length + ' sản phẩm đang giảm giá.' : 'Đồ dùng mỗi ngày, dễ chọn và dễ tìm.'
            : account ? points.toLocaleString('vi-VN') + ' điểm đã tích.'
              : 'Khi đạt hạng ' + bestPlan.name + ' · ' + bestPlan.points.toLocaleString('vi-VN') + ' điểm.'}
        </p>
      </div>
      {isStore ? <a className="home-side-banner__action" href="#home-sale-products">
        Xem khu giá tốt <span aria-hidden="true">↓</span>
      </a> : <>
        <a className="home-side-banner__action" href="/membership">
          Quyền lợi & điều kiện <span aria-hidden="true">↗</span>
        </a>
        <a className="home-side-banner__gift" href="/rewards">
          <span aria-hidden="true">◇</span>
          <span>
            <b>{vouchers.length ? vouchers.length + ' mã trong ví' : 'Quà hàng hóa & ship'}</b>
            <small>{account ? Number(account.spinCredits || 0) + ' lượt quay còn lại' : 'Hai vòng quay · Chung lượt'}</small>
          </span>
          <span aria-hidden="true">→</span>
        </a>
      </>}
    </article>
  )
}
