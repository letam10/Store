import { useMemo, useState } from 'react'
import { normalizeSearch } from '../storefront/state'
import './AdminModules.css'

const datasets={
  customers:{title:'Quản lý khách hàng',description:'Theo dõi tài khoản, phân nhóm và trạng thái chăm sóc.',columns:['Khách hàng','Nhóm','Đơn gần nhất','Trạng thái'],rows:[['Nguyễn An','Thân thiết','ST-1048','Đang hoạt động'],['Trần Minh','Mới','ST-1046','Cần chăm sóc'],['Lê Hương','VIP','ST-1032','Ưu tiên']]},
  products:{title:'Quản lý hàng hóa',description:'Danh mục sản phẩm, giá niêm yết và trạng thái bán.',columns:['Sản phẩm','Danh mục','Giá','Trạng thái'],rows:[['Tai nghe Everyday','Công nghệ','890.000 ₫','Đang bán'],['Túi Everyday Tote','Phụ kiện','249.000 ₫','Đang bán'],['Đồng hồ Minimal','Phụ kiện','1.290.000 ₫','Đang bán']]},
  logistics:{title:'Quản lý lưu thông',description:'Theo dõi luân chuyển hàng giữa kho, cửa hàng và giao vận.',columns:['Mã','Tuyến','Tiến độ','Cập nhật'],rows:[['MV-221','Kho A → Store Central','72%','10 phút trước'],['MV-220','Store East → Kho A','Đã nhận','35 phút trước'],['MV-219','Kho A → Đơn online','Đang giao','1 giờ trước']]},
  inventory:{title:'Xuất nhập kho',description:'Giao diện kiểm soát phiếu nhập, phiếu xuất và tồn dự kiến.',columns:['Phiếu','Loại','Kho','Số lượng'],rows:[['IN-082','Nhập','Kho A','+128'],['OUT-117','Xuất','Kho A','-32'],['OUT-116','Xuất','Kho B','-18']]},
  appearance:{title:'Trang trí & chỉnh sửa',description:'Quản lý banner, nội dung trang chủ và bộ nhận diện hiển thị.',columns:['Khu vực','Phiên bản','Người sửa','Trạng thái'],rows:[['Hero trang chủ','v3','Admin','Nháp'],['Banner mùa mới','v2','Marketing','Đang dùng'],['Footer','v1','Admin','Đang dùng']]},
  statistics:{title:'Thống kê',description:'Tổng hợp chỉ số thương mại; số liệu production cần lấy từ backend.',columns:['Chỉ số','Hôm nay','7 ngày','Xu hướng'],rows:[['Đơn hàng','42','268','+8%'],['Khách quay lại','31%','29%','+2%'],['Tỷ lệ hoàn tất giỏ','64%','61%','+3%']]},
  'order-types':{title:'Quản lý loại đơn hàng',description:'Cấu hình nhóm đơn và cách xử lý vận hành.',columns:['Loại đơn','Ưu tiên','SLA','Trạng thái'],rows:[['Giao tiêu chuẩn','Bình thường','48h','Bật'],['Nhận tại cửa hàng','Cao','4h','Bật'],['Đơn quà tặng','Bình thường','72h','Nháp']]},
  support:{title:'Quản lý chăm sóc khách hàng',description:'Hàng đợi yêu cầu hỗ trợ và tình trạng xử lý.',columns:['Ticket','Khách','Chủ đề','Trạng thái'],rows:[['CS-301','Nguyễn An','Đơn hàng','Đang xử lý'],['CS-300','Lê Hương','Sản phẩm','Mới'],['CS-298','Trần Minh','Địa chỉ','Đã xong']]},
  'rewards-wheel':{title:'Chế độ quay thưởng',description:'Thiết kế chương trình mini-game và giới hạn phần thưởng.',columns:['Chiến dịch','Phần thưởng','Ngân sách','Trạng thái'],rows:[['Cuối tuần vui vẻ','Voucher 10%','2.000.000 ₫','Nháp'],['Khách thân thiết','Quà ngẫu nhiên','5.000.000 ₫','Tạm dừng']]},
  staff:{title:'Quản lý nhân viên',description:'Danh sách nhân viên, vai trò và ca làm việc.',columns:['Nhân viên','Vai trò','Ca hôm nay','Trạng thái'],rows:[['Mai Anh','CSKH','08:00–17:00','Đang làm'],['Quốc Bảo','Kho','13:00–22:00','Sắp vào ca'],['Thùy Linh','Cửa hàng','09:00–18:00','Đang làm']]},
  overtime:{title:'Tăng ca & khen thưởng',description:'Theo dõi đề xuất OT và ghi nhận thành tích nhân viên.',columns:['Nhân viên','Hạng mục','Thời lượng/Điểm','Trạng thái'],rows:[['Quốc Bảo','Tăng ca','2 giờ','Chờ duyệt'],['Mai Anh','Khen thưởng','120 điểm','Đã duyệt'],['Thùy Linh','Tăng ca','1.5 giờ','Đã duyệt']]},
}

function Dashboard(){
 const stats=[['Doanh thu demo','128,4 triệu','+12.8%'],['Đơn hôm nay','42','+8.1%'],['Khách quay lại','31%','+2.0%'],['Ticket mở','7','-3']]
 return <><div className="admin-kpi-grid">{stats.map(([label,value,delta])=><article key={label}><span>{label}</span><strong>{value}</strong><small>{delta} so với kỳ trước</small></article>)}</div><div className="admin-dashboard-grid"><section className="admin-module-card"><p className="admin-eyebrow">Vận hành hôm nay</p><h2>Ưu tiên cần chú ý</h2><div className="admin-task-list"><div><b>07</b><span>Ticket CSKH đang mở</span></div><div><b>03</b><span>Phiếu kho chờ duyệt</span></div><div><b>02</b><span>Nhân viên đề nghị tăng ca</span></div></div></section><section className="admin-module-card"><p className="admin-eyebrow">Lối tắt</p><h2>Thao tác thường dùng</h2><div className="admin-quick-actions"><button type="button" disabled title="Chưa nối backend">+ Tạo hàng hóa</button><button type="button" disabled title="Chưa nối backend">+ Phiếu nhập kho</button><button type="button" disabled title="Chưa nối backend">+ Ticket CSKH</button><button type="button" disabled title="Chưa nối backend">+ Chiến dịch thưởng</button></div></section></div></>
}

export default function AdminModule({module}){
 const [filter,setFilter]=useState('')
 const data=datasets[module]||datasets.statistics
 const rows=useMemo(()=>{
   const needle=normalizeSearch(filter).trim()
   if(!needle)return data.rows
   return data.rows.filter((row)=>normalizeSearch(row.join(' ')).includes(needle))
 },[data,filter])
 if(module==='dashboard')return <Dashboard/>
 return <section className="admin-module-card">
   <div className="admin-module-head"><div><p className="admin-eyebrow">STORE OPERATIONS</p><h2>{data.title}</h2><p>{data.description}</p></div><button type="button" disabled title="Chưa nối backend">+ Tạo mới</button></div>
   <div className="admin-module-toolbar"><label><span className="sr-only">Lọc {data.title}</span><input type="search" value={filter} onChange={(event)=>setFilter(event.target.value)} placeholder="Lọc nhanh trong bảng…" /></label><span>{rows.length}/{data.rows.length} mục</span></div>
   <div className="admin-table-wrap"><table><caption className="sr-only">{data.title}</caption><thead><tr>{data.columns.map((column)=><th key={column}>{column}</th>)}<th>Thao tác</th></tr></thead><tbody>{rows.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td className={cellIndex===row.length-1?'admin-status-cell':''} key={cell}>{cell}</td>)}<td><button className="table-action" type="button" disabled title="Chưa nối backend">Mở</button></td></tr>)}</tbody></table>{rows.length===0&&<p className="admin-empty">Không có mục nào khớp bộ lọc.</p>}</div>
   <p className="admin-demo-note">Dữ liệu trong module này hiện là dữ liệu giao diện mẫu; chưa ghi vào database nghiệp vụ.</p>
 </section>
}
