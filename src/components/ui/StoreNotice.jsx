export default function StoreNotice({ notice, onClose }) {
  const message = typeof notice === 'string' ? notice : notice.message
  const href = typeof notice === 'string' ? '/cart' : notice.href
  const action = typeof notice === 'string' ? 'Xem giỏ hàng →' : notice.action
  return <div className="cart-notice" role="status">
    <span>✓ {message}</span>
    <a href={href}>{action}</a>
    <button type="button" onClick={onClose} aria-label="Đóng thông báo">×</button>
  </div>
}
