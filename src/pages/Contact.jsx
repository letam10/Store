import ContactForm from '../components/ui/ContactForm'
import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../api/customer'
import { userMessage } from '../api/userMessages'
import MarketBanner from '../components/ui/MarketBanner'
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'
import './Contact.css'

const brandCatalog = [
  { name: 'amazon', match: /amazon/i, color: '#263b32' },
  { name: 'SAMSUNG', match: /samsung/i, color: '#174ea2' },
  { name: 'b.o.at', match: /\bbo\s*at\b|\bboat\b/i, color: '#202b29' },
  { name: 'Lenovo', match: /lenovo/i, color: '#bb3634' },
]
const CONTACT_DRAFT_KEY = 'storeContactDraftV1'
const emptyForm = { name: '', email: '', topic: 'Hỗ trợ mua hàng', message: '' }

function readDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(CONTACT_DRAFT_KEY) || '')
    return draft && typeof draft === 'object' ? { ...emptyForm, ...draft } : emptyForm
  } catch {
    return emptyForm
  }
}

function writeDraft(form) {
  try { sessionStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify(form)) } catch { /* Session storage may be unavailable. */ }
}

function clearDraft() {
  try { sessionStorage.removeItem(CONTACT_DRAFT_KEY) } catch { /* Session storage may be unavailable. */ }
}

export default function Contact({ appearance = {}, products = [], account, onRequireLogin, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
  const [form, setForm] = useState(readDraft)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  const gate = useRef(false)
  useEffect(() => { if (!account) writeDraft(form) }, [account, form])
  const address = appearance.contactAddress?.trim(), phone = appearance.contactPhone?.trim(), email = appearance.contactEmail?.trim()
  const brands = brandCatalog.filter(brand => products.some(product => brand.match.test(product.name)))
  const mapQuery = address || 'Vũng Tàu, Việt Nam'
  const mapSrc = 'https://maps.google.com/maps?q=' + encodeURIComponent(mapQuery) + '&z=' + (address ? 16 : 13) + '&hl=vi&output=embed'
  const mapLink = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapQuery)
  async function send(event) {
    event.preventDefault(); if (gate.current) return
    gate.current = true; setBusy(true); setError(''); setSuccess('')
    if (!account) {
      writeDraft(form)
      onRequireLogin?.()
      gate.current = false; setBusy(false)
      return
    }
    try {
      const result = await customerApi('/api/storefront/contact', {
        method: 'POST',
        csrfToken: account.csrfToken,
        body: JSON.stringify(form),
      })
      setSuccess('Cửa hàng đã nhận yêu cầu #' + result.requestId + '. Vui lòng giữ email để nhận phản hồi.')
      clearDraft()
      setForm(current => ({ ...current, message: '' }))
    } catch (failure) {
      setError(userMessage(failure, 'Chưa gửi được yêu cầu. Vui lòng thử lại.'))
    }
    finally { gate.current = false; setBusy(false) }
  }
  return <div className="container page-shell contact-page">
    <header className="page-heading"><div><p className="eyebrow">{english ? 'Connect with Store' : 'Kết nối với Store'}</p><h1>{english ? 'Whatever you need, just reach out.' : 'Cần gì, cứ nhắn chúng mình.'}</h1></div><p className="muted">{english ? 'Shopping support, delivery schedules, and after-sale requests.' : 'Hỗ trợ mua hàng, lịch giao / nhận và yêu cầu sau mua.'}</p></header>
    <MarketBanner title={english ? 'Neighborhood store. Caring for every need.' : 'Siêu thị nhỏ. Chăm sóc từng nhu cầu.'} description={english ? 'Shop for what you need, track orders easily, and get instant support right here.' : 'Mua đủ những món cần, theo dõi đơn rõ ràng và tìm hỗ trợ ngay tại đây.'} />
    <section className="contact-shortcuts" aria-label={english ? 'Quick support' : 'Hỗ trợ nhanh'}><a href="/account"><span aria-hidden="true">▣</span><div><strong>{english ? 'Track orders' : 'Theo dõi đơn hàng'}</strong><small>{english ? 'Payment, receipt & schedule' : 'Thanh toán, biên nhận và lịch nhận'}</small></div><b aria-hidden="true">↗</b></a><a href="/account"><span aria-hidden="true">↻</span><div><strong>{english ? 'Cancel, reschedule & returns' : 'Hủy, đổi lịch & trả hàng'}</strong><small>{english ? 'Check fees and submit online' : 'Xem phí và gửi yêu cầu trực tuyến'}</small></div><b aria-hidden="true">↗</b></a><a href="/rewards"><span aria-hidden="true">✦</span><div><strong>{english ? 'Vouchers & membership' : 'Voucher & thành viên'}</strong><small>{english ? 'Goods and shipping discounts' : 'Ưu đãi hàng hóa và phí giao'}</small></div><b aria-hidden="true">↗</b></a></section>
    <div className="contact-content-grid">
      <section className="surface contact-info"><p className="eyebrow">{english ? 'Visit us · Closer together' : 'Ghé một chút · Gần nhau hơn'}</p><h2>{english ? 'Visit Store or leave a message.' : 'Ghé Store hoặc gửi lời nhắn.'}</h2><p>{english ? 'We receive requests here and reply via the email you provide.' : 'Cửa hàng tiếp nhận yêu cầu tại đây và phản hồi qua email bạn cung cấp.'}</p><dl><div><dt>{english ? 'Address' : 'Địa chỉ'}</dt><dd>{address || (english ? 'Contact store to confirm pickup point.' : 'Liên hệ cửa hàng để xác nhận điểm nhận hàng.')}</dd></div>{phone && <div><dt>{english ? 'Phone' : 'Điện thoại'}</dt><dd><a href={'tel:' + phone.replace(/[^\d+]/g, '')}>{phone}</a></dd></div>}{email && <div><dt>{english ? 'Email' : 'Email'}</dt><dd><a href={'mailto:' + email}>{email}</a></dd></div>}{appearance.contactHours && <div><dt>{english ? 'Hours' : 'Giờ phục vụ'}</dt><dd>{appearance.contactHours}</dd></div>}</dl>
        <div className="contact-map"><div className="contact-map-head"><strong>{address ? (english ? 'Store location map' : 'Bản đồ cửa hàng') : (english ? 'Vung Tau area map' : 'Bản đồ khu vực Vũng Tàu')}</strong><a href={mapLink} target="_blank" rel="noreferrer">{english ? 'Open map ↗' : 'Mở bản đồ ↗'}</a></div><iframe src={mapSrc} title={address ? (english ? 'Location of ' + address : 'Vị trí ' + address) : (english ? 'Map of Vung Tau area, Vietnam' : 'Bản đồ khu vực Vũng Tàu, Việt Nam')} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><small>{address ? (english ? 'Open map for easy navigation.' : 'Mở bản đồ để chọn lộ trình thuận tiện.') : (english ? 'Confirm pickup location before visiting.' : 'Xác nhận địa chỉ nhận hàng với cửa hàng trước khi ghé.')}</small></div>
      </section>
      <ContactForm form={form} onChange={(key, value) => setForm(current => ({ ...current, [key]: value }))} onSubmit={send} busy={busy} error={error} success={success} submitLabel={account ? undefined : (english ? 'Sign in to send ↗' : 'Đăng nhập để gửi ↗')} helperText={account ? undefined : (english ? 'Draft saved in this session. Sign in to submit.' : 'Bản nháp được lưu trong phiên này. Đăng nhập để gửi yêu cầu.')} />
    </div>
    <section className="contact-promos" aria-label={english ? 'Extra conveniences' : 'Thêm tiện ích khi mua sắm'}><MarketBanner compact variant="delivery" title={english ? 'Delivery on your schedule.' : 'Nhận theo lịch của bạn.'} description={english ? 'Order online, choose delivery time or store pickup. All schedule updates are confirmed.' : 'Đặt online, chọn giờ giao hoặc nhận tại cửa hàng. Mọi thay đổi đều có lịch hẹn rõ ràng.'} href="/account" action={english ? 'Track my orders ↗' : 'Theo dõi đơn của tôi ↗'} /><MarketBanner compact variant="rewards" title={english ? 'Extra joy with every cart.' : 'Thêm niềm vui mỗi giỏ hàng.'} description={english ? 'Earn spins from paid orders, choose goods discounts or shipping vouchers.' : 'Tích lượt từ đơn đã thanh toán, chọn vòng ưu đãi hàng hóa hoặc voucher ship.'} href="/rewards" action={english ? 'Explore two lucky wheels ↗' : 'Khám phá hai vòng quay ↗'} /></section>
    <section className="surface contact-brands"><div className="contact-section-heading"><div><p className="eyebrow">{english ? 'Brands & connections' : 'Thương hiệu & kết nối'}</p><h2>{english ? 'Familiar names.' : 'Những cái tên quen thuộc.'}</h2></div><p>{english ? 'Catalog brands and QR bank transfer technology supported by Store.' : 'Thương hiệu trong danh mục và công nghệ QR chuyển khoản Store hỗ trợ.'}</p></div><div className="contact-brand-grid">{brands.map(brand => <div className="contact-brand" key={brand.name}><svg viewBox="0 0 220 80" role="img" aria-label={'Thương hiệu ' + brand.name}><text x="110" y="48" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize={brand.name === 'SAMSUNG' ? '25' : '34'} fontWeight="900" fill={brand.color}>{brand.name}</text>{brand.name === 'amazon' && <path d="M65 59c25 11 65 12 91-1" stroke="#e69a35" strokeWidth="4" fill="none" strokeLinecap="round" />}</svg><small>{english ? 'In catalog' : 'Có trong danh mục'}</small></div>)}<div className="contact-brand"><svg viewBox="0 0 220 80" role="img" aria-label="Kết nối QR chuyển khoản"><g fill="#285c47"><path d="M22 18h18v18H22zM45 18h18v18H45zM22 41h18v18H22zM46 43h7v7h-7zM56 53h7v7h-7z" /><text x="132" y="49" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="28" fontWeight="900">VietQR</text></g></svg><small>{english ? 'Bank transfer QR' : 'QR chuyển khoản'}</small></div></div></section>
    <section className="contact-faq surface"><div><p className="eyebrow">{english ? 'Quick answers' : 'Giải đáp nhanh'}</p><h2>{english ? 'Frequently asked questions.' : 'Trước khi bạn hỏi.'}</h2></div><details><summary>{english ? 'Where can I find receipts?' : 'Tìm biên nhận ở đâu?'}</summary><p>{english ? 'Open order details in your account, click Print / Save PDF. Receipts clearly display payment status.' : 'Mở chi tiết đơn trong tài khoản, chọn In bill / Lưu PDF. Biên nhận ghi rõ trạng thái thu tiền.'}</p></details><details><summary>{english ? 'Want to cancel, return or reschedule?' : 'Muốn hủy, trả hàng hoặc đổi lịch?'}</summary><p>{english ? 'Submit a request directly from your order. The store confirms fees, refund amounts and new time slots.' : 'Gửi yêu cầu từ đơn hàng. Cửa hàng báo phí, khoản hoàn và lịch mới trước khi bạn xác nhận.'}</p></details><details><summary>{english ? 'Can I use goods and shipping vouchers together?' : 'Dùng voucher hàng hóa cùng voucher ship được không?'}</summary><p>{english ? 'Yes, you can choose one goods voucher and one shipping voucher during checkout.' : 'Bạn có thể chọn một voucher hàng hóa và một voucher ship khi thanh toán. Hai vòng quay dùng chung lượt đã tích từ tiền hàng thanh toán.'}</p></details></section>
  </div>
}
