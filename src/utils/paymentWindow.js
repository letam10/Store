export const PAYMENT_WINDOW_MS = 2 * 60 * 1000

export function paymentSecondsRemaining(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

export function formatPaymentTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  return String(minutes).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
}
