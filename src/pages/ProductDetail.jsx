import { products, productDataMeta } from '../data/products'
import { productIdFromPath } from '../storefront/state'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function ProductDetail({ onAddToCart }) {
  const productId = productIdFromPath(window.location.pathname)
  const product = products.find((item) => String(item.id) === String(productId))

  if (!product) return <div className="container page-shell"><section className="surface empty-panel"><h1>Không tìm thấy sản phẩm</h1><p className="muted">Sản phẩm có thể đã đổi đường dẫn hoặc chưa tồn tại trong dữ liệu Store.</p><div className="page-actions" style={{justifyContent:'center'}}><a className="button" href="/products">Về danh sách hàng hóa</a></div></section></div>

  return <div className="container page-shell">
    <nav className="breadcrumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span>/</span><a href="/products">Hàng hóa</a><span>/</span><span>{product.name}</span></nav>
    <div className="product-detail-layout">
      <section className={`product-detail-art product-detail-art--${product.tone}`} aria-label={'Hình minh họa ' + product.name}><span>{product.symbol}</span><small>{product.label}</small></section>
      <section className="product-detail-info">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <strong className="product-detail-price">{money.format(product.price)}</strong>
        <p className="product-detail-description">{product.description}</p>
        <ul className="product-feature-list">{product.features.map((feature)=><li key={feature}>✓ {feature}</li>)}</ul>
        <div className="product-detail-actions"><button className="button" type="button" onClick={()=>onAddToCart(product)}>Thêm vào giỏ</button><a className="button button--soft" href="/cart">Xem giỏ hàng</a></div>
        <div className="product-detail-note"><b>Dữ liệu: {productDataMeta.mode === 'demo' ? 'demo' : productDataMeta.mode}</b><span>Store chưa cung cấp tồn kho theo chi nhánh cho dữ liệu này.</span></div>
      </section>
    </div>
    <section className="surface product-detail-service"><div><b>Giá có nguồn</b><span>Giá hiển thị lấy từ nguồn dữ liệu sản phẩm chung của Store.</span></div><div><b>Không bịa tồn kho</b><span>Tình trạng còn hàng chưa được xác nhận trong prototype.</span></div><div><b>Hỗ trợ local</b><span>Chat hỗ trợ dùng API Store, không gọi Ollama trực tiếp từ trình duyệt.</span></div></section>
  </div>
}
