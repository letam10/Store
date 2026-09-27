/**
 * @codex-vn-doc
 * Tệp: src/components/ui/LeadCapture.jsx
 * Mục đích: Biểu mẫu thu thập thông tin liên hệ/hỗ trợ của khách hàng.
 * Thành phần chính: LeadCapture.
 * Liên kết trực tiếp: react.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { useState } from 'react'
import './LeadCapture.css'

// Chức năng LeadCapture: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export default function LeadCapture(){
  const [submitted,setSubmitted]=useState(false)
  // Chức năng submit: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
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
