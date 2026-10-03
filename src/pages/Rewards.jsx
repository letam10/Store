/**
 * @codex-vn-doc
 * Tệp: src/pages/Rewards.jsx
 * Mục đích: Trang React hiển thị và điều phối luồng nghiệp vụ của storefront/admin.
 * Thành phần chính: Rewards.
 * Liên kết trực tiếp: react, ../api/customer, ../storefront/promotions, ../storefront/rewardWheel.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { landingRotation, rewardSectors, sectorPath, sectorResult } from '../storefront/rewardWheel'
import './Storefront.css'
import './Rewards.css'

const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' })

// Chức năng Rewards: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Rewards({ account, tier = 'bronze', wallet = [], onReward, onRequireLogin, selectedVoucherCodes = [], onToggleVoucher }) {
  const [rotation, setRotation] = useState({ goods: 0, shipping: 0 })
  const [result, setResult] = useState(null)
  const [spinning, setSpinning] = useState(null)
  const [balance, setBalance] = useState(null)
  const [duration, setDuration] = useState(5000)
  const [error, setError] = useState('')
  const pending = useRef(null)
  const timer = useRef(null)
  const closeRef = useRef(null)
  const spinGate = useRef(false)
  const walletRef = useRef(null)
  const [walletScroll, setWalletScroll] = useState({ up: false, down: false })
  const updateWalletScroll = useCallback(() => {
    const node = walletRef.current
    if (node) setWalletScroll({ up: node.scrollTop > 1, down: node.scrollTop + node.clientHeight < node.scrollHeight - 1 })
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(updateWalletScroll, 0)
    window.addEventListener('resize', updateWalletScroll)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', updateWalletScroll) }
  }, [wallet.length, updateWalletScroll])
  function scrollWallet(direction) {
    const node = walletRef.current
    if (node) node.scrollBy({ top: direction * Math.max(84, node.clientHeight - 84), behavior: 'smooth' })
  }
  const plan = getMembershipPlan(tier)
  const credits = balance && balance.account === account ? balance.remaining : account?.spinCredits || 0
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (result) closeRef.current?.focus() }, [result])

  // Chức năng finish: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function finish() {
    if (!pending.current) return
    clearTimeout(timer.current)
    setResult(pending.current)
    pending.current = null
    setSpinning(null)
  }

  // Chức năng spin: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  async function spin(wheel) {
    if (!account) { onRequireLogin?.(); return }
    if (spinGate.current) return
    // Edge case: điều kiện ngay sau chú thích là chốt bảo vệ; dữ liệu thiếu, sai, hết hạn, bị hủy hoặc không an toàn phải dừng tại đây.
    if (credits < 1) { setError('Bạn không có lượt để quay.'); return }
    spinGate.current = true
    setSpinning(wheel)
    setResult(null)
    setError('')
    try {
      const outcome = await customerApi('/api/customer/spin', { method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ wheel }) })
      const sectors = rewardSectors(wheel)
      setBalance({ account, remaining: outcome.spinCredits })
      const sector = sectors[outcome.index]
      pending.current = sectorResult(sector, outcome.voucher)
      const milliseconds = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 5000
      setDuration(milliseconds)
      setRotation((current) => ({ ...current, [wheel]: landingRotation(current[wheel], sector.id, sectors.length) }))
      timer.current = setTimeout(finish, milliseconds === 0 ? 0 : milliseconds + 100)
    } catch (failure) { setError(failure.message); setSpinning(null); spinGate.current = false }
  }

  // Chức năng closeResult: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function closeResult() {
    spinGate.current = false
    setResult(null)
    onReward?.()
  }

  return <div className="container page-shell rewards-page">
    <header className="page-head"><div><p className="eyebrow">Store Lucky</p><h1>Hai vòng quay. Chung một ví lượt.</h1></div><p className="muted">Mỗi 100.000 ₫ tiền hàng hóa đã thanh toán nhận một lượt quay.</p></header>
    <div className="shared-spin-balance" aria-live="polite"><span>✦</span><div><strong>{credits} lượt quay dùng chung</strong><p>Chọn voucher hàng hóa hoặc voucher ship. Mỗi lần quay ở bất kỳ vòng nào đều dùng 1 lượt.</p></div><a href="/products">Tích thêm lượt →</a></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="rewards-workspace">
      <div className="rewards-wheels">{['goods', 'shipping'].map((wheel) => { const sectors = rewardSectors(wheel); return <section key={wheel} className={'surface reward-game-card reward-game-card--' + wheel} aria-label={wheel === 'goods' ? 'Vòng quay voucher hàng hóa' : 'Vòng quay voucher ship'} aria-busy={spinning === wheel}>
        <header className="rewards-wheel-heading"><div><p className="eyebrow">{wheel === 'goods' ? 'Vòng 01 · Mua sắm' : 'Vòng 02 · Giao hàng'}</p><h2>{wheel === 'goods' ? 'Săn ưu đãi hàng hóa' : 'Săn voucher phí ship'}</h2></div><span aria-hidden="true">{wheel === 'goods' ? '🛍' : '🚚'}</span></header>
        <div className="lucky-wheel"><div className="lucky-wheel__pointer" aria-hidden="true" />
          <svg className="lucky-wheel__disc" viewBox="0 0 360 360" role="img" aria-label="Vòng quay có mười ô; kim chỉ ở chính giữa phía trên."
            style={{ transform: 'rotate(' + rotation[wheel] + 'deg)', transitionDuration: duration + 'ms' }}
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
        <button className="button lucky-spin" type="button" onClick={() => spin(wheel)} disabled={Boolean(spinning || result) || Boolean(account && credits < 1)}>{spinning === wheel ? 'Đang quay…' : account ? wheel === 'goods' ? 'Quay voucher hàng hóa' : 'Quay voucher ship' : 'Đăng nhập để quay'}</button>
        <p className="lucky-wheel__hint">{account ? `Ví chung còn ${credits} lượt${credits < 1 ? ' · Mua sắm để tích lượt mới.' : ''}` : 'Đăng nhập để dùng lượt quay đã tích từ đơn hàng.'}</p>
      </section> })}</div>
      <section className="surface rewards-wallet-panel">
        <div className="rewards-wallet-head"><div><span className="membership-badge">{plan.badge}</span><h2 id="reward-wallet-title">{account ? 'Voucher mới nhận của ' + account.username : 'Voucher mới nhận'}</h2><p>{wallet.length} voucher · Chọn tối đa một voucher hàng hóa và một voucher ship.</p></div>{wallet.length > 10 && <div className="rewards-wallet-scroll"><button type="button" aria-label="Cuộn voucher lên" disabled={!walletScroll.up} onClick={() => scrollWallet(-1)}>↑</button><button type="button" aria-label="Cuộn voucher xuống" disabled={!walletScroll.down} onClick={() => scrollWallet(1)}>↓</button></div>}</div>
        {wallet.length ? <div ref={walletRef} className={'rewards-voucher-table' + (wallet.length > 10 ? ' has-overflow' : '')} role="region" aria-labelledby="reward-wallet-title" tabIndex={wallet.length > 10 ? 0 : undefined} onScroll={updateWalletScroll}>{wallet.map((voucher) => <article key={voucher.code} className={selectedVoucherCodes.includes(voucher.code) ? 'is-selected' : ''}>
          <strong>{voucher.label}</strong>
          <small><code>{voucher.code}</code> · HSD {new Date(voucher.expiresAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: '2-digit' })}</small>
          <button type="button" aria-pressed={selectedVoucherCodes.includes(voucher.code)} onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? 'Bỏ chọn' : 'Sử dụng'}</button>
        </article>)}</div> : <p className="rewards-voucher-empty">Chưa có voucher. Quay một trong hai vòng để nhận ưu đãi.</p>}
        <div className="page-actions"><a className="button button--soft" href="/account">Thông tin cá nhân</a><a className="button button--soft" href="/products">Tiếp tục mua sắm</a></div>
      </section>
    </div>
    {result && <div className="reward-modal-backdrop"><div className="reward-modal surface" role="dialog" aria-modal="true" aria-labelledby="reward-modal-title" data-sector={result.sectorId}>
      <span className="reward-modal__icon" aria-hidden="true">{result.kind === 'voucher' ? '✦' : '☆'}</span>
      <h2 id="reward-modal-title">{result.title}</h2>
      {result.kind === 'voucher' ? <><code>{result.voucher.code}</code><small>Hạn dùng: {date.format(new Date(result.voucher.expiresAt))}</small></> : <p>{result.message}</p>}
      <button ref={closeRef} className="reward-modal__close" type="button" onClick={closeResult}>Đóng</button>
    </div></div>}
  </div>
}
