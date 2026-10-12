# Kiểm tra Giai đoạn 1

Ngày 12/10/2026, môi trường Windows / Node.js 24.18.0 / npm 11.16.0.

- Thư mục làm việc ban đầu trống; không có source code cần bảo toàn.
- Dependency đã cài bằng npm workspaces; có package-lock.json.
- `npm.cmd run build`: frontend và backend thành công.
- `npm.cmd run lint`: frontend và backend thành công.
- `npm.cmd run test:e2e -w backend`: 1 test health API đạt.
- `npm.cmd run dev`: Vite và NestJS watch khởi động thành công.
- HTTP frontend port 5173: 200; Vite phục vụ module App.tsx thành công.
- HTTP backend `/api/health` port 3000: 200, status ok, service bd-lab-api.
- CORS trả origin `http://localhost:5173` theo cấu hình.
- npm audit sau khi bỏ công cụ deploy `@nestjs/mau` không dùng: 0 vulnerabilities.

Chưa kiểm tra hoặc kết nối PostgreSQL, Prisma, SharePoint, AI Builder,
Power Automate, Google Sheets hay Microsoft Entra ID. Chưa dùng dữ liệu thật.
Chưa thực hiện kiểm tra giao diện bằng trình duyệt; xác minh localhost ở mức HTTP,
module Vite, build TypeScript và test API.

## Cập nhật port frontend

Theo yêu cầu người dùng, frontend chuyển sang `http://localhost:5174`.
Đã cập nhật Vite, CORS mặc định, backend `.env`/`.env.example` và README.
Đã khởi động lại hai server: frontend 5174 và API health 3000 trả HTTP 200;
CORS trả `http://localhost:5174`.
