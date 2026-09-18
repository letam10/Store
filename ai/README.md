# AI local

Thư mục độc lập với frontend. Chưa cài model hay runtime.

- training/: mã nguồn và cấu hình training.
- models/, datasets/, checkpoints/, outputs/, work/: tạo khi cần, đã được .gitignore loại khỏi Git.
- Không import model hoặc mã Python từ src/. Frontend sẽ gọi backend qua API; backend gọi dịch vụ AI.
- Không đưa secrets hoặc dữ liệu cá nhân vào repo, kể cả repo private.
- Tác vụ GPU vừa/nặng phải xác minh chọn NVIDIA RTX 4060 trước khi chạy; không fallback iGPU.
