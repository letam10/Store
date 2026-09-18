export function loadJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function cartCount(cart) {
  return cart.reduce((total, item) => total + Number(item.quantity || 0), 0)
}

export function cartTotal(cart) {
  return cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0)
}

export function addCartItem(cart, product) {
  const found = cart.find((item) => String(item.id) === String(product.id))
  if (!found) return [...cart, { ...product, quantity: 1 }]
  return cart.map((item) => String(item.id) === String(product.id)
    ? { ...item, quantity: item.quantity + 1 }
    : item)
}

export function setCartQuantity(cart, productId, quantity) {
  const nextQuantity = Math.max(0, Math.min(99, Number(quantity) || 0))
  if (nextQuantity === 0) return cart.filter((item) => String(item.id) !== String(productId))
  return cart.map((item) => String(item.id) === String(productId)
    ? { ...item, quantity: nextQuantity }
    : item)
}

export function routeName(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/products') return 'products'
  if (path === '/contact') return 'contact'
  if (path === '/locations') return 'locations'
  if (path === '/cart') return 'cart'
  if (path === '/checkout') return 'checkout'
  if (path === '/login' || path === '/account') return 'account'
  if (path === '/admin' || path.startsWith('/admin/')) return 'admin'
  return 'not-found'
}
