import { useEffect, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { productIdFromPath } from '../storefront/state'
import { similarProducts } from '../storefront/catalog'
import ProductCard from '../components/ui/ProductCard'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' })

export default function ProductDetail({ products, pathname, onAddToCart, account, membershipTier = 'bronze', wallet = [], favoriteIds = [], onToggleFavorite, onRequireLogin, onToggleVoucher, selectedVoucherCodes = [] }) {
  const productId = productIdFromPath(pathname)
  const product = products.find((item) => String(item.id) === String(productId))
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const plan = getMembershipPlan(membershipTier)

  async function refreshReviews() {
    try {
      const payload = await customerApi('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews')
      setReviews(payload.reviews || [])
    } catch { setReviews([]) }
  }
  useEffect(() => {
    const controller = new AbortController()
    customerApi('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', { signal: controller.signal })
      .then((payload) => setReviews(payload.reviews || []))
      .catch(() => { if (!controller.signal.aborted) setReviews([]) })
    return () => controller.abort()
  }, [productId])

  async function submitReview(event) {
    event.preventDefault()
    if (!account) { onRequireLogin?.(); return }
    setReviewBusy(true); setReviewError('')
    try {
      await customerApi('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', {
        method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ rating, comment }),
      })
      setComment(''); await refreshReviews()
    } catch (error) { setReviewError(error.message) }
    finally { setReviewBusy(false) }
  }

  if (!product) return <div className="container page-shell"><section className="surface empty-panel"><h1>Không tìm thấy sản phẩm</h1><a className="button" href="/products">Về danh sách hàng hóa</a></section></div>
  const fallback = '/products/' + ({ 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }[product.id] || 'headphones') + '.svg'
  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image || fallback]
  const favorite = favoriteIds.includes(String(product.id))
  const avgRating = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : null

  return <div className="container page-shell">
    <button className="product-back" type="button" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/products')}>← Quay lại trang trước</button>
    <nav className="breadcrumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span>/</span><a href="/products">Hàng hóa</a><span>/</span><span>{product.name}</span></nav>
    <div className="product-detail-layout">
      <section className={`product-detail-art product-detail-art--${product.tone}${product.source ? ' product-detail-art--imported' : ''}`} aria-label={'Hình minh họa ' + product.name}>
        <img src={images[activeImage] || images[0]} alt={'Ảnh ' + product.name} width="440" height="380" /><small>{product.label}</small>
      </section>
      <section className="product-detail-info">
        <div className="product-member-line"><p className="eyebrow">{product.category}</p><span>{plan.badge}</span></div>
        <h1>{product.name}</h1>
        <strong className="product-detail-price">{money.format(product.price)} {product.discountPercent > 0 && <><del>{money.format(product.originalPrice)}</del><span className="detail-discount">Giảm {product.discountPercent}%</span></>}</strong>
        <p className="muted">{product.stockCount === 0 ? 'Hết hàng' : product.stockCount === null ? 'Chưa cập nhật tồn kho' : 'Còn ' + product.stockCount + ' sản phẩm'} · {product.viewCount} lượt xem</p>
        <div className="product-detail-actions"><button className="button" type="button" disabled={product.stockCount === 0} onClick={() => onAddToCart(product)}>{product.stockCount === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button><button className="button button--soft" type="button" onClick={() => onToggleFavorite?.(product.id)}>{favorite ? '♥ Đã yêu thích' : '♡ Yêu thích'}</button></div>
        <h2 className="detail-subhead">Đặc điểm sản phẩm</h2><ul className="product-feature-list">{product.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
        <h2 className="detail-subhead">Mô tả sản phẩm</h2><p className="product-detail-description">{product.description}</p>
        <h2 className="detail-subhead">Đánh giá sản phẩm</h2><p>{avgRating ? '★ ' + avgRating + '/5 · ' + reviews.length + ' đánh giá' : 'Chưa có đánh giá'}</p>
      </section>
    </div>
    <section className="surface product-detail-full">
      <div className="detail-block"><h2>Đánh giá và bình luận</h2>
        {account ? <form className="detail-review-form" onSubmit={submitReview}><label>Điểm đánh giá<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}</select></label><label>Bình luận<textarea rows="3" minLength="3" maxLength="2000" required value={comment} onChange={(event) => setComment(event.target.value)} /></label><button className="button" type="submit" disabled={reviewBusy}>{reviewBusy ? 'Đang gửi…' : 'Gửi đánh giá'}</button>{reviewError && <p role="alert">{reviewError}</p>}</form> : <button className="button button--soft" type="button" onClick={onRequireLogin}>Đăng nhập để đánh giá</button>}
        {reviews.length ? <div className="detail-review-list">{reviews.map((review) => <article key={review.id}><strong>{review.username} · {'★'.repeat(review.rating)}</strong><small>{date.format(new Date(review.createdAt))}</small><p>{review.comment}</p>{review.adminReply && <div className="detail-admin-reply"><b>Store trả lời</b><p>{review.adminReply}</p></div>}</article>)}</div> : <p className="muted">Chưa có bình luận nào.</p>}
      </div>
      <div className="detail-block"><h2>Mô tả rõ ràng</h2><p>{product.description}</p></div>
      <div className="detail-block"><h2>Thông số chi tiết</h2><ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>{product.source && <p className="muted">Nguồn: <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">Dữ liệu sản phẩm mẫu</a>. Giá VND chỉ dùng minh họa.</p>}</div>
      <div className="detail-block"><h2>Ảnh sản phẩm</h2><div className="detail-gallery">{images.map((image, index) => <button key={image} type="button" onClick={() => setActiveImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={activeImage === index}><img src={image} alt={'Ảnh ' + (index + 1) + ' của ' + product.name} loading="lazy" /></button>)}</div></div>
      {wallet.length > 0 && <div className="detail-block"><h2>Voucher của bạn</h2><div className="detail-vouchers">{wallet.map((voucher) => <button key={voucher.code} type="button" onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? '✓ ' : '+ '}{voucher.label} · {voucher.code}</button>)}</div></div>}
    </section>
    {product.stockCount === 0 && <section className="home-section similar-section"><div className="section-heading"><div><p className="eyebrow">GỢI Ý THAY THẾ</p><h2>Sản phẩm tương tự còn hàng</h2></div></div><div className="product-grid">{similarProducts(products, product).map((item) => <ProductCard key={item.id} product={item} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(item.id))} onToggleFavorite={onToggleFavorite} />)}</div></section>}
  </div>
}
