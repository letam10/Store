import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './PaymentModal.css'

const focusableSelector = 'a[href], button:not(:disabled), input:not(:disabled), '
  + 'select:not(:disabled), textarea:not(:disabled), [tabindex]'

export default function PaymentModal({ children, onClose }) {
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => { closeRef.current = onClose }, [onClose])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    // Nút thanh toán bị khóa khi gửi API nên focus có thể đã trở về body.
    const previousFocus = document.activeElement === document.body
      ? document.querySelector('[data-payment-trigger]') || document.body
      : document.activeElement
    const position = { left: window.scrollX, top: window.scrollY, behavior: 'instant' }
    const styleRecords = [document.documentElement, document.body].map(node => ({
      node,
      value: node.style.getPropertyValue('overflow'),
      priority: node.style.getPropertyPriority('overflow'),
    }))
    const padding = document.body.style.getPropertyValue('padding-right')
    const paddingPriority = document.body.style.getPropertyPriority('padding-right')
    const scrollbar = document.documentElement.clientWidth
      ? window.innerWidth - document.documentElement.clientWidth : 0
    const background = [...document.body.children]
      .filter(node => node !== overlayRef.current)
      .map(node => ({ node, inert: node.getAttribute('inert') }))

    // Giữ nguyên form và vị trí cuộn; chỉ card nổi được nhận tương tác.
    for (const { node } of styleRecords) node.style.setProperty('overflow', 'hidden', 'important')
    if (scrollbar > 0) {
      const currentPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0
      document.body.style.setProperty('padding-right', currentPadding + scrollbar + 'px')
    }
    for (const { node } of background) node.setAttribute('inert', '')

    function focusableElements() {
      return [...dialog.querySelectorAll(focusableSelector)].filter(node => node.tabIndex >= 0
        && node.type !== 'hidden' && !node.closest('[hidden], [inert]'))
    }

    function focusFirst() {
      const target = focusableElements()[0] || dialog
      target.focus({ preventScroll: true })
    }

    function handleFocus(event) {
      if (!dialog.contains(event.target)) focusFirst()
    }

    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusableElements()
      const first = elements[0]
      const last = elements.at(-1)
      const active = document.activeElement
      if (!elements.length) {
        event.preventDefault()
        dialog.focus({ preventScroll: true })
      } else if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', handleKey, true)
    document.addEventListener('focusin', handleFocus, true)
    focusFirst()

    return () => {
      document.removeEventListener('keydown', handleKey, true)
      document.removeEventListener('focusin', handleFocus, true)
      for (const { node, inert } of background) {
        if (inert === null) node.removeAttribute('inert')
        else node.setAttribute('inert', inert)
      }
      for (const { node, value, priority } of styleRecords) {
        if (value) node.style.setProperty('overflow', value, priority)
        else node.style.removeProperty('overflow')
      }
      if (padding) document.body.style.setProperty('padding-right', padding, paddingPriority)
      else document.body.style.removeProperty('padding-right')
      window.scrollTo(position)
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div className="payment-modal-backdrop" ref={overlayRef}>
      <div
        className="payment-modal-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Thanh toán bằng mã QR"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
