// Dọn giỏ đúng một lần, kể cả khi khách đóng QR rồi nhận kết quả sau hoặc tải lại trang.
export function consumeCheckoutDraft(storage, customerId, orderId, fallback = []) {
  const markerKey = 'storeCheckoutCleared:' + customerId
  const draftKey = 'storeCheckoutItems:' + customerId + ':' + orderId
  let cleared = []
  let items = fallback
  try { cleared = JSON.parse(storage.getItem(markerKey) || '[]') } catch { /* Khôi phục danh sách mới nếu cache bị hỏng. */ }
  if (!Array.isArray(cleared)) cleared = []
  if (cleared.includes(orderId)) return []
  try { items = JSON.parse(storage.getItem(draftKey) || 'null') || fallback } catch { /* Dùng dữ liệu của phiên hiện tại. */ }
  const valid = Array.isArray(items) ? items.filter(item => item?.id != null && Number.isInteger(item.quantity) && item.quantity > 0) : []
  if (!valid.length) return []
  storage.setItem(markerKey, JSON.stringify([...cleared.slice(-199), orderId]))
  storage.removeItem(draftKey)
  return valid
}

export function subtractCheckoutItems(cart, purchasedItems) {
  const quantities = new Map()
  for (const item of purchasedItems) quantities.set(String(item.id), (quantities.get(String(item.id)) || 0) + item.quantity)
  return cart.map(item => ({ ...item, quantity: item.quantity - (quantities.get(String(item.id)) || 0) })).filter(item => item.quantity > 0)
}
