# BD Lab - Phần mềm tiếp nhận mẫu

Công ty Biển Đức. **Hiện tại: Giai đoạn 3 - PostgreSQL, Prisma và REST API.**

Frontend React theo Stitch đã kết nối backend NestJS. Hồ sơ, mẫu và bản nháp được lưu PostgreSQL;
PDF gốc lưu cục bộ ở backend. Chỉ dùng dữ liệu giả lập/thử nghiệm. Chưa kết nối dịch vụ ngoài.

## Chạy trên máy hiện tại

Database riêng của BD Lab đã được tạo và migrate, seed. Không ghi đè `.env` hiện có.

```powershell
npm.cmd run db:local:start
npm.cmd run dev
```

Nếu terminal cũ đang chạy `dev`, nhấn Ctrl+C tại terminal đó trước khi chạy lại.
Không mở thêm một phiên dev trên cùng port.

- Frontend: http://localhost:5174
- API liveness: http://localhost:3000/api/health
- API readiness/database: http://localhost:3000/api/health/ready
- Swagger: http://localhost:3000/api/docs
- PostgreSQL riêng: 127.0.0.1:5433. Không sử dụng hoặc thay đổi dịch vụ PostgreSQL hệ thống port 5432.

Backend đọc `backend/.env`, frontend đọc `frontend/.env`. Khởi động lại khi đổi cấu hình.
PowerShell có thể chặn `npm.ps1`; dùng `npm.cmd` mà không đổi Execution Policy.

## Thiết lập checkout mới

Yêu cầu Node.js 24.x, npm 11.x và PostgreSQL 18 có sẵn các binary initdb/pg_ctl.
Script hỗ trợ Windows; nếu vị trí cài khác, đặt `POSTGRES_BIN` tới thư mục binary.

```powershell
npm.cmd ci
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
npm.cmd run db:local:setup
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Chỉ copy cấu hình nếu chưa có file. Script setup tạo mật khẩu ngẫu nhiên, lưu trong `backend/.env`,
không in mật khẩu. Dữ liệu cluster nằm trong `.local/postgres/data`, được Git bỏ qua.
Setup/seed không xóa hoặc ghi đè hồ sơ đã có. PostgreSQL bootstrap role chỉ dành cho cluster phát triển.
Nếu dùng PostgreSQL riêng, tự điền DATABASE_URL và TEST_DATABASE_URL, bỏ qua db:local:setup.
Test yêu cầu database local riêng tên `bd_lab_test`.

## Thử luồng nghiệp vụ

**Tiếp nhận mẫu → Sử dụng biên bản demo → Mô phỏng nhận dạng & kiểm tra → Chỉnh sửa → Lưu bản nháp.**
Tải lại trang để kiểm tra dữ liệu vẫn còn. Mở Sổ nhận mẫu: một mẫu tương ứng một dòng.
Lịch sử nháp xem tại màn hình Kiểm tra biên bản. PDF do người dùng chọn chưa được OCR;
thông tin bắt đầu trống và có thể nhập thủ công. Không dùng tài liệu thật khi chưa được cho phép.

Xem [hướng dẫn Giai đoạn 3](docs/phase-3.md), [database](docs/database.md) và [API](docs/api.md).
Thiết kế tham chiếu trong [docs/design](docs/design/README.md).

## Kiểm tra, build và quản lý database

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run test:frontend
npm.cmd run test:backend
npm.cmd run db:local:status
npm.cmd run db:local:stop
```

- test:backend build code rồi migrate database test; chỉ dùng PDF và dữ liệu giả lập.
- db:local:stop dừng cluster riêng, không xóa dữ liệu. Lần sau dùng db:local:start.
- Build: frontend/dist và backend/dist. Chạy API đã build bằng `npm.cmd run start:prod -w backend`.
  Script start:prod chỉ chạy bản build, không tự biến môi trường này thành production.
- Generate Prisma khi schema đổi: `npm.cmd run db:generate`.
- Xem database: `npm.cmd run prisma:studio -w backend`.

## Cấu trúc

```text
frontend/src/
  app/                         Layout và điều hướng
  features/dashboard/          Tổng quan
  features/upload/             Tiếp nhận PDF
  features/review/             Đối soát và lưu nháp
  features/ledger/             Sổ nhận mẫu
  features/reception/          Types, API client, state và fixtures
  shared/                      UI, dialog, cấu hình
backend/
  prisma/                      Schema, migration và seed
  src/database/                Prisma Service
  src/modules/reception/       Hồ sơ, mẫu, bản nháp, PDF, lịch sử
  src/modules/health/          Liveness và database readiness
  src/storage/                 Lưu PDF cục bộ
  src/integrations/ai/          Ranh giới tích hợp Giai đoạn 4
  test/                        Kiểm thử API với PostgreSQL riêng
scripts/local-postgres.mjs      Cluster phát triển riêng trên Windows
docs/                          Thiết kế, API và kết quả kiểm tra
```

Dependency quản lý qua npm workspaces và package-lock.json. Prisma Client được generate từ schema,
không chỉnh sửa trực tiếp `backend/src/generated`. Các bản vá dependency phụ được khóa bằng overrides.

## Cấu hình và phạm vi

- `VITE_DATA_SOURCE=api`: lưu dữ liệu qua backend/PostgreSQL (mặc định Giai đoạn 3).
- `VITE_DATA_SOURCE=mock`: bản demo Giai đoạn 2, chỉ giữ dữ liệu trong phiên.
- Biến VITE_* là public; không chứa credential.
- Backend `.env`, `.local/`, `uploads/` và `test-uploads` không đưa vào Git.
- API chỉ bind loopback. Entra ID, xác thực người dùng và phân quyền triển khai sau.
- Trường khách hàng là snapshot theo hồ sơ, chưa phải danh mục khách hàng dùng chung.
- HS là tham chiếu hồ sơ nội bộ; chưa cấp mã mẫu hoặc Số phiếu KQ.

Giai đoạn 1–3 đã hiện thực. Giai đoạn 4 (SharePoint/Power Automate/AI Builder),
5 (xác nhận/cấp mã/Google Sheets), 6 (phân quyền/bảo mật/triển khai) chỉ bắt đầu khi người dùng xác nhận.
Không dùng Gemini API hoặc Azure AI Document Intelligence.
