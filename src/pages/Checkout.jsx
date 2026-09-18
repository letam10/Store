import { useState } from 'react'
import { cartTotal } from '../storefront/state'
import './Storefront.css'
const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'})
export default function Checkout({cart,account,onComplete}){
 const [done,setDone]=useState(false)
 const total=cartTotal(cart)
 function submit(e){e.preventDefault();setDone(true);onComplete()}
 if(done)return <div className="container page-shell"><section className="surface order-success"><span>✓</span><h1>Đơn demo đã được tạo</h1><p className="muted">Prototype chưa kết nối cổng thanh toán hoặc hệ thống kho thật.</p><div className="page-actions" style={{justifyContent:'center'}}><a className="button" href="/">Về trang chủ</a></div></section></div>
 if(!cart.length)return <div className="container page-shell"><section className="surface empty-panel"><h2>Không có hàng để thanh toán</h2><a className="button" href="/products">Chọn sản phẩm</a></section></div>
 return <div className="container page-shell"><header className="page-head"><div><p className="eyebrow">Mua hàng</p><h1>Thông tin giao nhận.</h1></div><p className="muted">Bước thanh toán hiện là demo giao diện.</p></header><div className="checkout-layout"><form className="surface checkout-card" onSubmit={submit}><div className="form-grid"><label className="field"><span>Tên người nhận</span><input required defaultValue={account?.username||''}/></label><label className="field"><span>Số điện thoại</span><input required inputMode="tel"/></label><label className="field field--wide"><span>Địa chỉ nhận hàng</span><input required/></label><label className="field"><span>Thành phố</span><input required defaultValue="TP.HCM"/></label><label className="field"><span>Phương thức</span><select><option>Thanh toán khi nhận hàng</option><option disabled>Thanh toán trực tuyến (chưa kết nối)</option></select></label><label className="field field--wide"><span>Ghi chú</span><textarea rows="4"/></label></div><button className="button" type="submit">Xác nhận đơn demo</button></form><aside className="surface summary-card"><p className="eyebrow">Đơn của bạn</p>{cart.map((item)=><div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><b>{money.format(item.price*item.quantity)}</b></div>)}<div className="summary-row summary-row--total"><span>Tổng</span><span>{money.format(total)}</span></div></aside></div></div>
}
