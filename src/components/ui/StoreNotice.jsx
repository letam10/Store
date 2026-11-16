import './StoreNotice.css'

export default function StoreNotice({ notice, onClose }) {
  const message = typeof notice === 'string' ? notice : notice.message
  const href = typeof notice === 'string' ? '/cart' : notice.href
  const action = typeof notice === 'string' ? 'Xem giỏ hàng →' : notice.action

  return (
    <div className="cart-notice" role="status" aria-live="polite">
      <div className="cart-notice__badge" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="cart-notice__content">
        <p className="cart-notice__text">{message}</p>
        {action && (
          <a className="cart-notice__cta" href={href}>
            <span>{action}</span>
          </a>
        )}
      </div>
      <button className="cart-notice__close" type="button" onClick={onClose} aria-label="Đóng thông báo" title="Đóng">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="cart-notice__bar" aria-hidden="true" />
    </div>
  )
}
