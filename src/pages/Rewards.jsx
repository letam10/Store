import { useEffect, useRef, useState } from 'react'
import { getMembershipPlan } from '../storefront/promotions'
import { landingRotation, pickSector, rewardSectors, sectorPath, sectorResult } from '../storefront/rewardWheel'
import './Storefront.css'
import './Rewards.css'

export default function Rewards(props) {
  // Changing member tier remounts the wheel and cancels any pending old-tier spin.
  return <RewardWheel key={props.tier || 'standard'} {...props} />
}

function RewardWheel({ account, tier = 'standard', selectedVoucher = '', onSelectVoucher }) {
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [duration, setDuration] = useState(5000)
  const pending = useRef(null)
  const timer = useRef(null)
  const closeRef = useRef(null)
  const sectors = rewardSectors(tier)
  const plan = getMembershipPlan(tier)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (result) closeRef.current?.focus() }, [result])

  function finish() {
    if (!pending.current) return
    clearTimeout(timer.current)
    setResult(pending.current)
    pending.current = null
    setSpinning(false)
  }

  function spin() {
    if (pending.current) return
    const sector = sectors[pickSector()]
    pending.current = sectorResult(sector)
    setResult(null)
    setSpinning(true)
    const milliseconds = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 5000
    setDuration(milliseconds)
    setRotation((current) => landingRotation(current, sector.id, sectors.length))
    // Fallback also handles hidden tabs and disabled CSS transitions.
    timer.current = setTimeout(finish, milliseconds === 0 ? 0 : milliseconds + 100)
  }

  const odds = sectors.reduce((items, sector) => {
    const key = sector.code || 'none'
    const entry = items.find((item) => item.key === key)
    if (entry) entry.count += 1
    else items.push({ key, label: sector.code ? sector.label : 'Chưa trúng voucher', count: 1 })
    return items
  }, [])

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Store Lucky</p><h1>Vòng quay may mắn.</h1></div><p className="muted">Trải nghiệm demo · Không phát thưởng thật</p></header>
    <div className="rewards-layout">
      <section className="surface rewards-wheel-card" aria-label="Vòng quay voucher demo" aria-busy={spinning}>
        <div className="lucky-wheel">
          <div className="lucky-wheel__pointer" aria-hidden="true" />
          <svg className="lucky-wheel__disc" viewBox="0 0 360 360" role="img" aria-label="Sáu ô bằng nhau; kim chỉ ở chính giữa phía trên."
            style={{ transform: 'rotate(' + rotation + 'deg)', transitionDuration: duration + 'ms' }}
            onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === 'transform') finish() }}>
            {sectors.map((sector, index) => {
              const degrees = (index + 0.5) * 360 / sectors.length
              return <g key={sector.id}>
                <path d={sectorPath(index, sectors.length)} fill={sector.color} stroke="#fffdf7" strokeWidth="2" />
                <g transform={'rotate(' + degrees + ' 180 180)'}>
                  <text x="180" y="66" textAnchor="middle" className="lucky-wheel__prize">{sector.short}</text>
                  <text x="180" y="85" textAnchor="middle" className="lucky-wheel__caption">{sector.code ? 'VOUCHER' : 'MAY MẮN'}</text>
                </g>
              </g>
            })}
            <circle cx="180" cy="180" r="32" fill="#254535" stroke="#fffdf7" strokeWidth="5" />
          </svg>
          <span className="lucky-wheel__hub" aria-hidden="true">store.</span>
        </div>
        <button className="button lucky-spin" type="button" onClick={spin} disabled={spinning}>{spinning ? 'Đang quay…' : 'Quay thử vận may'}</button>
        <p className="lucky-wheel__hint" role="status">{spinning ? 'Đợi vòng quay dừng để xem kết quả.' : 'Kim chỉ phía trên xác định ô trúng thưởng.'}</p>
      </section>
      <section className="surface rewards-info">
        <span className="membership-badge">{plan.badge}</span><h2>{account ? 'Quyền lợi demo của ' + account.username : 'Chế độ khách'}</h2>
        <p>6 ô có cơ hội bằng nhau (1/6 mỗi ô). Voucher chỉ xuất hiện nếu phù hợp hạng thành viên của bạn.</p>
        <ul className="reward-odds" aria-label="Tỷ lệ demo">{odds.map((item) => <li key={item.key}><span>{item.label}</span><strong>{item.count}/6 · {(item.count / 6 * 100).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%</strong></li>)}</ul>
        <small>Tỷ lệ hiển thị được làm tròn. Các lượt độc lập, không đảm bảo trúng sau một số lượt cố định. Đây là tỷ lệ demo, chưa phải chiến dịch chính thức.</small>
        {selectedVoucher && <p className="reward-selected">Voucher đang giữ: <b>{selectedVoucher}</b></p>}
        <div className="page-actions"><a className="button button--soft" href="/membership">Xem VIP & Ưu tú</a><a className="button button--soft" href="/products">Tiếp tục mua sắm</a></div>
      </section>
    </div>
    {result && <div className="reward-modal-backdrop"><div className="reward-modal surface" role="dialog" aria-modal="true" aria-labelledby="reward-modal-title" data-sector={result.sectorId}>
          <span className="reward-modal__icon" aria-hidden="true">{result.kind === 'voucher' ? '✦' : '☆'}</span>
          <h2 id="reward-modal-title">{result.title}</h2>
          {result.kind === 'voucher' ? <><strong>{result.voucher.label}</strong><code>{result.voucher.code}</code><small>{result.voucher.description}</small><div className="reward-result__actions">
            <button className="button" type="button" onClick={() => onSelectVoucher?.(result.voucher.code)}>{selectedVoucher === result.voucher.code ? 'Đang giữ mã này' : 'Giữ mã này'}</button>
            <a className="button button--soft" href="/cart">Đi tới giỏ hàng</a>
          </div></> : <p>{result.message}</p>}
          <button ref={closeRef} className="reward-modal__close" type="button" onClick={() => setResult(null)}>Đóng</button>
        </div></div>}
  </div>
}
