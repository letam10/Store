/**
 * @codex-vn-doc
 * Tệp: src/api/customer.js
 * Mục đích: Client gọi API tài khoản, voucher, yêu thích, đánh giá và đơn hàng; giữ cookie/CSRF theo phiên.
 * Thành phần chính: customerApi.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
import { apiEndpoint, apiCredentials } from './endpoint.js'

const messages = {
  LOGIN_REQUIRED: 'Vui long dang nhap de tiep tuc.',
  LOGIN_FAILED: 'Ten dang nhap hoac mat khau khong dung.',
  INVALID_CREDENTIALS: 'Ten dang nhap hoac mat khau khong dung.',
  INVALID_CUSTOMER: 'Thong tin dang ky chua hop le (ten >= 3 ky tu, email hop le, mat khau >= 6 ky tu).',
  CUSTOMER_EXISTS: 'Ten tai khoan hoac email da duoc su dung. Vui long chon ten/email khac hoac dang nhap.',
  ACCOUNT_EXISTS: 'Ten hoac email da duoc su dung.',
  INVALID_REGISTRATION: 'Thong tin dang ky khong hop le.',
  INVALID_VOUCHER: 'Voucher khong con hieu luc hoac khong thuoc tai khoan.',
  PRODUCT_UNAVAILABLE: 'San pham da het hang hoac khong con du so luong.',
  INVALID_DELIVERY_REGION: 'Vui long chon dia chi va khoang cach hop le.',
  NO_SPIN_CREDITS: 'Ban chua co luot quay. Moi 100.000 d hang hoa da thanh toan nhan mot luot.',
  CSRF_INVALID: 'Phien dang nhap da het han. Vui long tai lai trang.',
  INVALID_2FA_CODE: 'Ma xac thuc 2 lop khong dung hoac da het han.',
  CHALLENGE_EXPIRED: 'Phien xac thuc 2 lop da het han. Vui long dang nhap lai.',
  INVALID_EMAIL: 'Email chua hop le.',
  INVALID_RESET: 'Thong tin dat lai mat khau chua hop le.',
  RESET_EXPIRED: 'Link dat lai da het han hoac da duoc su dung.',
  GOOGLE_NOT_CONFIGURED: 'Dang nhap Google chua duoc cau hinh.',
  GOOGLE_FAILED: 'Dang nhap Google that bai. Vui long thu lai.',
  GOOGLE_EMAIL_UNVERIFIED: 'Email Google chua duoc xac minh.',
  TWO_FACTOR_ALREADY_ENABLED: 'Tai khoan da bat xac thuc 2 lop.',
  TWO_FACTOR_SETUP_REQUIRED: 'Vui long quet QR truoc khi xac nhan.',
}

// Chức năng customerApi: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export async function customerApi(path, { csrfToken, ...options } = {}) {
  // Lệnh tích hợp: gọi mạng hoặc dữ liệu bên ngoài; cần xử lý timeout, lỗi và dữ liệu rỗng.
  const response = await fetch(apiEndpoint(path), {
    credentials: apiCredentials, cache: 'no-store', ...options,
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
