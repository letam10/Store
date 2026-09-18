import './Storefront.css'
export default function Contact() {
  return <div className="container page-shell">
    <header className="page-head"><div><p className="eyebrow">Liên hệ</p><h1>Cần hỗ trợ? Store ở đây.</h1></div><p className="muted">Các thông tin dưới đây là nội dung giao diện mẫu.</p></header>
    <div className="contact-grid">
      <section className="surface info-card"><p className="eyebrow">Kênh hỗ trợ</p><h2>Trao đổi theo cách tiện nhất</h2><p className="muted">Chat AI local phù hợp câu hỏi nhanh. Những vấn đề đơn hàng cần nhân viên xác nhận.</p><div className="contact-list"><a href="mailto:support@example.com">✉ support@example.com</a><a href="tel:+84000000000">☎ 0000 000 000</a><span>◷ 08:00 – 21:00, Thứ 2 – Chủ nhật</span></div></section>
      <form className="surface info-card" onSubmit={(e)=>e.preventDefault()}><p className="eyebrow">Gửi lời nhắn</p><h2>Phản hồi nhanh</h2><div className="form-grid"><label className="field"><span>Họ tên</span><input required /></label><label className="field"><span>Email</span><input type="email" required /></label><label className="field field--wide"><span>Nội dung</span><textarea rows="6" required placeholder="Mô tả điều bạn cần hỗ trợ…" /></label></div><button className="button" type="submit">Gửi yêu cầu</button></form>
    </div>
  </div>
}
