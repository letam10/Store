# Store

Store dùng React + Vite ở frontend và Node.js/Express + SQLite ở backend. AI chạy qua Ollama local; trình duyệt chỉ gọi `/api`, không gọi Ollama trực tiếp.

## Runtime đã chốt

- Node.js: **22.16.0** (`.nvmrc`). `package.json` chấp nhận Node `>=22.12.0 <23`.
- npm: dùng phiên bản đi kèm Node 22.
- Ollama URL mặc định: `http://127.0.0.1:11434`.
- Model mặc định: `qwen3.5:4b`.
- Backend không tự tải model.

## Cài đặt tái lập

Frontend:

```powershell
npm ci
npm run dev
```

Backend:

```powershell
cd server
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Không dùng lệnh copy `.env` theo cách ghi đè cấu hình đang có.

Vite proxy `/api` tới `http://127.0.0.1:3001`.

## Cấu hình backend

`server/.env.example` không chứa bí mật. Các giá trị chính:

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `PORT` | `3001` | cổng API local |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Ollama local |
| `OLLAMA_MODEL` | `qwen3.5:4b` | model dùng chung khách/admin |
| `DB_PATH` | `data/store.sqlite` | SQLite local |
| `ENABLE_DEMO_DATA` | `false` | chỉ seed đơn demo khi chủ động bật |
| `SUPPORT_NUM_CTX` | `8192` | context khách |
| `ADMIN_DEFAULT_NUM_CTX` | `16384` | context admin mặc định |
| `SUPPORT_NUM_PREDICT` | `384` | giới hạn đầu ra khách |
| `ADMIN_NUM_PREDICT` | `1024` | giới hạn đầu ra admin |
| `OLLAMA_TIMEOUT_MS` | `120000` | timeout Ollama |
| `GENERATION_QUEUE_MAX` | `4` | số lượt chờ tối đa |
| `GENERATION_QUEUE_WAIT_MS` | `30000` | thời gian chờ queue tối đa |
| `COOKIE_SECURE` | `false` | đặt `true` khi dùng HTTPS |

Context admin cho phép 8K/16K/32K/64K. **64K = 65536 chỉ là cấu hình thử nghiệm**, không phải bằng chứng chạy ổn trên RTX 3050 6GB.

## Chat và stream

- Khách: backend khóa `think: false`.
- Admin hợp lệ: backend khóa `think: true`.
- Thinking thô bị bỏ ở parser Ollama, không gửi ra frontend và không lưu lịch sử.
- Ollama phải gửi terminal frame `done: true`. EOF sớm, timeout, abort hoặc hết giới hạn đầu ra không được lưu là assistant hoàn tất.
- Frontend cũng bắt buộc nhận event `done`; nếu stream đứt, phần đã nhận được đánh dấu chưa hoàn tất và có thể thử lại.
- Mỗi lượt frontend có `requestId`; retry cùng `requestId` được replay hoặc chạy lại theo trạng thái turn, không dedupe bằng nội dung tin nhắn.
- Một conversation chỉ có một lượt đang chạy. Hàng đợi GPU mặc định concurrency = 1.

Event NDJSON có thể gồm `status`, `conversation`, `verified`, `sources`, `report`, `delta`, `done`, `error`.

## Độ đúng và dữ liệu quan trọng

- Chính sách chưa được duyệt: backend trả trực tiếp `Store chưa cung cấp thông tin này.`; không hỏi model để tự bịa.
- Giá sản phẩm được render từ dữ liệu có cấu trúc ở `shared/products.js`.
- Với tư vấn sản phẩm, dữ liệu Store xác minh được tách khỏi nhận xét AI. Nhận xét AI có số liệu sản phẩm sẽ bị chặn theo hợp đồng xuất bản.
- Doanh thu do SQLite/backend tính. AI chỉ được nhận xét định tính; nội dung AI chứa số liệu hoặc phạm vi thời gian khác sẽ bị ẩn thay vì trình bày như báo cáo xác minh.
- Nguồn dữ liệu gắn với phần dữ liệu xác minh, không được coi là bằng chứng rằng mọi câu AI nói đều đúng.

`ENABLE_DEMO_DATA=false` là mặc định an toàn. Khi không có order, `dataMode=none`; dữ liệu được phân biệt `demo`, `real`, `mixed`, `none`.

## Báo cáo thời gian

Backend hiểu `hôm nay`, `hôm qua`, `tháng này`, `tháng trước` theo `Asia/Ho_Chi_Minh`. Ngày ISO được kiểm tra ngày có thật, năm nhuận, thứ tự khoảng và giới hạn tối đa 366 ngày. Câu báo cáo không nêu phạm vi rõ ràng sẽ hỏi lại thay vì tự chọn tháng hiện tại.

## Rút gọn hội thoại

Cơ chế hiện tại được mô tả trung thực là **rút gọn trích xuất**, không phải “compact thông minh”:

- lịch sử gốc vẫn nằm trong SQLite;
- `memory_json` lưu riêng entity, sở thích, request chưa giải quyết, nguồn backend và action backend đã xác nhận;
- mỗi mục có provenance như `user_claim`, `user_request`, `backend_source`, `backend_confirmed`;
- lời user không được nâng thành sự thật hay system instruction;
- lời model không tự trở thành dữ kiện xác minh;
- mã sản phẩm/đơn và memory bắt buộc không bị loại bằng cách cắt chuỗi;
- mốc compact chỉ cập nhật sau khi candidate đã qua kiểm tra ngân sách;
- nếu rút gọn không an toàn, summary/memory/mốc tốt trước đó được giữ và request nhận lỗi có thể phục hồi.

Backend hiện **không có tokenizer Qwen**. Ước lượng dùng số byte UTF-8 và chỉ cho input dùng 65% `num_ctx` để chừa biên cho sai số, output và thinking. Đây vẫn là heuristic, **không phải bảo đảm token chính xác**.

## Admin

Tạo admin mà không hardcode password:

```powershell
cd server
npm run create-admin -- owner
```

Mật khẩu được nhập ẩn và hash bằng scrypt + salt. Phiên dùng cookie HttpOnly + SameSite=Strict; chat/settings/logout yêu cầu CSRF. Login có limiter riêng theo IP và tài khoản đã normalize; limiter có giới hạn số key trong bộ nhớ.

API admin và API đọc conversation private đặt `Cache-Control: no-store`. Frontend hủy stream khi logout/unmount và xóa report, source, draft, conversation cùng UI nhạy cảm khi đổi phiên.

## Kiểm thử không dùng GPU

```powershell
npm ci
npm test
npm run lint
npm run build

cd server
npm ci
npm test
```

Regression test bao phủ parser Ollama qua HTTP giả lập, terminal frame/EOF/token limit, thinking leakage, restore race, double-send, transaction/idempotency, queue/abort, CSRF/session, ngày tương đối, dataMode, rút gọn trích xuất và model cố tình đưa chính sách/giá/doanh thu sai.

Workflow `.github/workflows/ai-local-ci.yml` chạy đúng các bước trên bằng Node từ `.nvmrc` và tạo `server/package-lock.json` bằng npm nếu cần.

## Không nằm trong phạm vi xác minh hiện tại

- Ollama thật / `qwen3.5:4b`: **NOT_TESTED** nếu chưa chạy trên máy dự án.
- RTX 3050 6GB: **NOT_TESTED**.
- Context gần đầy 64K: **NOT_TESTED**.
- RTX 4060: không dùng kết quả để suy ra RTX 3050.
- Tốc độ token/s: **NOT_TESTED**.
- LoRA/training/cloud: không triển khai trong đợt này.

Không commit `.env`, database thật, hội thoại riêng tư, model, dataset, cache hoặc `node_modules`.
