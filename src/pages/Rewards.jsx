import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { landingRotation, rewardSectors, sectorPath, sectorResult } from '../storefront/rewardWheel'
import './Storefront.css'
import './Rewards.css'

const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' })

export default function Rewards({ account, tier = 'bronze', wallet = [], onReward, onRequireLogin, selectedVoucherCodes = [], onToggleVoucher }) {
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [duration, setDuration] = useState(5000)
  const [error, setError] = useState('')
  const pending = useRef(null)
  const timer = useRef(null)
  const closeRef = useRef(null)
  const sectors = rewardSectors()
  const plan = getMembershipPlan(tier)
  const credits = account?.spinCredits || 0
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (result) closeRef.current?.focus() }, [result])

  function finish() {
    if (!pending.current) return
    clearTimeout(timer.current)
    setResult(pending.current)
    pending.current = null
    setSpinning(false)
  }

  async function spin() {
    if (!account) { onRequireLogin?.(); return }
    if (spinning || credits < 1) return
    setSpinning(true)
    setResult(null)
    setError('')
    try {
      const outcome = await customerApi('/api/customer/spin', { method: 'POST', csrfToken: account.csrfToken })
      const sector = sectors[outcome.index]
      pending.current = sectorResult(sector, outcome.voucher)
      const milliseconds = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 5000
      setDuration(milliseconds)
      setRotation((current) => landingRotation(current, sector.id, sectors.length))
      timer.current = setTimeout(finish, milliseconds === 0 ? 0 : milliseconds + 100)
      onReward?.()
    } catch (failure) { setError(failure.message); setSpinning(false) }
  }

  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Store Lucky</p><h1>Vòng quay may mắn</h1></div><p className="muted">Mỗi 100.000 ₫ tiền hàng hóa đã thanh toán nhận một lượt quay.</p></header>
    <div className="rewards-layout">
      <section className="surface rewards-wheel-card" aria-label="Vòng quay voucher" aria-busy={spinning}>
        <div className="lucky-wheel"><div className="lucky-wheel__pointer" aria-hidden="true" />
          <svg className="lucky-wheel__disc" viewBox="0 0 360 360" role="img" aria-label="Vòng quay có mười ô; kim chỉ ở chính giữa phía trên."
            style={{ transform: 'rotate(' + rotation + 'deg)', transitionDuration: duration + 'ms' }}
            onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === 'transform') finish() }}>
            {sectors.map((sector, index) => <g key={sector.id}>
              <path d={sectorPath(index, sectors.length)} fill={sector.color} stroke="#fffdf7" strokeWidth="2" />
              <g transform={'rotate(' + (index + .5) * 360 / sectors.length + ' 180 180)'}>
                <text x="180" y="59" textAnchor="middle" className="lucky-wheel__prize">{sector.short}</text>
                <text x="180" y="73" textAnchor="middle" className="lucky-wheel__caption">{sector.kind === 'none' ? 'MAY MẮN' : 'VOUCHER'}</text>
              </g>
            </g>)}
            <circle cx="180" cy="180" r="32" fill="#254535" stroke="#fffdf7" strokeWidth="5" />
          </svg><span className="lucky-wheel__hub" aria-hidden="true">store.</span>
        </div>
        <button className="button lucky-spin" type="button" onClick={spin} disabled={spinning || (account && credits < 1)}>{spinning ? 'Đang quay…' : account ? 'Quay may mắn' : 'Đăng nhập để quay'}</button>
        <p className="lucky-wheel__hint" role="status">{account ? `Còn ${credits} lượt quay${credits < 1 ? ' · Thanh toán đủ 100.000 ₫ để nhận lượt mới.' : ''}` : 'Đăng nhập để dùng lượt quay đã tích từ đơn hàng.'}</p>
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="surface rewards-info">
        <span className="membership-badge">{plan.badge}</span><h2>{account ? 'Voucher mới nhận của ' + account.username : 'Voucher mới nhận'}</h2>
        {wallet.length ? <div className="reward-wallet-list">{wallet.slice(0, 10).map((voucher) => <article key={voucher.code}>
          <div><strong>{voucher.label}</strong><code>{voucher.code}</code></div>
          <small>Hạn dùng: {date.format(new Date(voucher.expiresAt))}</small>
          <button type="button" onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? 'Bỏ chọn' : 'Chọn cho thanh toán'}</button>
        </article>)}</div> : <div className="reward-wallet-empty" aria-label="Chưa có voucher" />}
        <div className="page-actions"><a className="button button--soft" href="/account">Thông tin cá nhân</a><a className="button button--soft" href="/products">Tiếp tục mua sắm</a></div>
      </section>
    </div>
    {result && <div className="reward-modal-backdrop"><div className="reward-modal surface" role="dialog" aria-modal="true" aria-labelledby="reward-modal-title" data-sector={result.sectorId}>
      <span className="reward-modal__icon" aria-hidden="true">{result.kind === 'voucher' ? '✦' : '☆'}</span>
      <h2 id="reward-modal-title">{result.title}</h2>
      {result.kind === 'voucher' ? <><code>{result.voucher.code}</code><small>Hạn dùng: {date.format(new Date(result.voucher.expiresAt))}</small>
        <div className="reward-result__actions"><button className="button" type="button" onClick={() => onToggleVoucher?.(result.voucher.code)}>{selectedVoucherCodes.includes(result.voucher.code) ? 'Bỏ chọn' : 'Chọn cho thanh toán'}</button><a className="button button--soft" href="/cart">Đi tới giỏ hàng</a></div></> : <p>{result.message}</p>}
      <button ref={closeRef} className="reward-modal__close" type="button" onClick={() => setResult(null)}>Đóng</button>
    </div></div>}
  </div>
}
