/**
 * @codex-vn-doc
 * Tệp: src/api/endpoint.js
 * Mục đích: Chuẩn hóa base URL và credentials cho các request /api của frontend.
 * Thành phần chính: apiEndpoint, apiCredentials.
 * Liên kết trực tiếp: không có import/using trực tiếp được phát hiện.
 * Cẩn trọng: khi sửa hàm, route, state, schema hoặc export phải kiểm tra các tệp gọi nó; các nhánh lỗi, dữ liệu rỗng, hủy request và dữ liệu không hợp lệ phải giữ đúng hợp đồng hiện tại.
 */
// Use a same-origin HTTPS /api proxy in production so support cookies remain first-party.
const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '')
// Chức năng apiEndpoint: xử lý dữ liệu theo hợp đồng của hàm; kiểm tra đầu vào, nhánh lỗi và kết quả trước khi trả cho nơi gọi.
export function apiEndpoint(path) {
  return path.startsWith('/api/') ? base + path : path
}
export const apiCredentials = base ? 'include' : 'same-origin'
