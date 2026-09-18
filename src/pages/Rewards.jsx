import { useState } from 'react'
import { getMembershipPlan, spinDemoReward } from '../storefront/promotions'
import './Storefront.css'

export default function Rewards({account,tier='standard'}){
 const [turn,setTurn]=useState(0)
 const [result,setResult]=useState(null)
 const plan=getMembershipPlan(tier)
 function spin(){
   const next=turn+1
   setTurn(next)
   setResult(spinDemoReward(next,tier))
 }
 return <div className="container page-shell">
   <header className="page-head"><div><p className="eyebrow">Store Lucky</p><h1>Vòng quay may mắn.</h1></div><p className="muted">Trò chơi và voucher ở trang này chỉ là preview cục bộ.</p></header>
   <div className="rewards-layout">
     <section className="surface rewards-wheel-card"><div className="customer-wheel"><div className="customer-wheel__pointer">▼</div><div className="customer-wheel__disc" style={{transform:'rotate('+(turn*137)+'deg)'}}><span>50K</span><span>10%</span><span>★</span><span>VIP</span><span>?</span><span>15%</span></div></div><button className="button" type="button" onClick={spin}>Quay thử</button><small>Không tạo giao dịch hoặc phần thưởng thật.</small></section>
     <section className="surface rewards-info"><span className="membership-badge">{plan.badge}</span><h2>{account?'Quyền lợi demo của '+account.username:'Chế độ khách'}</h2><p>Hạng thành viên ảnh hưởng tập voucher xuất hiện trong vòng quay demo.</p>{result&&<div className="reward-result" role="status"><b>{result.title}</b>{result.kind==='voucher'?<><strong>{result.voucher.label}</strong><code>{result.voucher.code}</code><small>{result.voucher.description}</small></>:<p>{result.message}</p>}</div>}<div className="page-actions"><a className="button button--soft" href="/membership">Xem VIP & Ưu tú</a><a className="button button--soft" href="/products">Tiếp tục mua sắm</a></div></section>
   </div>
 </div>
}
