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
import { userMessage } from '../api/userMessages'
import RewardWheelLabels from '../components/ui/RewardWheelLabels'
import { getMembershipPlan } from '../storefront/promotions'
import { landingRotation, rewardSectors, sectorPath, sectorResult } from '../storefront/rewardWheel'
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'
import './Rewards.css'

const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' })

// Chức năng Rewards: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function Rewards({ account, tier = 'bronze', wallet = [], onReward, onRequireLogin, selectedVoucherCodes = [], onToggleVoucher, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
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
    } catch (failure) {
      setError(userMessage(failure, 'Chưa quay được vòng quay. Vui lòng thử lại.'))
      setSpinning(null)
      spinGate.current = false
    }
  }

  // Chức năng closeResult: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
  function closeResult() {
    spinGate.current = false
    setResult(null)
    onReward?.()
  }

  return <div className="container page-shell rewards-page">
    <header className="page-head"><div><p className="eyebrow">Store Lucky</p><h1>{english ? 'Two lucky wheels. One shared balance.' : 'Hai vòng quay. Chung một ví lượt.'}</h1></div><p className="muted">{english ? 'Earn one spin for every 100,000 ₫ of paid goods.' : 'Mỗi 100.000 ₫ tiền hàng hóa đã thanh toán nhận một lượt quay.'}</p></header>
    <div className="shared-spin-balance" aria-live="polite"><span>✦</span><div><strong>{english ? `${credits} shared lucky spins` : `${credits} lượt quay dùng chung`}</strong><p>{english ? 'Pick goods voucher or shipping voucher. Every spin on either wheel uses 1 spin.' : 'Chọn voucher hàng hóa hoặc voucher ship. Mỗi lần quay ở bất kỳ vòng nào đều dùng 1 lượt.'}</p></div><a href="/products">{english ? 'Earn more spins →' : 'Tích thêm lượt →'}</a></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="rewards-workspace">
      <div className="rewards-wheels">{['goods', 'shipping'].map((wheel) => { const sectors = rewardSectors(wheel); return <section key={wheel} className={'surface reward-game-card reward-game-card--' + wheel} aria-label={wheel === 'goods' ? (english ? 'Goods voucher wheel' : 'Vòng quay voucher hàng hóa') : (english ? 'Shipping voucher wheel' : 'Vòng quay voucher ship')} aria-busy={spinning === wheel}>
        <header className="rewards-wheel-heading"><div><p className="eyebrow">{wheel === 'goods' ? (english ? 'Wheel 01 · Shopping' : 'Vòng 01 · Mua sắm') : (english ? 'Wheel 02 · Delivery' : 'Vòng 02 · Giao hàng')}</p><h2>{wheel === 'goods' ? (english ? 'Hunt for goods discounts' : 'Săn ưu đãi hàng hóa') : (english ? 'Hunt for shipping vouchers' : 'Săn voucher phí ship')}</h2></div><span aria-hidden="true">{wheel === 'goods' ? '🛍' : '🚚'}</span></header>
        <div className="lucky-wheel"><div className="lucky-wheel__pointer" aria-hidden="true" />
          <svg className="lucky-wheel__disc" viewBox="0 0 360 360" role="img" aria-label="Vòng quay có mười ô; kim chỉ ở chính giữa phía trên."
            style={{ transform: 'rotate(' + rotation[wheel] + 'deg)', transitionDuration: duration + 'ms' }}
            onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === 'transform') finish() }}>
            {sectors.map((sector, index) => <g key={sector.id}>
              <path d={sectorPath(index, sectors.length)} fill={sector.color} stroke="#fffdf7" strokeWidth="2" />
              <RewardWheelLabels sector={sector} index={index} count={sectors.length} />
            </g>)}
            <circle cx="180" cy="180" r="32" fill="#254535" stroke="#fffdf7" strokeWidth="5" />
          </svg><span className="lucky-wheel__hub" aria-hidden="true">store.</span>
        </div>
        <button className="button lucky-spin" type="button" onClick={() => spin(wheel)} disabled={Boolean(spinning || result) || Boolean(account && credits < 1)}>{spinning === wheel ? (english ? 'Spinning…' : 'Đang quay…') : account ? wheel === 'goods' ? (english ? 'Spin for goods voucher' : 'Quay voucher hàng hóa') : (english ? 'Spin for shipping voucher' : 'Quay voucher ship') : (english ? 'Sign in to spin' : 'Đăng nhập để quay')}</button>
        <p className="lucky-wheel__hint">{account ? (english ? `Shared balance: ${credits} spins${credits < 1 ? ' · Shop more to earn spins.' : ''}` : `Ví chung còn ${credits} lượt${credits < 1 ? ' · Mua sắm để tích lượt mới.' : ''}`) : (english ? 'Sign in to use spins earned from orders.' : 'Đăng nhập để dùng lượt quay đã tích từ đơn hàng.')}</p>
      </section> })}</div>
      <section className="surface rewards-wallet-panel">
        <div className="rewards-wallet-head"><div><span className="membership-badge">{plan.badge}</span><h2 id="reward-wallet-title">{account ? (english ? `${account.username}'s newly received vouchers` : 'Voucher mới nhận của ' + account.username) : (english ? 'Newly received vouchers' : 'Voucher mới nhận')}</h2><p>{wallet.length} {english ? 'vouchers · Choose up to 1 goods voucher and 1 shipping voucher.' : 'voucher · Chọn tối đa một voucher hàng hóa và một voucher ship.'}</p></div>{wallet.length > 10 && <div className="rewards-wallet-scroll"><button type="button" aria-label={english ? 'Scroll vouchers up' : 'Cuộn voucher lên'} disabled={!walletScroll.up} onClick={() => scrollWallet(-1)}>↑</button><button type="button" aria-label={english ? 'Scroll vouchers down' : 'Cuộn voucher xuống'} disabled={!walletScroll.down} onClick={() => scrollWallet(1)}>↓</button></div>}</div>
        {wallet.length ? <div ref={walletRef} className={'rewards-voucher-table' + (wallet.length > 10 ? ' has-overflow' : '')} role="region" aria-labelledby="reward-wallet-title" tabIndex={wallet.length > 10 ? 0 : undefined} onScroll={updateWalletScroll}>{wallet.map((voucher) => <article key={voucher.code} className={selectedVoucherCodes.includes(voucher.code) ? 'is-selected' : ''}>
          <strong>{voucher.label}</strong>
          <small><code>{voucher.code}</code> · {english ? 'Expires: ' : 'HSD '}{new Date(voucher.expiresAt).toLocaleDateString(english ? 'en-US' : 'vi-VN', { day: 'numeric', month: 'numeric', year: '2-digit' })}</small>
          <button type="button" aria-pressed={selectedVoucherCodes.includes(voucher.code)} onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? (english ? 'Deselect' : 'Bỏ chọn') : (english ? 'Use' : 'Sử dụng')}</button>
        </article>)}</div> : <p className="rewards-voucher-empty">{english ? 'No vouchers yet. Spin either wheel to receive offers.' : 'Chưa có voucher. Quay một trong hai vòng để nhận ưu đãi.'}</p>}
        <div className="page-actions"><a className="button button--soft" href="/account">{english ? 'Account Profile' : 'Thông tin cá nhân'}</a><a className="button button--soft" href="/products">{english ? 'Continue shopping' : 'Tiếp tục mua sắm'}</a></div>
      </section>
    </div>
    {result && <div className="reward-modal-backdrop"><div className="reward-modal surface" role="dialog" aria-modal="true" aria-labelledby="reward-modal-title" data-sector={result.sectorId}>
      <span className="reward-modal__icon" aria-hidden="true">{result.kind === 'voucher' ? '✦' : '☆'}</span>
      <h2 id="reward-modal-title">{result.title}</h2>
      {result.kind === 'voucher' ? <><code>{result.voucher.code}</code><small>{english ? 'Expires: ' : 'Hạn dùng: '}{date.format(new Date(result.voucher.expiresAt))}</small></> : <p>{result.message}</p>}
      <button ref={closeRef} className="reward-modal__close" type="button" onClick={closeResult}>{english ? 'Close' : 'Đóng'}</button>
    </div></div>}
  </div>
}
