/**
 * @codex-vn-doc
 * Tệp: src/pages/ProductDetail.jsx
 * Mục đích: Trang chi tiết sản phẩm, thư viện ảnh, giỏ hàng, yêu thích và đánh giá.
 * Liên kết: App.jsx truyền sản phẩm, tài khoản, voucher và callback; customerApi tải/gửi đánh giá.
 * Cẩn trọng: giữ nguyên callback và class selector đang được App/test dùng; dữ liệu nhập có thể thiếu ảnh, đặc điểm hoặc ngày đánh giá.
 */
import { useEffect, useRef, useState } from 'react'
import { customerApi } from '../api/customer'
import { userMessage } from '../api/userMessages'
import { getMembershipPlan } from '../storefront/promotions'
import { productIdFromPath } from '../storefront/state'
import { similarProducts } from '../storefront/catalog'
import ProductCard from '../components/ui/ProductCard'
import DropdownMenu from '../components/ui/DropdownMenu'
import { useLanguage } from '../storefront/i18n'
import './Storefront.css'
import './ProductReviews.css'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' })

function safeDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'Chưa xác định ngày' : date.format(parsed)
}

const REVIEW_TIMEOUT_MS = 10000

async function reviewRequest(path, options = {}, parentSignal) {
  const controller = new AbortController()
  let timedOut = false
  const onParentAbort = () => controller.abort()
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort()
    else parentSignal.addEventListener('abort', onParentAbort, { once: true })
  }
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REVIEW_TIMEOUT_MS)
  try {
    return await customerApi(path, { ...options, signal: controller.signal })
  } catch (error) {
    if (timedOut) {
      const timeout = new Error('Review request timed out')
      timeout.name = 'TimeoutError'
      timeout.code = 'TIMEOUT'
      throw timeout
    }
    throw error
  } finally {
    clearTimeout(timer)
    parentSignal?.removeEventListener('abort', onParentAbort)
  }
}

export default function ProductDetail({ products, pathname, onAddToCart, account, membershipTier = 'bronze', favoriteIds = [], onToggleFavorite, onRequireLogin, language: propLanguage }) {
  const { language: contextLanguage, english: contextEnglish, translateCategory } = useLanguage()
  const language = propLanguage || contextLanguage || 'vi'
  const english = language === 'en' || contextEnglish
  const productId = productIdFromPath(pathname)
  const product = products.find((item) => String(item.id) === String(productId))
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState('')
  const reviewGate = useRef(false)
  const [activeImage, setActiveImage] = useState(0)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [reviewContent, setReviewContent] = useState('all')
  const [reviewOrder, setReviewOrder] = useState('newest')
  const plan = getMembershipPlan(membershipTier)

  async function refreshReviews(reportError = false) {
    try {
      const payload = await reviewRequest('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews')
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : [])
      return true
    } catch (error) {
      setReviews([])
      if (reportError) setReviewError(userMessage(error, 'Chưa thể tải lại danh sách đánh giá.'))
      return false
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    reviewRequest('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', {}, controller.signal)
      .then((payload) => setReviews(Array.isArray(payload.reviews) ? payload.reviews : []))
      .catch(() => { if (!controller.signal.aborted) setReviews([]) })
    return () => controller.abort()
  }, [productId])

  async function submitReview(event) {
    event.preventDefault()
    if (!account) { onRequireLogin?.(); return }
    if (reviewGate.current) return
    reviewGate.current = true
    setReviewBusy(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      await reviewRequest('/api/storefront/products/' + encodeURIComponent(productId) + '/reviews', {
        method: 'POST', csrfToken: account.csrfToken, body: JSON.stringify({ rating, comment }),
      })
      setComment('')
      await refreshReviews(true)
      setReviewSuccess('Đã ghi nhận đánh giá của bạn.')
    } catch (error) { setReviewError(userMessage(error, 'Không thể gửi đánh giá. Vui lòng thử lại sau.')) }
    finally { reviewGate.current = false; setReviewBusy(false) }
  }

  if (!product) return <div className="container page-shell"><section className="surface empty-panel"><p className="eyebrow">{english ? 'Product' : 'Sản phẩm'}</p><h1>{english ? 'Product not found' : 'Không tìm thấy sản phẩm'}</h1><p className="muted">{english ? 'The product may have been removed or the link is incorrect.' : 'Sản phẩm có thể đã được gỡ hoặc đường dẫn không đúng.'}</p><a className="button" href="/products">{english ? 'Back to products' : 'Về danh sách hàng hóa'}</a></section></div>

  const fallback = '/products/' + ({ 1: 'headphones', 2: 'bag', 3: 'watch', 4: 'cup' }[product.id] || 'headphones') + '.svg'
  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image || fallback]
  const activeImageIndex = Math.min(activeImage, images.length - 1)
  const features = Array.isArray(product.features) && product.features.length ? product.features : [english ? 'Product details are being updated' : 'Thông tin sản phẩm đang được cập nhật']
  const favorite = favoriteIds.includes(String(product.id))
  const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : null
  const stockLabel = product.stockCount === 0 ? (english ? 'Out of stock' : 'Hết hàng') : product.stockCount === null || product.stockCount === undefined ? (english ? 'Stock updating' : 'Đang cập nhật tồn kho') : (english ? `${product.stockCount} in stock` : `Còn ${product.stockCount} sản phẩm`)
  // Chỉ lấy thông số có trong dữ liệu nguồn; không tự suy đoán cấu hình sản phẩm.
  const detailsText = [product.name, product.description, ...features].filter(Boolean).join(' ')
  const brand = product.brand || features.find((feature) => /^(?:Thương hiệu(?: dữ liệu mẫu| nguồn)?|Brand):/i.test(feature))?.split(':').slice(1).join(':').trim()
  const displayCategory = translateCategory ? translateCategory(product.category) : product.category
  const specifications = [
    [english ? 'Product name' : 'Tên sản phẩm', product.name],
    [english ? 'Category' : 'Danh mục', displayCategory],
    [english ? 'SKU' : 'Mã sản phẩm', product.sku || product.sourceId || String(product.id)],
    ...(brand ? [[english ? 'Brand' : 'Thương hiệu', brand]] : []),
    ...Object.entries(product.specifications || {}).filter(([label, value]) => label !== 'Thương hiệu' && value),
    [english ? 'Current price' : 'Giá hiện tại', money.format(product.price)],
    [english ? 'Stock' : 'Tồn kho', stockLabel],
  ]
  const sourceFields = [
    ['RAM', /\b\d+(?:[.,]\d+)?\s*GB\s*(?:DDR\d\s*)?RAM\b/i],
    ['Lưu trữ', /\b\d+(?:[.,]\d+)?\s*(?:GB|TB)\s*(?:SSD|HDD)\b/i],
    ['Bộ xử lý', /\b(?:Intel (?:Celeron|Core [im][3579])(?:[ -]+[A-Z]*\d+[A-Z0-9]*)?|Apple(?:'s)? M[1-9](?: Pro| Max| Ultra)?|AMD Ryzen [3579](?: [A-Z]*\d+[A-Z0-9]*)?)\b/i],
    ['Tần số công bố', /\b\d+(?:[.,]\d+)?\s*GHz\b/i],
    ['Hệ điều hành', /\b(?:Windows \d+(?:\.\d+)?|macOS(?: [A-Za-z]+)?|Chrome OS)\b/i],
    ['Kích thước công bố', /\b\d+(?:[.,]\d+)?[ -]?(?:inches|inch|cm|mm)\b/i],
    ['Công suất công bố', /\b\d+(?:[.,]\d+)?\s*(?:watts?|W)\b/i],
    ['Điện áp công bố', /\b\d+(?:[.,]\d+)?\s*(?:volts?|V)\b/i],
    ['Khối lượng công bố', /\b\d+(?:[.,]\d+)?\s*(?:kg|grams?|pounds?|lbs?)\b/i],
    ['Dung tích công bố', /\b\d+(?:[.,]\d+)?\s*(?:ml|litres?|liters?)\b/i],
    ['Quy cách đóng gói', /\b(?:pack of \d+|set of \d+|\d+[- ]pack)\b/i],
  ]
  for (const [label, pattern] of sourceFields) {
    const match = detailsText.match(pattern)
    if (match) specifications.push([label, match[0]])
  }
  const descriptionParagraphs = (product.description || product.name + (english ? ' in category ' : ' thuộc danh mục ') + displayCategory + '.').split(/\n+/).filter((paragraph) => paragraph.trim())
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => Number(review.rating) === stars).length }))
  const score = Number(averageRating)
  const classification = !reviews.length ? (english ? 'Unrated' : 'Chưa xếp loại') : score >= 4.5 ? (english ? 'Excellent' : 'Rất tốt') : score >= 4 ? (english ? 'Good' : 'Tốt') : score >= 3 ? (english ? 'Fair' : 'Khá') : score >= 2 ? (english ? 'Needs improvement' : 'Cần cải thiện') : (english ? 'Poor' : 'Chưa hài lòng')
  // Bộ lọc chỉ đổi danh sách; thống kê tổng vẫn tính trên tất cả đánh giá.
  const visibleReviews = reviews.filter((review) => (!ratingFilter || Number(review.rating) === ratingFilter) &&
    (reviewContent !== 'commented' || review.comment?.trim()) && (reviewContent !== 'replied' || review.adminReply?.trim()))
    .sort((a, b) => {
      const newest = (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
      if (reviewOrder === 'highest') return Number(b.rating) - Number(a.rating) || newest
      if (reviewOrder === 'lowest') return Number(a.rating) - Number(b.rating) || newest
      return reviewOrder === 'oldest' ? -newest : newest
    })
  const similar = product.stockCount === 0 ? similarProducts(products, product).slice(0, 10) : []

  return <div className="container page-shell product-detail-page">
    <button className="product-back" type="button" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/products')}>{english ? '← Back to products' : '← Quay lại hàng hóa'}</button>
    <nav className="breadcrumbs" aria-label="Đường dẫn"><a href="/">{english ? 'Home' : 'Trang chủ'}</a><span>/</span><a href="/products">{english ? 'Products' : 'Hàng hóa'}</a><span>/</span><span>{product.name}</span></nav>

    <section className="product-detail-layout product-detail-layout--redesign" aria-label="Thông tin sản phẩm">
      <section className={`product-detail-art product-detail-art--${product.tone}${product.source ? ' product-detail-art--imported' : ''}`} aria-label={'Hình minh họa ' + product.name}>
        <div className="product-detail-art__frame"><img src={images[activeImageIndex] || images[0]} alt={'Ảnh ' + product.name} width="640" height="640" /></div>
        <div className="product-detail-art__footer"><small>{product.label || (english ? 'Product photo' : 'Ảnh sản phẩm')}</small><span>{images.length} {english ? 'photos' : 'ảnh'}</span></div>
        {images.length > 1 && <div className="product-detail-thumbnails" role="list" aria-label="Chọn ảnh sản phẩm">{images.map((image, index) => <button key={image + index} type="button" onClick={() => setActiveImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={activeImageIndex === index}><img src={image} alt="" loading="lazy" /></button>)}</div>}
      </section>

      <section className="product-detail-info">
        <div className="product-member-line"><p className="eyebrow">{displayCategory}</p><span className="membership-badge">{plan.badge}</span></div>
        <h1>{product.name}</h1>
        <div className="product-detail-price-row"><strong className="product-detail-price">{money.format(product.price)}</strong>{product.discountPercent > 0 && <><del>{money.format(product.originalPrice)}</del><span className="detail-discount">{english ? `Save ${product.discountPercent}%` : `Giảm ${product.discountPercent}%`}</span></>}</div>
        <div className="product-detail-meta"><span>{stockLabel}</span><span>•</span><span>{product.viewCount || 0} {english ? 'views' : 'lượt xem'}</span>{averageRating && <><span>•</span><span>★ {averageRating}/5</span></>}</div>
        <div className="product-detail-actions"><button className="button" type="button" disabled={product.stockCount === 0} onClick={() => onAddToCart(product)}>{product.stockCount === 0 ? (english ? 'Out of stock' : 'Hết hàng') : (english ? 'Add to cart' : 'Thêm vào giỏ')}</button><button className="button button--soft" type="button" onClick={() => onToggleFavorite?.(product.id)}>{favorite ? (english ? '♥ Saved' : '♥ Đã yêu thích') : (english ? '♡ Add to favorites' : '♡ Thêm yêu thích')}</button></div>
        <div className="product-detail-highlights"><div><span>{english ? 'Category' : 'Danh mục'}</span><b>{displayCategory}</b></div><div><span>{english ? 'Status' : 'Tình trạng'}</span><b>{product.stockCount === 0 ? (english ? 'Out of stock' : 'Hết hàng') : (english ? 'In stock' : 'Sẵn sàng đặt')}</b></div><div><span>{english ? 'Rating' : 'Đánh giá'}</span><b>{averageRating ? `${averageRating}/5` : (english ? 'None' : 'Chưa có')}</b></div></div>
        <section className="product-detail-summary"><h2>{english ? 'Product highlights' : 'Đặc điểm sản phẩm'}</h2><ul className="product-feature-list">{features.slice(0, 6).map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></section>
        <section className="product-detail-summary"><h2>{english ? 'Product description' : 'Mô tả sản phẩm'}</h2><p className="product-detail-description">{product.description || (english ? 'No detailed description available.' : 'Sản phẩm chưa có mô tả chi tiết.')}</p></section>
        <section className="product-detail-summary product-detail-summary--rating"><h2>{english ? 'Product reviews' : 'Đánh giá sản phẩm'}</h2><p>{averageRating ? `★ ${averageRating}/5 · ${reviews.length} ${english ? 'reviews' : 'đánh giá'}` : (english ? 'No reviews yet' : 'Chưa có đánh giá')}</p><a href="#reviews">{english ? 'View reviews ↓' : 'Xem bình luận ↓'}</a></section>
      </section>
    </section>

    <section className="surface product-detail-full" aria-label="Chi tiết sản phẩm">
      <header className="product-detail-full__heading"><div><p className="eyebrow">{english ? 'Product overview' : 'Tìm hiểu sản phẩm'}</p><h2>{english ? 'Detailed information' : 'Thông tin chi tiết'}</h2></div><span>{specifications.length} {english ? 'specifications' : 'thông tin'} · {images.length} {english ? 'photos' : 'ảnh'}</span></header>
      <div className="detail-information-grid">
        <div className="detail-block detail-block--description"><h2>{english ? 'Product description' : 'Mô tả sản phẩm'}</h2>{descriptionParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <h3>{english ? 'Features and usage' : 'Đặc điểm và công dụng'}</h3><ul className="detail-feature-cards">{features.map((feature, index) => <li key={index}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p>{feature}</p></li>)}</ul>
        </div>
        <div className="detail-block detail-block--specs"><h2>{english ? 'Specifications & info' : 'Thông số và thông tin'}</h2><dl className="detail-specifications">{specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <p className="detail-source-note">{english ? 'Information compiled from product description and specifications.' : 'Thông tin được tổng hợp từ mô tả và đặc điểm của sản phẩm.'}</p>
          {product.sourceUrl && /^https?:\/\//.test(product.sourceUrl) && <p className="muted">{english ? 'Reference: ' : 'Tham khảo: '}<a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">{english ? 'Product source link' : 'Nguồn thông tin sản phẩm'}</a>.</p>}
        </div>
      </div>
      <div className="detail-block detail-block--gallery"><div className="detail-block__heading"><h2>{english ? 'Product photos' : 'Ảnh sản phẩm'}</h2><span>{images.length} {english ? 'photos' : 'ảnh'}</span></div><div className="detail-gallery">{images.map((image, index) => <button key={image + index} type="button" onClick={() => setActiveImage(index)} aria-label={'Xem ảnh ' + (index + 1)} aria-pressed={activeImage === index}><img src={image} alt={'Ảnh ' + (index + 1) + ' của ' + product.name} loading="lazy" /></button>)}</div></div>
    </section>

    <section className="surface product-detail-full detail-reviews-panel" id="reviews" aria-label="Đánh giá và bình luận">
      <header className="product-detail-full__heading"><div><p className="eyebrow">{english ? 'Store Community' : 'Cộng đồng Store'}</p><h2>{english ? 'Reviews & Comments' : 'Đánh giá và bình luận'}</h2><p className="reviews-subtitle">{english ? 'Real feedback helps you choose better.' : 'Trải nghiệm thật giúp bạn chọn món phù hợp hơn.'}</p></div><span className="reviews-count">{reviews.length} {english ? 'reviews' : 'đánh giá'}</span></header>
      <div className="detail-reviews-layout">
        <aside className="review-sidebar"><section className="detail-rating-summary" aria-label="Tổng hợp đánh giá"><strong>{averageRating || '—'}<small>/ 5</small></strong><p>{averageRating ? (english ? 'Average rating score' : 'Điểm đánh giá trung bình') : (english ? 'No reviews yet' : 'Chưa có đánh giá')}</p>
          <div className="review-score-stars" aria-hidden="true">{'★'.repeat(Math.round(Number(averageRating || 0)))}{'☆'.repeat(5 - Math.round(Number(averageRating || 0)))}</div>
          <div className="detail-rating-bars">{ratingCounts.map(({ stars, count }) => <div key={stars}><span>{stars} <i aria-hidden="true">★</i></span><div className="review-rating-track" role="meter" aria-valuemin="0" aria-valuemax={Math.max(1, reviews.length)} aria-valuenow={count} aria-label={stars + ' sao: ' + count + ' đánh giá'}><span style={{ width: (reviews.length ? count / reviews.length * 100 : 0) + '%' }} /></div><b>{count}</b></div>)}</div>
          <span className="review-score-classification" title="Rất tốt: từ 4,5; Tốt: từ 4; Khá: từ 3; Cần cải thiện: từ 2; Chưa hài lòng: dưới 2 sao">{english ? 'Rating: ' : 'Xếp loại: '}{classification}</span>
        </section>
          <section className="review-filter-panel" aria-label="Bộ lọc đánh giá"><h3>{english ? 'Filter reviews' : 'Lọc đánh giá'}</h3>
            <div className="review-rating-filter" role="group" aria-label="Lọc theo số sao">
              <button type="button" aria-pressed={ratingFilter === 0} onClick={() => setRatingFilter(0)}>{english ? 'All' : 'Tất cả'} <small>{reviews.length}</small></button>
              {ratingCounts.map(({ stars, count }) => <button key={stars} type="button" aria-label={'Lọc ' + stars + ' sao'} aria-pressed={ratingFilter === stars} onClick={() => setRatingFilter(stars)}>{stars} ★ <small>{count}</small></button>)}
            </div>
            <label htmlFor="review-content-filter">{english ? 'Review content' : 'Nội dung đánh giá'}</label><DropdownMenu value={reviewContent} options={[['all', english ? 'All content' : 'Tất cả nội dung'], ['commented', english ? 'With feedback' : 'Có lời chia sẻ'], ['replied', english ? 'Store replied' : 'Store đã trả lời']]} onChange={setReviewContent} ariaLabel="Nội dung đánh giá" className="review-filter-dropdown" />
          </section>
        </aside>
        <div className="detail-review-content">
          {account ? <form className="detail-review-form" onSubmit={submitReview}>
            <div className="detail-review-form__intro"><span className="review-compose-icon" aria-hidden="true">✎</span><div><h3>{english ? 'How was your experience?' : 'Trải nghiệm của bạn thế nào?'}</h3><p>{english ? 'Pick a rating and share your thoughts.' : 'Chọn số sao và chia sẻ điều bạn muốn mọi người biết.'}</p></div></div>
            <div className="review-star-field"><span>{english ? 'Rating score' : 'Điểm đánh giá'}</span><div className="review-star-picker" role="group" aria-label="Chọn điểm đánh giá">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= rating ? 'is-filled' : ''} type="button" disabled={reviewBusy} aria-label={'Chọn ' + value + ' sao'} aria-pressed={rating === value} onClick={() => setRating(value)}>★</button>)}<strong aria-live="polite">{(english ? ['Dissatisfied', 'Needs improvement', 'Okay', 'Satisfied', 'Very satisfied'] : ['Chưa hài lòng', 'Cần cải thiện', 'Ổn', 'Hài lòng', 'Rất hài lòng'])[rating - 1]}</strong></div></div>
            <label className="detail-review-form__comment">{english ? 'Your comments' : 'Lời chia sẻ của bạn'}<textarea rows="4" maxLength="2000" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={english ? 'What did you like? What could be improved?' : 'Bạn thích điều gì? Sản phẩm có điểm nào cần cải thiện?'} /><small>{english ? 'Optional' : 'Tùy chọn'} · {comment.length}/2.000 {english ? 'chars' : 'ký tự'}</small></label>
            <div className="detail-review-form__footer"><div>{reviewError && <p role="alert" className="form-error">{reviewError}</p>}{reviewSuccess && <p role="status" className="form-success">{reviewSuccess}</p>}</div><button className="button" type="submit" disabled={reviewBusy}>{reviewBusy ? (english ? 'Submitting…' : 'Đang gửi…') : (english ? 'Submit review →' : 'Gửi đánh giá →')}</button></div>
          </form> : <div className="detail-review-empty"><h3>{english ? 'Tried this product?' : 'Bạn đã trải nghiệm sản phẩm?'}</h3><p>{english ? 'Sign in to share your review with the community.' : 'Đăng nhập để chia sẻ đánh giá với cộng đồng.'}</p><button className="button button--soft" type="button" onClick={onRequireLogin}>{english ? 'Sign in to review' : 'Đăng nhập để đánh giá'}</button></div>}
          <div className="detail-review-list"><div className="review-list-toolbar"><div><h3>{english ? 'Customer reviews' : 'Khách hàng chia sẻ'}</h3><span role="status">{visibleReviews.length} / {reviews.length} {english ? 'reviews' : 'đánh giá'}</span></div><label className="review-sort">{english ? 'Sort' : 'Sắp xếp'}<DropdownMenu value={reviewOrder} options={[['newest', english ? 'Newest' : 'Mới nhất'], ['oldest', english ? 'Oldest' : 'Cũ nhất'], ['highest', english ? 'Highest rating' : 'Điểm cao nhất'], ['lowest', english ? 'Lowest rating' : 'Điểm thấp nhất']]} onChange={setReviewOrder} ariaLabel="Sắp xếp đánh giá" /></label></div>
          {visibleReviews.length ? visibleReviews.map((review) => <article key={review.id}>
            <header className="detail-review-heading"><span className="detail-review-avatar" aria-hidden="true">{(review.username || 'K').slice(0, 1).toUpperCase()}</span><div><strong>{review.username || (english ? 'Customer' : 'Khách hàng')}</strong><small>{safeDate(review.createdAt)}</small></div><span className="detail-review-stars" aria-label={review.rating + ' trên 5 sao'}>{'★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}</span></header>
            <p>{review.comment || (english ? 'Customer left a rating score.' : 'Khách hàng đã để lại điểm đánh giá.')}</p>{review.adminReply && <div className="detail-admin-reply"><b>{english ? 'Store reply' : 'Store trả lời'}</b><p>{review.adminReply}</p></div>}
          </article>) : reviews.length ? <div className="detail-review-empty review-filter-empty"><h3>{english ? 'No matching reviews' : 'Chưa có đánh giá phù hợp'}</h3><p>{english ? 'Try different star ratings or content to see more.' : 'Thử số sao hoặc nội dung khác để xem thêm chia sẻ.'}</p><button className="button button--soft" type="button" onClick={() => { setRatingFilter(0); setReviewContent('all') }}>{english ? 'Clear filters' : 'Xóa bộ lọc'}</button></div> : <div className="detail-review-empty review-first"><span aria-hidden="true">♡</span><div><h3>{english ? 'Start the conversation' : 'Mở đầu cuộc trò chuyện'}</h3><p>{english ? 'No comments yet. Your review will help the next shopper.' : 'Chưa có bình luận. Chia sẻ của bạn sẽ giúp người mua tiếp theo.'}</p></div></div>}
          </div>
        </div>
      </div>
    </section>

    {similar.length > 0 && <section className="home-section similar-section"><div className="section-heading"><div><p className="eyebrow">{english ? 'ALTERNATIVE RECOMMENDATIONS' : 'GỢI Ý THAY THẾ'}</p><h2>{english ? 'In-stock products in the same category' : 'Sản phẩm cùng danh mục còn hàng'}</h2></div></div><div className="product-grid">{similar.map((item) => <ProductCard key={item.id} product={item} onAddToCart={onAddToCart} isFavorite={favoriteIds.includes(String(item.id))} onToggleFavorite={onToggleFavorite} />)}</div></section>}
  </div>
}
