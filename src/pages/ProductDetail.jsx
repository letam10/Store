/**
 * @codex-vn-doc
 * Tệp: src/pages/ProductDetail.jsx
 * Mục đích: Trang chi tiết sản phẩm, thư viện ảnh, giỏ hàng, yêu thích và đánh giá.
 * Liên kết: App.jsx truyền sản phẩm, tài khoản, voucher và callback; customerApi tải/gửi đánh giá.
 * Cẩn trọng: giữ nguyên callback và class selector đang được App/test dùng; dữ liệu nhập có thể thiếu ảnh, đặc điểm hoặc ngày đánh giá.
 */
import { useEffect, useState } from 'react'
import { customerApi } from '../api/customer'
import { getMembershipPlan } from '../storefront/promotions'
import { productIdFromPath } from '../storefront/state'
import { similarProducts } from '../storefront/catalog'
import ProductCard from '../components/ui/ProductCard'
import './Storefront.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' })

function safeDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Chưa xác định ngày' : date.format(parsed)
}

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
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : [])
    } catch { setReviews([]) }
  }

  useEffect(() => {
    const controller = new AbortController()
    customerApi('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', { signal: controller.signal })
      .then((payload) => setReviews(Array.isArray(payload.reviews) ? payload.reviews : []))
      .catch(() => { if (!controller.signal.aborted) setReviews([]) })
    return () => controller.abort()
  }, [productId])

  async function submitReview(event) {
    event.preventDefault()
    if (!account) { onRequireLogin?.(); return }
    setReviewBusy(true)
    setReviewError('')
    try {
      await customerApi('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', {
        method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ rating, comment }),
      })
      setComment('')
      await refreshReviews()
    } catch (error) { setReviewError(error.message || 'Không thể gửi đánh giá') }
    finally { setReviewBusy(false) }
  }

  if (!product) return <div className="container page-shell"><section className="surface empty-panel"><p className="eyebrow">Sản phẩm</p><h1>Không tìm thấy sản phẩm</h1><p className="muted">Sản phẩm có thể đã được gỡ hoặc đường dẫn không đúng.</p><a className="button" href="/products">Về danh sách hàng hóa</a></section></div>

  const fallback = '/products/' + ({ 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }[product.id] || 'headphones') + '.svg'
  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image || fallback]
  const activeImageIndex = Math.min(activeImage, images.length - 1)
  const features = Array.isArray(product.features) && product.features.length ? product.features : ['Thông tin sản phẩm đang được cập nhật']
  const favorite = favoriteIds.includes(String(product.id))
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : null
  const stockLabel = product.stockCount === 0 ? 'Hết hàng' : product.stockCount === null || product.stockCount === undefined ? 'Đang cập nhật tồn kho' : `Còn ${product.stockCount} sản phẩm`
  const similar = product.stockCount === 0 ? similarProducts(products, product).slice(0, 10) : []

  return <div className="container page-shell product-detail-page">
    <button className="product-back" type="button" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/products')}>← Quay lại hàng hóa</button>
    <nav className="breadcrumbs" aria-label="Đường dẫn"><a href="/">Trang chủ</a><span>/</span><a href="/products">Hàng hóa</a><span>/</span><span>{product.name}</span></nav>

    <section className="product-detail-layout product-detail-layout--redesign" aria-label="Thông tin sản phẩm">
      <section className={`product-detail-art product-detail-art--${product.tone}${product.source ? ' product-detail-art--imported' : ''}`} aria-label={'Hình minh họa ' + product.name}>
        <div className="product-detail-art__frame"><img src={images[activeImageIndex] || images[0]} alt={'Ảnh ' + product.name} width="640" height="640" /></div>
        <div className="product-detail-art__footer"><small>{product.label || 'Ảnh sản phẩm'}</small><span>{images.length} ảnh</span></div>
        {images.length > 1 && <div className="product-detail-thumbnails" role="list" aria-label="Chọn ảnh sản phẩm">{images.map((image, index) => <button key={image + index} type="button" onClick={() => setActiveImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={activeImageIndex === index}><img src={image} alt="" loading="lazy" /></button>)}</div>}
      </section>

      <section className="product-detail-info">
        <div className="product-member-line"><p className="eyebrow">{product.category}</p><span className="membership-badge">{plan.badge}</span></div>
        <h1>{product.name}</h1>
        <div className="product-detail-price-row"><strong className="product-detail-price">{money.format(product.price)}</strong>{product.discountPercent > 0 && <><del>{money.format(product.originalPrice)}</del><span className="detail-discount">Giảm {product.discountPercent}%</span></>}</div>
        <div className="product-detail-meta"><span>{stockLabel}</span><span>•</span><span>{product.viewCount || 0} lượt xem</span>{averageRating && <><span>•</span><span>★ {averageRating}/5</span></>}</div>
        <div className="product-detail-actions"><button className="button" type="button" disabled={product.stockCount === 0} onClick={() => onAddToCart(product)}>{product.stockCount === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button><button className="button button--soft" type="button" onClick={() => onToggleFavorite?.(product.id)}>{favorite ? '♥ Đã yêu thích' : '♡ Thêm yêu thích'}</button></div>
        <div className="product-detail-highlights"><div><span>Danh mục</span><b>{product.category}</b></div><div><span>Tình trạng</span><b>{product.stockCount === 0 ? 'Hết hàng' : 'Sẵn sàng đặt'}</b></div><div><span>Đánh giá</span><b>{averageRating ? `${averageRating}/5` : 'Chưa có'}</b></div></div>
        <section className="product-detail-summary"><h2>Đặc điểm sản phẩm</h2><ul className="product-feature-list">{features.slice(0, 6).map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></section>
        <section className="product-detail-summary"><h2>Mô tả sản phẩm</h2><p className="product-detail-description">{product.description || 'Sản phẩm chưa có mô tả chi tiết.'}</p></section>
        <section className="product-detail-summary product-detail-summary--rating"><h2>Đánh giá sản phẩm</h2><p>{averageRating ? `★ ${averageRating}/5 · ${reviews.length} đánh giá` : 'Chưa có đánh giá'}</p><a href="#reviews">Xem bình luận ↓</a></section>
      </section>
    </section>

    <section className="surface product-detail-full" id="reviews">
      <header className="product-detail-full__heading"><div><p className="eyebrow">Thông tin đầy đủ</p><h2>Chi tiết sản phẩm</h2></div><span>{features.length} thông số · {images.length} ảnh</span></header>
      <div className="detail-block detail-block--reviews"><div className="detail-block__heading"><div><p className="eyebrow">Cộng đồng Store</p><h2>Đánh giá và bình luận</h2></div><strong>{averageRating ? `${averageRating}/5` : '—'}</strong></div>
        {account ? <form className="detail-review-form" onSubmit={submitReview}><label>Điểm đánh giá<select value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}</select></label><label>Bình luận <small>(không bắt buộc, tối đa 2.000 ký tự)</small><textarea rows="4" maxLength="2000" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ cảm nhận của bạn…" /></label><button className="button" type="submit" disabled={reviewBusy}>{reviewBusy ? 'Đang gửi…' : 'Gửi đánh giá'}</button>{reviewError && <p role="alert" className="form-error">{reviewError}</p>}</form> : <button className="button button--soft" type="button" onClick={onRequireLogin}>Đăng nhập để đánh giá</button>}
        {reviews.length ? <div className="detail-review-list">{reviews.map((review) => <article key={review.id}><div><strong>{review.username || 'Khách hàng'} · {'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}</strong><small>{safeDate(review.createdAt)}</small></div><p>{review.comment || 'Không có bình luận.'}</p>{review.adminReply && <div className="detail-admin-reply"><b>Store trả lời</b><p>{review.adminReply}</p></div>}</article>)}</div> : <p className="muted">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
      </div>
      <div className="detail-block detail-block--description"><h2>Mô tả rõ ràng</h2><p>{product.description || 'Sản phẩm chưa có mô tả chi tiết.'}</p></div>
      <div className="detail-block detail-block--specs"><h2>Thông số chi tiết</h2><ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>{product.source && product.sourceUrl && <p className="muted">Nguồn: <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">Dữ liệu sản phẩm mẫu</a>. Giá VND chỉ dùng minh họa.</p>}</div>
      <div className="detail-block detail-block--gallery"><div className="detail-block__heading"><h2>Ảnh sản phẩm</h2><span>{images.length} ảnh</span></div><div className="detail-gallery">{images.map((image, index) => <button key={image + index} type="button" onClick={() => setActiveImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={activeImage === index}><img src={image} alt={'Ảnh ' + (index + 1) + ' của ' + product.name} loading="lazy" /></button>)}</div></div>
      {wallet.length > 0 && <div className="detail-block detail-block--vouchers"><div className="detail-block__heading"><h2>Voucher của bạn</h2><a href="/account">Quản lý voucher →</a></div><div className="detail-vouchers">{wallet.map((voucher) => <button className={selectedVoucherCodes.includes(voucher.code) ? 'is-selected' : ''} key={voucher.code} type="button" onClick={() => onToggleVoucher?.(voucher.code)}>{selectedVoucherCodes.includes(voucher.code) ? '✓ ' : ''}{voucher.label} · {voucher.code}</button>)}</div></div>}
    </section>

    {similar.length > 0 && <section className="home-section similar-section"><div className="section-heading"><div><p className="eyebrow">GỢI Ý THAY THẾ</p><h2>Sản phẩm cùng danh mục còn hàng</h2></div></div><div className="product-grid">{similar.map((item) => <ProductCard key={item.id} product={item} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(item.id))} onToggleFavorite={onToggleFavorite} />)}</div></section>}
  </div>
}
