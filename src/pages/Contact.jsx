import { useRef, useState } from 'react'
import MarketBanner from '../components/ui/MarketBanner'
import './Storefront.css'
import './Contact.css'

const brandCatalog = [
  { name: 'amazon', match: /amazon/i, color: '#263b32' },
  { name: 'SAMSUNG', match: /samsung/i, color: '#174ea2' },
  { name: 'b.o.at', match: /\bbo\s*at\b|\bboat\b/i, color: '#202b29' },
  { name: 'Lenovo', match: /lenovo/i, color: '#bb3634' },
]
export default function Contact({ appearance = {}, products = [] }) {
  const [form, setForm] = useState({ name: '', email: '', topic: 'Hỗ trợ mua hàng', message: '' })
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  const gate = useRef(false)
  const address = appearance.contactAddress?.trim(), phone = appearance.contactPhone?.trim(), email = appearance.contactEmail?.trim()
  const brands = brandCatalog.filter(brand => products.some(product => brand.match.test(product.name)))
  const mapQuery = address || 'Vũng Tàu, Việt Nam'
  const mapSrc = 'https://maps.google.com/maps?q=' + encodeURIComponent(mapQuery) + '&z=' + (address ? 16 : 13) + '&hl=vi&output=embed'
  const mapLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery)
  async function send(event) {
    event.preventDefault(); if (gate.current) return
    gate.current = true; setBusy(true); setError(''); setSuccess('')
    try {
      const response = await fetch('/api/storefront/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Chưa gửi được yêu cầu. Vui lòng thử lại.')
      setSuccess('Cửa hàng đã nhận yêu cầu #' + result.requestId + '. Vui lòng giữ email để nhận phản hồi.')
      setForm(current => ({ ...current, message: '' }))
    } catch (failure) { setError(failure.message) }
    finally { gate.current = false; setBusy(false) }
  }
  return <div className="container page-shell contact-page">
    <header className="page-heading"><div><p className="eyebrow">Kết nối với Store</p><h1>Cần gì, cứ nhắn chúng mình.</h1></div><p className="muted">Hỗ trợ mua hàng, lịch giao / nhận và yêu cầu sau mua.</p></header>
    <MarketBanner title="Siêu thị nhỏ. Chăm sóc từng nhu cầu." description="Mua đủ những món cần, theo dõi đơn rõ ràng và tìm hỗ trợ ngay tại đây." />
    <section className="contact-shortcuts" aria-label="Hỗ trợ nhanh"><a href="/account"><span aria-hidden="true">▣</span><div><strong>Theo dõi đơn hàng</strong><small>Thanh toán, biên nhận và lịch nhận</small></div><b aria-hidden="true">↗</b></a><a href="/account"><span aria-hidden="true">↻</span><div><strong>Hủy, đổi lịch & trả hàng</strong><small>Xem phí và gửi yêu cầu trực tuyến</small></div><b aria-hidden="true">↗</b></a><a href="/rewards"><span aria-hidden="true">✦</span><div><strong>Voucher & thành viên</strong><small>Ưu đãi hàng hóa và phí giao</small></div><b aria-hidden="true">↗</b></a></section>
    <div className="contact-content-grid">
      <section className="surface contact-info"><p className="eyebrow">Ghé một chút · Gần nhau hơn</p><h2>Ghé Store hoặc gửi lời nhắn.</h2><p>Cửa hàng tiếp nhận yêu cầu tại đây và phản hồi qua email bạn cung cấp.</p><dl><div><dt>Địa chỉ</dt><dd>{address || 'Liên hệ cửa hàng để xác nhận điểm nhận hàng.'}</dd></div>{phone && <div><dt>Điện thoại</dt><dd><a href={'tel:' + phone.replace(/[^\d+]/g, '')}>{phone}</a></dd></div>}{email && <div><dt>Email</dt><dd><a href={'mailto:' + email}>{email}</a></dd></div>}{appearance.contactHours && <div><dt>Giờ phục vụ</dt><dd>{appearance.contactHours}</dd></div>}</dl>
        <div className="contact-map"><div className="contact-map-head"><strong>{address ? 'Bản đồ cửa hàng' : 'Bản đồ khu vực Vũng Tàu'}</strong><a href={mapLink} target="_blank" rel="noreferrer">Mở bản đồ ↗</a></div><iframe src={mapSrc} title={address ? 'Vị trí ' + address : 'Bản đồ khu vực Vũng Tàu, Việt Nam'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><small>{address ? 'Mở bản đồ để chọn lộ trình thuận tiện.' : 'Xác nhận địa chỉ nhận hàng với cửa hàng trước khi ghé.'}</small></div>
      </section>
      <section className="surface contact-form-card"><p className="eyebrow">Lời nhắn của bạn</p><h2>Gửi yêu cầu hỗ trợ</h2><form onSubmit={send}><div className="contact-form-row"><label>Họ và tên<input required minLength="2" maxLength="100" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} autoComplete="name" placeholder="Tên của bạn" /></label><label>Email nhận phản hồi<input required type="email" maxLength="254" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="ban@email.com" /></label></div><label>Bạn cần hỗ trợ về<select value={form.topic} onChange={event => setForm({ ...form, topic: event.target.value })}>{['Hỗ trợ mua hàng', 'Thanh toán & biên nhận', 'Lịch giao / nhận', 'Voucher & thành viên', 'Khác'].map(topic => <option key={topic}>{topic}</option>)}</select></label><label>Nội dung<textarea required minLength="10" maxLength="2000" rows="6" value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="Chia sẻ điều bạn cần hỗ trợ; thêm mã đơn hàng nếu có." /><small>{form.message.length}/2.000 ký tự</small></label><div className="contact-form-actions"><p>Đã đặt hàng? <a href="/account">Mở đơn trong tài khoản</a> để xem phí và lịch hẹn.</p><button className="button" type="submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi lời nhắn ↗'}</button></div>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="contact-success" role="status">{success}</p>}</form></section>
    </div>
    <section className="contact-promos" aria-label="Thêm tiện ích khi mua sắm"><MarketBanner compact variant="delivery" title="Nhận theo lịch của bạn." description="Đặt online, chọn giờ giao hoặc nhận tại cửa hàng. Mọi thay đổi đều có lịch hẹn rõ ràng." href="/account" action="Theo dõi đơn của tôi ↗" /><MarketBanner compact variant="rewards" title="Thêm niềm vui mỗi giỏ hàng." description="Tích lượt từ đơn đã thanh toán, chọn vòng ưu đãi hàng hóa hoặc voucher ship." href="/rewards" action="Khám phá hai vòng quay ↗" /></section>
    <section className="surface contact-brands"><div className="contact-section-heading"><div><p className="eyebrow">Thương hiệu & kết nối</p><h2>Những cái tên quen thuộc.</h2></div><p>Thương hiệu trong danh mục và công nghệ QR chuyển khoản Store hỗ trợ.</p></div><div className="contact-brand-grid">{brands.map(brand => <div className="contact-brand" key={brand.name}><svg viewBox="0 0 220 80" role="img" aria-label={'Thương hiệu ' + brand.name}><text x="110" y="48" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize={brand.name === 'SAMSUNG' ? '25' : '34'} fontWeight="900" fill={brand.color}>{brand.name}</text>{brand.name === 'amazon' && <path d="M65 59c25 11 65 12 91-1" stroke="#e69a35" strokeWidth="4" fill="none" strokeLinecap="round" />}</svg><small>Có trong danh mục</small></div>)}<div className="contact-brand"><svg viewBox="0 0 220 80" role="img" aria-label="Kết nối QR chuyển khoản"><g fill="#285c47"><path d="M22 18h18v18H22zM45 18h18v18H45zM22 41h18v18H22zM46 43h7v7h-7zM56 53h7v7h-7z" /><text x="132" y="49" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="28" fontWeight="900">VietQR</text></g></svg><small>QR chuyển khoản</small></div></div></section>
    <section className="contact-faq surface"><div><p className="eyebrow">Giải đáp nhanh</p><h2>Trước khi bạn hỏi.</h2></div><details><summary>Tìm biên nhận ở đâu?</summary><p>Mở chi tiết đơn trong tài khoản, chọn In bill / Lưu PDF. Biên nhận ghi rõ trạng thái thu tiền.</p></details><details><summary>Muốn hủy, trả hàng hoặc đổi lịch?</summary><p>Gửi yêu cầu từ đơn hàng. Cửa hàng báo phí, khoản hoàn và lịch mới trước khi bạn xác nhận.</p></details><details><summary>Dùng voucher hàng hóa cùng voucher ship được không?</summary><p>Bạn có thể chọn một voucher hàng hóa và một voucher ship khi thanh toán. Hai vòng quay dùng chung lượt đã tích từ tiền hàng thanh toán.</p></details></section>
  </div>
}
