import { useState } from 'react'
import './LeadCapture.css'

export default function LeadCapture(){
  const [submitted,setSubmitted]=useState(false)
  function submit(event){
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }
  return <section className="lead-capture">
    <div><p className="eyebrow">Khách hàng tiềm năng</p><h2>Nhận tin khi Store có chương trình thật.</h2><p>Form hiện chỉ mô phỏng trải nghiệm đăng ký. Dữ liệu chưa được gửi tới backend hoặc dịch vụ marketing.</p></div>
    <form onSubmit={submit}>
      <label><span>Email</span><input type="email" name="email" autoComplete="email" required placeholder="ban@example.com" /></label>
      <label><span>Bạn quan tâm</span><select name="interest" defaultValue="deals"><option value="deals">Ưu đãi & voucher</option><option value="membership">Thành viên</option><option value="new">Sản phẩm mới</option></select></label>
      <label className="lead-consent"><input type="checkbox" required /><span>Tôi đồng ý thử đăng ký nhận thông tin trong prototype này.</span></label>
      <button className="button" type="submit">Đăng ký quan tâm</button>
      {submitted&&<p className="lead-success" role="status">Đã ghi nhận trên giao diện demo. Chưa có dữ liệu nào được gửi khỏi trình duyệt.</p>}
    </form>
  </section>
}
