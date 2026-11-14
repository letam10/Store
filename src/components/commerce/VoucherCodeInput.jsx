import { useRef, useState } from 'react'
import { userMessage } from '../../api/userMessages'
import { translateVoucherLabel } from '../../context/i18n'

export default function VoucherCodeInput({ onApply, english = false }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const gate = useRef(false)

  async function apply() {
    if (gate.current || !code.trim()) return
    gate.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const voucher = await onApply(code)
      setNotice((english ? 'Applied: ' : 'Đã chọn: ') + voucher.code + ' · ' + translateVoucherLabel(voucher.label, english ? 'en' : 'vi'))
      setCode('')
    } catch (failure) {
      setError(userMessage(failure))
    } finally {
      gate.current = false
      setBusy(false)
    }
  }

  return <div className="checkout-voucher__entry">
    <div className="checkout-voucher__input">
      <span className="voucher-input__symbol" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
          <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="2 2" />
        </svg>
      </span>
      <input
        aria-label={english ? 'Voucher code' : 'Mã giảm giá'}
        value={code}
        onChange={event => { setCode(event.target.value.toUpperCase()); setError(''); setNotice('') }}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); apply() } }}
        placeholder={english ? 'Enter voucher code' : 'Nhập mã giảm giá thanh toán'}
        maxLength="80"
        disabled={busy}
        autoComplete="off"
        spellCheck="false"
      />
      <button type="button" disabled={busy || !code.trim()} onClick={apply}>
        {busy ? (english ? 'Checking…' : 'Đang kiểm tra…') : (english ? 'Apply' : 'Áp dụng mã')}
      </button>
    </div>
    {error && <p className="voucher-invalid" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      <span>{error}</span>
    </p>}
    {notice && <p className="voucher-valid" role="status">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>
      <span>{notice}</span>
    </p>}
  </div>
}
