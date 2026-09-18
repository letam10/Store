# Store

Giao diện cửa hàng React + Vite. Dữ liệu và giỏ hàng chỉ là bản mẫu, chưa có backend, thanh toán hoặc AI.

## Chạy local

```powershell
npm ci
npm run dev
```

Nếu đã có node_modules chỉ cần npm run dev. Kiểm tra bằng npm run lint và npm run build trước khi gửi pull request.

## Cấu trúc

- src/components/layout/: Header, Footer.
- src/components/ui/: ProductCard và component tái sử dụng; CSS cạnh JSX.
- src/pages/: giao diện từng trang, hiện có Home.
- src/data/: dữ liệu mẫu, không chứa dữ liệu người dùng thật.
- src/assets/, public/: tài nguyên frontend, tuyệt đối không đặt model ở đây.
- src/api/: kết nối HTTP tới backend.
- src/services/: logic phía giao diện.
- src/hooks/, src/utils/: custom hooks và hàm tiện ích.
- src/context/, src/redux/: dành cho state dùng chung; chưa cài Redux.
- ai/: AI local độc lập ngoài src; model và dataset không đưa lên Git.

Frontend hiện ở gốc repo; chưa chuyển vào frontend/ để giữ nguyên cách chạy Vite. Khi thêm backend, team có thể thống nhất cấu trúc frontend/, backend/, ai/.

## Git private và làm việc nhóm

Git đã khởi tạo local; chưa commit hay kết nối remote. Chủ dự án tạo repository Private, không tạo sẵn README/license/gitignore trên remote. Kiểm tra secrets và thay URL bên dưới trước khi tự chạy:

```powershell
git add .
git diff --cached
git commit -m "Initial Store UI"
git remote add origin <PRIVATE_REPOSITORY_URL>
git push -u origin main
```

Mời thành viên qua nền tảng Git; biết URL private không đồng nghĩa có quyền truy cập. Thành viên clone, tạo nhánh riêng, cài dependency:

```powershell
git clone <PRIVATE_REPOSITORY_URL>
cd <REPOSITORY_FOLDER>
git switch -c feat/ten-tinh-nang
npm ci
npm run dev
```

Chia phạm vi theo component, gửi pull request để review trước khi merge main. Không commit node_modules, .env, model, dataset hoặc output training; giữ package-lock.json trong Git.
