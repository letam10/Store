const messages = {
  LOGIN_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  ACCOUNT_EXISTS: 'Tên hoặc email đã được sử dụng.',
  INVALID_REGISTRATION: 'Thông tin đăng ký không hợp lệ.',
  INVALID_VOUCHER: 'Voucher không còn hiệu lực hoặc không thuộc tài khoản.',
  PRODUCT_UNAVAILABLE: 'Sản phẩm đã hết hàng hoặc không còn đủ số lượng.',
  INVALID_DELIVERY_REGION: 'Vui lòng chọn địa chỉ và khoảng cách hợp lệ.',
  NO_SPIN_CREDITS: 'Bạn chưa có lượt quay. Mỗi 100.000 ₫ hàng hóa đã thanh toán nhận một lượt.',
  CSRF_INVALID: 'Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.',
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
