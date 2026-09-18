import { cartTotal } from '../storefront/state'
import './Storefront.css'
const money=new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'})
export default function Cart({cart,onQuantity}){
 const total=cartTotal(cart)
 return <div className="container page-shell"><header className="page-head"><div><p className="eyebrow">Giỏ hàng</p><h1>Kiểm tra trước khi mua.</h1></div><a href="/products">← Tiếp tục mua sắm</a></header>
 {cart.length===0?<section className="surface empty-panel"><h2>Giỏ hàng đang trống</h2><p className="muted">Thêm vài món bạn thích rồi quay lại đây.</p><div className="page-actions" style={{justifyContent:'center'}}><a className="button" href="/products">Xem hàng hóa</a></div></section>:
 <div className="cart-layout"><div className="cart-list">{cart.map((item)=><article className="surface cart-item" key={item.id}><div className="cart-item__art">{item.symbol}</div><div><small>{item.category}</small><h3>{item.name}</h3><strong>{money.format(item.price)}</strong></div><div className="qty-control"><button type="button" onClick={()=>onQuantity(item.id,item.quantity-1)} aria-label="Giảm số lượng">−</button><b>{item.quantity}</b><button type="button" onClick={()=>onQuantity(item.id,item.quantity+1)} aria-label="Tăng số lượng">+</button><button className="remove-item" type="button" onClick={()=>onQuantity(item.id,0)}>Xóa</button></div></article>)}</div><aside className="surface summary-card"><p className="eyebrow">Tóm tắt đơn hàng</p><div className="summary-row"><span>Tạm tính</span><b>{money.format(total)}</b></div><div className="summary-row"><span>Phí vận chuyển</span><span>Tính ở bước tiếp theo</span></div><div className="summary-row summary-row--total"><span>Tổng</span><span>{money.format(total)}</span></div><a className="button" href="/checkout">Tiến hành mua hàng</a></aside></div>}
 </div>
}
