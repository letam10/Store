# Store

Store là frontend React + Vite kèm backend Node.js/Express cho AI local qua Ollama. Nhánh `feat/ai-local` triển khai chat khách non-thinking, chat admin thinking, SQLite local, context/compact và số liệu demo.

> Dữ liệu sản phẩm, đơn hàng và doanh thu hiện vẫn là **demo**. Không dùng số liệu demo như dữ liệu kinh doanh thật.

## Kiến trúc

```text
React/Vite -> /api -> Express -> quyền + tra cứu dữ liệu -> Ollama local
                     |
                     +-> SQLite local
```

- Trình duyệt không gọi Ollama trực tiếp.
- Ollama mặc định chỉ ở `http://127.0.0.1:11434`.
- Model mặc định: `qwen3.5:4b`.
- Khách: backend khóa `think: false`.
- Admin đã đăng nhập: backend khóa `think: true`.
- Thinking thô không được gửi ra frontend hoặc lưu làm lịch sử.
- Hàng đợi sinh nội dung mặc định concurrency = 1.
- Không triển khai LoRA/cloud trong đợt này.

## Cài đặt

Yêu cầu: Node.js phù hợp với Vite 8/better-sqlite3, npm và Ollama local.

Frontend:

```powershell
npm ci
npm run dev
```

Backend:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

Vite dev proxy `/api` tới `http://127.0.0.1:3001`.

Kiểm tra Ollama:

```powershell
ollama list
```

Backend không tự tải model. Nếu máy chưa có `qwen3.5:4b`, `GET /api/health` sẽ báo model chưa sẵn sàng.

## Cấu hình backend

Sửa `server/.env` (không commit file này).

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `3001` | cổng API local |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama local |
| `OLLAMA_MODEL` | `qwen3.5:4b` | model dùng chung khách/admin |
| `DB_PATH` | `data/store.sqlite` | SQLite local |
| `SUPPORT_NUM_CTX` | `8192` | context khách |
| `ADMIN_DEFAULT_NUM_CTX` | `16384` | context admin mặc định |
| `SUPPORT_NUM_PREDICT` | `384` | giới hạn đầu ra khách |
| `ADMIN_NUM_PREDICT` | `1024` | giới hạn đầu ra admin |
| `OLLAMA_TIMEOUT_MS` | `120000` | timeout |
| `GENERATION_QUEUE_MAX` | `4` | số tác vụ chờ tối đa |
| `COOKIE_SECURE` | `false` | đặt `true` khi chạy HTTPS |

Context admin chỉ cho phép 8K/16K/32K/64K. **64K = 65536 là thử nghiệm**, không phải chứng nhận chạy ổn trên RTX 3050 6GB. Không tự fallback GPU hoặc tự đổi context.

## Tạo admin an toàn

Không hardcode mật khẩu vào source hoặc command line.

```powershell
cd server
npm run create-admin -- owner
```

Script yêu cầu terminal tương tác, ẩn mật khẩu và dùng scrypt + salt trước khi lưu SQLite. Mật khẩu tối thiểu 12 ký tự.

Sau đó mở:

```text
http://localhost:5173/admin
```

Phiên admin dùng cookie HttpOnly + SameSite=Strict; thao tác thay đổi cấu hình/chat admin yêu cầu CSRF token của phiên. Đăng nhập có giới hạn thử sai.

## API chính

- `GET /api/health`: backend, Ollama, model, queue.
- `POST /api/support/chat`: chat khách, non-thinking bắt buộc.
- `GET /api/support/conversations/:id`: chỉ owner cookie tương ứng.
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`.
- `POST /api/admin/chat`: admin hợp lệ, thinking bắt buộc.
- `GET/PUT /api/admin/settings`: model/context/compact.
- `GET /api/admin/stats?from=YYYY-MM-DD&to=YYYY-MM-DD`: số liệu backend.
- `GET /api/admin/conversations/:id`: chỉ admin sở hữu hội thoại.

Client chat chỉ gửi `message` và tùy chọn `conversationId`. Các trường như role, model, think, Ollama URL hay tool list bị từ chối.

Streaming dùng NDJSON có các event: `conversation`, `status`, `delta`, `sources`, `report`, `done`, `error`. Backend không proxy nguyên stream nội bộ của Ollama và bỏ qua trường thinking.

## Dữ liệu và độ chính xác

Nguồn sản phẩm dùng chung ở `shared/products.js`; `src/data/products.js` chỉ re-export để frontend cũ tiếp tục chạy.

Chính sách được duyệt ở `shared/storePolicies.js`. Hiện danh sách trống; khi hỏi chính sách chưa có, backend cung cấp chỉ dẫn trả lời:

> Store chưa cung cấp thông tin này.

Không thêm chính sách đổi trả/hoàn tiền/bảo hành/giao hàng nếu chủ dự án chưa duyệt.

SQLite seed một ít đơn hàng demo để kiểm tra dashboard. Doanh thu do backend tính với:
- timezone: `Asia/Ho_Chi_Minh`;
- trạng thái được tính: `paid`, `completed`;
- `cancelled` bị loại;
- refund được trừ khỏi doanh thu ròng.

Dashboard hiển thị số liệu backend riêng với AI nhận xét. AI không phải nguồn xác minh số liệu.

## Context và compact

- Lịch sử gốc luôn được giữ trong SQLite.
- Compact xảy ra trước ngưỡng an toàn 80% context.
- Giữ system prompt, phần gần nhất của hội thoại và tóm tắt backend.
- Tóm tắt phân biệt “người dùng nói” với tham chiếu dữ liệu đã xác minh.
- Giá/tồn kho/doanh thu luôn phải tra cứu lại; summary không thay thế nguồn động.
- Không lưu/reuse thinking.
- Token hiện dùng **ước lượng bảo thủ**, không phải tokenizer chính xác của qwen; UI/API ghi rõ `tokenEstimate: true`.
- Nếu compact không đưa context về mức an toàn, backend giữ lịch sử gốc và trả lỗi yêu cầu mở hội thoại mới.

Compact không bảo đảm nhớ hoàn hảo và không làm 64K tự nhiên vừa VRAM.

## Kiểm thử

Các test backend dùng mock Ollama, không gọi GPU:

```powershell
cd server
npm install
npm test
```

Test hiện bao phủ tối thiểu:
- khách luôn `think: false`;
- client không được tự gửi trường `think`;
- admin chưa đăng nhập bị từ chối;
- admin hợp lệ luôn `think: true`;
- hội thoại khách không đọc chéo owner;
- compact giữ phân biệt lời người dùng / nguồn sản phẩm;
- chính sách thiếu không được tự bịa.

Kiểm tra frontend:

```powershell
npm run lint
npm run build
```

## Trạng thái xác minh

- Mock Ollama integration: có test trong repo, cần chạy sau `npm install` trên máy clone.
- Ollama thật / `qwen3.5:4b`: **NOT_TESTED** trong bàn giao này.
- RTX 3050 6GB: **NOT_TESTED**.
- Context gần đầy 64K: **NOT_TESTED**.
- RTX 4060 của chủ dự án: không benchmark trong đợt này, nên không có số liệu để nhầm với RTX 3050.
- Tốc độ token/s: **NOT_TESTED**.

Không chạy benchmark GPU dài nếu chưa được chủ dự án đồng ý.

## File local không được commit

`.env`, SQLite thật, hội thoại riêng tư, model, dataset, checkpoint, cache, `node_modules` và output training đều nằm trong ignore. Không tạo backup/archive tự động.

## Phạm vi hiện chưa làm

- Thanh toán thật.
- Hoàn tiền hoặc sửa đơn tự động.
- Database nghiệp vụ production.
- Phân quyền nhiều cấp admin.
- Vector database/embedding.
- LoRA/training.
- Cloud AI.
- Benchmark GPU/context thực tế.
