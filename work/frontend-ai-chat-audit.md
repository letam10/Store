# Audit kết nối AI chat phía Store

Ngày rà soát: 2026-10-11

## Kết luận

Store đã nối chat khách hàng vào luồng AI thật qua API backend; các nút gợi ý chỉ điền văn bản vào ô nhập và không tự hiển thị câu trả lời. Tuy nhiên, lần rà soát này không khẳng định Ollama hoặc backend đang chạy vì không khởi động dịch vụ và không gọi endpoint live.

## Bằng chứng phía giao diện

- `src/components/ui/CustomerSupport.jsx:280`: ba gợi ý (`Tư vấn sản phẩm`, `Thông tin đơn hàng`, `Chính sách đổi trả`) chỉ gọi `setDraft(suggestion)` rồi focus input. Không có `startRequest`/`streamChat` trong handler nút gợi ý.
- `src/components/ui/CustomerSupport.jsx:146-151`: khi gửi form, component gọi `streamChat` với endpoint `/api/support/chat`, `message`, `requestId`, `conversationId` và `account?.csrfToken`.
- `src/components/ui/CustomerSupport.jsx:156-174`: xử lý các event `conversation`, `status`, `delta`, `verified`, `sources`, `done`; chỉ `done` mới chuyển assistant message sang `complete`.
- `src/components/ui/CustomerSupport.jsx:239`: khách chưa đăng nhập không mở được panel; callback `onRequireLogin` được gọi.
- `src/components/ui/CustomerSupport.jsx:64`: phiên có `conversationId` trong localStorage được phục hồi bằng GET `/api/support/conversations/:id`.

## Bằng chứng client/API và proxy

- `src/api/chat.js:91-103`: POST dùng `credentials` và JSON `{ message, requestId, conversationId? }`; nếu có token thì gửi header `x-csrf-token`.
- `src/api/chat.js:63-76,129-159`: NDJSON event được kiểm tra; thiếu `done`, event lỗi, JSON sai hoặc event sau `done` đều bị từ chối. Đây là bằng chứng client yêu cầu stream hoàn tất, không phải bằng chứng model đã trả lời live.
- `src/api/endpoint.js:9-14`: mặc định dùng same-origin `/api`; chỉ thêm `VITE_API_BASE_URL` khi được cấu hình.
- `vite.config.js:12-21`: Vite proxy `/api` mặc định tới `http://127.0.0.1:3010`; `VITE_API_TARGET` có thể đổi đích.
- `DEPLOYMENT.md:17-21`: proxy triển khai phải giữ cookie, `Set-Cookie`, body và stream NDJSON, không buffer/cache stream; cấu hình production mặc định giữ `VITE_API_BASE_URL` rỗng.

## Bằng chứng backend và điều kiện xác thực

- `backend/server/src/app.js:603`: POST `/api/support/chat` chạy qua `requireCustomer` rồi `customerCsrf` trước `handleChat`.
- `backend/server/src/customer.js:141-173`: phiên khách hàng đọc cookie `store_customer_session`, kiểm tra session còn hạn, tạo CSRF token theo session và yêu cầu khớp header `x-csrf-token`; thiếu phiên trả `401 LOGIN_REQUIRED`, sai CSRF trả `403 CSRF_INVALID`.
- `backend/server/src/app.js:432-437`: stream bắt đầu bằng event `conversation`, chứa `model: config.ollamaModel`.
- `backend/server/src/app.js:465-518`: luồng hỗ trợ chuẩn bị knowledge/context rồi gọi `ollama.chatStream`.
- `backend/server/src/app.js:555-561`: sau terminal Ollama hợp lệ, backend phát `delta` và `done`; health ở `:584-590` báo `backend`, trạng thái `ollama`, model cấu hình và `model.present`.
- `backend/server/src/config.js:56-57`: mặc định Ollama là `http://127.0.0.1:11434`, model `qwen3.5:4b`.

## Kiểm chứng đã chạy

Đã chạy tại `D:\Học Tập\Website_React\Store`:

```text
node --test test/chat-stream.test.js test/user-messages.test.js test/separation.test.js
14 tests passed, 0 failed, 0 skipped
```

Các kiểm tra bao phủ: bắt buộc event `done`, Unicode bị chia chunk, chặn event sau `done`, dịch lỗi mạng/HTTP/stream sang tiếng Việt, giữ trạng thái incomplete/abort và xác nhận Store không chứa source admin/backend. Đây là kiểm thử client/static và mock stream; chưa kiểm chứng live `GET /api/health`, proxy 5173 -> 3010, cookie/CSRF thật, Ollama 11434, model `qwen3.5:4b`, hoặc một câu hỏi thật có `done` từ backend.

## Đánh giá theo hợp đồng

| Tiêu chí | Kết quả | Căn cứ |
|---|---|---|
| Gợi ý chỉ điền input | Đạt qua code | `CustomerSupport.jsx:280` |
| Không gọi Ollama trực tiếp từ browser | Đạt qua code | browser chỉ gọi `/api/support/chat`; Ollama nằm backend |
| Session khách hàng + CSRF | Đạt qua code | `app.js:603`, `customer.js:141-173` |
| Payload request đúng hợp đồng | Đạt qua code | `chat.js:99-103` |
| Stream yêu cầu `done` | Đạt qua test | 3 test `chat-stream` |
| Health/model live và phản hồi `model: qwen3.5:4b` | Chưa xác nhận | không chạy dịch vụ/live request |

Không sửa source, không khởi động/dừng dịch vụ và không ghi credential trong quá trình rà soát.
