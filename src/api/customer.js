/**
 * @codex-vn-doc
 * Tệp: src/api/customer.js
 * Mục đích: Client gọi API tài khoản, voucher, yêu thích, đánh giá và đơn hàng; giữ cookie/CSRF theo phiên.
 * Thành phần chính: customerApi.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { apiEndpoint, apiCredentials } from './endpoint.js'
import { apiErrorMessage, userMessage } from './userMessages.js'

// Chức năng customerApi: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export async function customerApi(path, { csrfToken, ...options } = {}) {
  try {
    const response = await fetch(apiEndpoint(path), {
      credentials: apiCredentials,
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        ...(options.headers || {}),
      },
    })
    const payload = await response.json().catch((error) => {
      if (error.name === 'AbortError' || error.name === 'TimeoutError' || response.ok) throw error
      return {}
    })
    if (!response.ok) {
      const error = new Error(apiErrorMessage(payload, response.status))
      error.code = payload?.error || 'API_ERROR'
      error.status = response.status
      error.payload = payload
      error.missingIds = Array.isArray(payload?.missingIds) ? payload.missingIds : []
      throw error
    }
    return payload
  } catch (error) {
    if (error.name === 'AbortError') throw error
    const localized = new Error(userMessage(error))
    localized.name = error.name
    localized.code = error.code
    throw localized
  }
}
