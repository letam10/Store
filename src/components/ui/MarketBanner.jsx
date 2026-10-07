import './MarketBanner.css'

function GroceryArt() {
  return (
    <g>
      <rect x="74" y="91" width="250" height="153" rx="12" fill="#f5e7c8" />
      <rect x="87" y="136" width="92" height="98" rx="5" fill="#94af88" />
      <path d="M98 153h70v65H98z" fill="#d9e6c8" />
      <path d="M107 176h52m-26-23v65" stroke="#94af88" strokeWidth="5" />
      <rect x="194" y="135" width="113" height="56" rx="5" fill="#d8e6c7" />
      <path d="M206 181v-19m14 19v-24m14 24v-14m15 14v-23m15 23v-17m16 17v-26"
        stroke="#648d62" strokeWidth="9" strokeLinecap="round" />
      <path d="m70 82 18-32h221l19 32z" fill="#335d44" />
      <path d="m103 50-10 32h30l6-32m28 0-2 32h30V50m27 0 3 32h31l-7-32m28 0 11 32h29l-17-32"
        fill="#f0dba9" />
      <path d="M70 82h258v24c-8 12-22 12-32 0-10 12-23 12-32 0-10 12-23 12-33 0-10 12-23 12-32 0-10 12-23 12-33 0-10 12-23 12-32 0-10 12-23 12-32 0-10 12-22 12-32 0z"
        fill="#588666" />
      <rect x="138" y="15" width="123" height="38" rx="9" fill="#264d38" />
      <text x="199" y="42" textAnchor="middle" fill="#fff6df" fontSize="26" fontWeight="800">store.</text>
      <path d="M194 201h113v31H194z" fill="#e2be80" />
      <circle cx="212" cy="207" r="12" fill="#dd9158" />
      <circle cx="236" cy="207" r="12" fill="#bd6748" />
      <circle cx="260" cy="207" r="12" fill="#dd9158" />
      <circle cx="284" cy="207" r="12" fill="#91a95b" />
      <path d="M186 215h128v21H186z" fill="#b48a55" />
      <path d="M42 227h30l-5 24H47z" fill="#b87b56" />
      <path d="M56 229v-48m0 27c-26 0-30-25-13-24 13 0 13 24 13 24m0 8c25 0 31-30 13-28-13 1-13 28-13 28"
        fill="#779a65" stroke="#527954" strokeWidth="3" />
      <path d="M331 211h26l-4 39h-18z" fill="#e6ba70" />
      <path d="M337 211v-27m11 27v-35" stroke="#86a466" strokeWidth="9" strokeLinecap="round" />
    </g>
  )
}

function DeliveryArt() {
  return (
    <g>
      <rect x="58" y="113" width="178" height="109" rx="9" fill="#e7c88f" />
      <path d="M236 142h55l40 44v36h-95z" fill="#6b9e7c" />
      <path d="M249 154h37l26 30h-63z" fill="#eff3df" />
      <circle cx="102" cy="225" r="23" fill="#284636" />
      <circle cx="102" cy="225" r="10" fill="#ece6cc" />
      <circle cx="284" cy="225" r="23" fill="#284636" />
      <circle cx="284" cy="225" r="10" fill="#ece6cc" />
      <rect x="110" y="133" width="72" height="67" rx="5" fill="#f6e3b9" />
      <path d="M146 134v30m-35-10h70" stroke="#bd955d" strokeWidth="6" />
      <text x="146" y="188" textAnchor="middle" fill="#355941" fontSize="15" fontWeight="800">store.</text>
      <circle cx="269" cy="72" r="38" fill="#fbefd6" stroke="#82b492" strokeWidth="6" />
      <path d="M269 49v25l17 10" fill="none" stroke="#355941" strokeWidth="6" strokeLinecap="round" />
      <path d="M23 153h24m-31 23h31m-21 23h21" stroke="#95bb99" strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

function RewardsArt() {
  return (
    <g>
      <rect x="69" y="70" width="238" height="147" rx="18" fill="#e8c487" transform="rotate(-9 188 143)" />
      <rect x="84" y="94" width="238" height="147" rx="18" fill="#315e45" />
      <path d="M103 170h200" stroke="#749b79" strokeWidth="1" />
      <text x="107" y="132" fill="#f7edd5" fontWeight="800" fontSize="27">store.</text>
      <text x="107" y="153" fill="#cfddc4" fontWeight="700" fontSize="10" letterSpacing="2">MEMBER CLUB</text>
      <text x="107" y="215" fill="#f4dfb4" fontWeight="800" fontSize="15">EVERYDAY / TOGETHER</text>
      <path d="m275 116 14 19-14 19-14-19z" fill="#e9c785" />
      <path d="m328 60 5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z" fill="#c49549" />
      <path d="m51 113 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1z" fill="#c49549" />
    </g>
  )
}

export default function MarketBanner({
  compact = false,
  variant = 'grocery',
  title = 'Một giỏ nhỏ. Đủ cho cả ngày.',
  description = 'Đồ dùng thiết yếu, ưu đãi thành viên và lựa chọn giao hàng thuận tiện.',
  href = '/products',
  action = 'Dạo một vòng siêu thị ↗',
}) {
  const kicker = variant === 'delivery'
    ? 'Đặt online · Nhận theo lịch'
    : variant === 'rewards' ? 'Store member club' : 'Siêu thị nhỏ · Tiện ích mỗi ngày'

  return (
    <section className={'market-banner market-banner--' + variant + (compact ? ' market-banner--compact' : '')}>
      <div className="market-banner__copy">
        <p className="market-banner-kicker">{kicker}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <a href={href}>{action}</a>
      </div>
      <svg viewBox="0 0 390 280" aria-hidden="true" focusable="false">
        <circle cx="210" cy="140" r="125" fill="#c9d8b5" opacity=".45" />
        <ellipse cx="203" cy="252" rx="161" ry="12" fill="#153b2b" opacity=".12" />
        {variant === 'delivery' ? <DeliveryArt /> : variant === 'rewards' ? <RewardsArt /> : <GroceryArt />}
      </svg>
    </section>
  )
}
