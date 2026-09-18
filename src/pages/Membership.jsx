import { getMembershipPlan, membershipPlans } from '../storefront/promotions'
import './Storefront.css'

const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'})

export default function Membership({account,tier='standard',onActivate}){
 const current=getMembershipPlan(tier)
 return <div className="container page-shell">
   <header className="page-head"><div><p className="eyebrow">Store Membership</p><h1>VIP & khách hàng ưu tú.</h1></div><p className="muted">Toàn bộ giá và quyền lợi dưới đây là dữ liệu demo, chưa phải chính sách thương mại đã duyệt.</p></header>
   <section className="membership-hero surface"><div><span className="membership-badge">{current.badge}</span><h2>{account?'Hạng hiện tại của '+account.username:'Đăng nhập để lưu hạng thành viên'}</h2><p>{current.description}</p></div><a className="button button--soft" href={account?'/account':'/account'}>{account?'Quản lý tài khoản':'Đăng nhập'}</a></section>
   <div className="membership-grid">{membershipPlans.map((plan)=><article key={plan.id} className={'membership-card '+(plan.id===tier?'is-current':'')}><div><span>{plan.badge}</span><h2>{plan.name}</h2><p>{plan.description}</p></div><div className="membership-price">{plan.price===0?'Miễn phí demo':money.format(plan.price)+' / tháng'}</div><ul>{plan.benefits.map((benefit)=><li key={benefit}>✓ {benefit}</li>)}</ul>{!account?<a className="button button--soft" href="/account">Đăng nhập để chọn</a>:plan.id===tier?<button className="button button--soft" type="button" disabled>Đang dùng</button>:<button className="button" type="button" onClick={()=>onActivate(plan.id)}>Kích hoạt demo</button>}</article>)}</div>
   <p className="membership-disclaimer">Prototype không thu tiền, không gia hạn tự động và không tạo quyền lợi vận hành thật. Khi triển khai production, giá, điều kiện, hoàn tiền, gia hạn và quyền lợi phải được chủ dự án phê duyệt và backend thực thi.</p>
 </div>
}
