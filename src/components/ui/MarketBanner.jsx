import './MarketBanner.css'

export default function MarketBanner({ compact = false, variant = 'grocery', title = 'Một giỏ nhỏ. Đủ cho cả ngày.', description = 'Đồ dùng thiết yếu, ưu đãi thành viên và lựa chọn giao hàng thuận tiện.', href = '/products', action = 'Dạo một vòng siêu thị ↗' }) {
  return <section className={'market-banner market-banner--' + variant + (compact ? ' market-banner--compact' : '')}>
    <div><p className="market-banner-kicker">{variant === 'delivery' ? 'Đặt online · Nhận theo lịch' : variant === 'rewards' ? 'Tích lượt · Thêm niềm vui' : 'Gần nhà · Gần bạn'}</p><h2>{title}</h2><p>{description}</p><a href={href}>{action}</a></div>
    <svg viewBox="0 0 390 280" aria-hidden="true" focusable="false">
      <path d="M52 191C7 140 48 42 116 30c59-11 97 28 158 24 92-7 103 91 66 154-39 66-233 47-288-17" fill={variant === 'rewards' ? '#dec792' : variant === 'delivery' ? '#abd1c2' : '#b8cfaa'} opacity=".48" />
      <ellipse cx="205" cy="245" rx="130" ry="13" fill="#153b2b" opacity=".1" />
      {variant === 'delivery' ? <g>
        <path d="M63 115h172v111H63z" fill="#e5cc93" /><path d="M235 145h57l37 43v38h-94z" fill="#6b9e7c" /><path d="M248 156h40l26 30h-66z" fill="#f4f0dc" />
        <circle cx="102" cy="227" r="23" fill="#284636" /><circle cx="102" cy="227" r="10" fill="#ece6cc" /><circle cx="281" cy="227" r="23" fill="#284636" /><circle cx="281" cy="227" r="10" fill="#ece6cc" />
        <rect x="112" y="135" width="70" height="65" rx="5" fill="#f4dfb4" /><path d="M147 136v31m-35-12h70" stroke="#ba9362" strokeWidth="6" /><text x="146" y="188" textAnchor="middle" fill="#355941" fontSize="14" fontWeight="800">store.</text>
        <circle cx="273" cy="81" r="42" fill="#fbefd6" stroke="#82b492" strokeWidth="6" /><path d="M273 55v27l17 11" fill="none" stroke="#355941" strokeWidth="6" strokeLinecap="round" /><path d="M24 150h30m-35 21h35m-26 21h26" stroke="#95bb99" strokeWidth="6" strokeLinecap="round" />
      </g> : variant === 'rewards' ? <g>
        <rect x="69" y="99" width="210" height="119" rx="18" fill="#f7eacb" transform="rotate(-12 69 99)" /><path d="M201 78v123" stroke="#bf9d61" strokeWidth="4" strokeDasharray="5 8" />
        <text x="110" y="146" fill="#41664a" fontWeight="900" fontSize="24" transform="rotate(-12 110 146)">VOUCHER</text><text x="225" y="133" fill="#b18242" fontWeight="900" fontSize="18" transform="rotate(-12 225 133)">SHIP</text>
        <rect x="106" y="155" width="197" height="76" rx="12" fill="#85b39b" /><path d="M260 156v74" stroke="#dcebdc" strokeWidth="3" strokeDasharray="5 6" /><text x="136" y="202" fill="#183c2b" fontSize="23" fontWeight="900">store.</text>
        <path d="m315 104 6 15 16 1-12 10 4 16-14-9-14 9 4-16-12-10 16-1zM74 68l5 13 14 1-11 9 4 14-12-8-12 8 4-14-11-9 14-1z" fill="#dba34f" />
      </g> : <g>
        <path d="M143 89c-8-39-39-40-44-19-4 14 13 31 44 39M164 89c5-35 31-46 39-26 6 16-7 30-39 43" fill="#79a87a" /><path d="M149 117c-2-45-9-70-9-84" stroke="#325e3f" strokeWidth="5" fill="none" />
        <path d="M122 107h140l-10 130H112z" fill="#eac487" /><path d="M112 122h62v115h-62z" fill="#f4dda9" /><path d="M178 106V85c0-34 46-34 46 0v21" stroke="#c09864" strokeWidth="8" fill="none" />
        <path d="M233 92h44l13 26v88h-57z" fill="#ecf0d9" /><path d="M233 92h44v27h-44z" fill="#527c50" /><path d="m277 92 13 26h-13z" fill="#91b68b" /><rect x="247" y="142" width="25" height="42" rx="3" fill="#81a681" />
        <path d="M72 162c-1-39 28-56 55-33 22-18 51-4 42 33-13 51-91 53-97 0" fill="#e8a176" /><path d="M127 130v-18" stroke="#527a47" strokeWidth="6" /><ellipse cx="142" cy="114" rx="14" ry="6" fill="#749f69" transform="rotate(-22 142 114)" />
        <circle cx="286" cy="222" r="27" fill="#cba875" /><path d="m267 206 15 32m-4-40 15 35m-4-36 15 30" stroke="#f5dfb4" strokeWidth="4" strokeLinecap="round" /><text x="179" y="196" fontSize="22" fontWeight="900" fill="#31583c">store.</text>
      </g>}
    </svg>
  </section>
}
