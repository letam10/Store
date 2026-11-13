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

  return <div>
    <div className="checkout-voucher__input">
      <input aria-label={english ? 'Voucher code' : 'Mã giảm giá'} value={code}
        onChange={event => { setCode(event.target.value.toUpperCase()); setError(''); setNotice('') }}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); apply() } }}
        placeholder={english ? 'Enter voucher code' : 'Nhập mã giảm giá thanh toán'} maxLength="80" disabled={busy} />
      <button type="button" disabled={busy || !code.trim()} onClick={apply}>
        {busy ? (english ? 'Checking…' : 'Đang kiểm tra…') : (english ? 'Apply' : 'Áp dụng mã')}
      </button>
    </div>
    {error && <p className="voucher-invalid" role="alert">{error}</p>}
    {notice && <p className="voucher-valid" role="status">{notice}</p>}
  </div>
}
