const messages = {
  LOGIN_REQUIRED: 'Vui long dang nhap de tiep tuc.',
  INVALID_CREDENTIALS: 'Ten dang nhap hoac mat khau khong dung.',
  ACCOUNT_EXISTS: 'Ten hoac email da duoc su dung.',
  INVALID_REGISTRATION: 'Thong tin dang ky khong hop le.',
  INVALID_VOUCHER: 'Voucher khong con hieu luc hoac khong thuoc tai khoan.',
  PRODUCT_UNAVAILABLE: 'San pham da het hang hoac khong con du so luong.',
  INVALID_DELIVERY_REGION: 'Vui long chon dia chi va khoang cach hop le.',
  NO_SPIN_CREDITS: 'Ban chua co luot quay. Moi 100.000 d hang hoa da thanh toan nhan mot luot.',
  CSRF_INVALID: 'Phien dang nhap da het han. Vui long tai lai trang.',
}

export async function customerApi(path, { csrfToken, ...options } = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin', cache: 'no-store', ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(messages[payload.error] || payload.message || 'Không thể hoàn tất yêu cầu.')
    error.code = payload.error || 'API_ERROR'
    throw error
  }
  return payload
}
