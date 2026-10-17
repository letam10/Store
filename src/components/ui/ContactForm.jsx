const topics = ['Hỗ trợ mua hàng', 'Thanh toán & biên nhận', 'Lịch giao / nhận', 'Voucher & thành viên', 'Khác']

export default function ContactForm({ form, onChange, onSubmit, busy, error, success, submitLabel, helperText }) {
  return <section className="surface contact-form-card">
    <p className="eyebrow">Lời nhắn của bạn</p>
    <h2>Gửi yêu cầu hỗ trợ</h2>
    <form onSubmit={onSubmit}>
      <div className="contact-form-row">
        <label htmlFor="contact-name">
          <span>Họ và tên</span>
          <input id="contact-name" required minLength="2" maxLength="100" value={form.name}
            onChange={event => onChange('name', event.target.value)} autoComplete="name" placeholder="Tên của bạn" />
        </label>
        <label htmlFor="contact-email">
          <span>Email nhận phản hồi</span>
          <input id="contact-email" required type="email" maxLength="254" value={form.email}
            onChange={event => onChange('email', event.target.value)} autoComplete="email" placeholder="ban@email.com" />
        </label>
      </div>
      <label htmlFor="contact-topic"><span>Bạn cần hỗ trợ về</span></label>
      <select id="contact-topic" value={form.topic} onChange={event => onChange('topic', event.target.value)}>
        {topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
      </select>
      <label htmlFor="contact-message">
        <span>Nội dung</span>
        <textarea id="contact-message" required minLength="10" maxLength="2000" rows="6" value={form.message}
          onChange={event => onChange('message', event.target.value)}
          placeholder="Chia sẻ điều bạn cần hỗ trợ; thêm mã đơn hàng nếu có." />
        <small>{form.message.length}/2.000 ký tự</small>
      </label>
      <div className="contact-form-actions">
        <p>{helperText || <>Đã đặt hàng? <a href="/account">Mở đơn trong tài khoản</a> để xem phí và lịch hẹn.</>}</p>
        <button className="button" type="submit" disabled={busy}>{busy ? 'Đang gửi…' : (submitLabel || 'Gửi lời nhắn ↗')}</button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="contact-success" role="status">{success}</p>}
    </form>
  </section>
}
