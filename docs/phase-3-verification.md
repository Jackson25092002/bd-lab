# Kiểm tra Giai đoạn 3

Ngày 12/10/2026, Windows / Node.js 24.18.0 / PostgreSQL 18.4 / Prisma 7.10.0.

## Đã kiểm tra

- Cluster riêng 127.0.0.1:5433 trong .local/postgres; không dùng database của service hệ thống.
- Generate Prisma, migrate bd_lab_dev và bd_lab_test: đạt.
- Seed idempotent: 3 hồ sơ và 9 mẫu giả lập ban đầu, không reset hồ sơ đã có.
- Build frontend/backend, lint: đạt.
- 7 test frontend, 13 test API với PostgreSQL thật ở bd_lab_test: đạt.
- Multipart upload giữ đúng byte PDF; file sai/vượt 20 MB bị chặn, không tự điền OCR.
- Snapshot gốc/history immutable; version cũ/saves đồng thời trả 409, không ghi đè.
- Mẫu thuộc hồ sơ khác bị chặn, transaction rollback, ID mẫu giữ lại không đổi.
- Kiểm tra ngày sai, UUID, raw/trường ngoài DTO, payload thiếu, query sai và PDF bị thay đổi.
- npm audit runtime và toàn bộ dependency sau cập nhật: 0 vulnerabilities.
- Prisma CLI hoạt động sau override deepmerge-ts 8.0.2 và mysql2 3.24.5.

## Trình duyệt và khởi động lại

- Frontend tải hồ sơ từ PostgreSQL.
- Tạo HS-000004 qua nút biên bản demo, chỉnh số lượng mẫu 2 và ghi chú, lưu thành công.
- Tải lại trình duyệt: giá trị mới vẫn còn; PDF từ backend hiển thị.
- Khởi động lại backend: HS-000004 vẫn ở version 1, số lượng mới và raw số lượng trống.
- Dừng/khởi động lại cluster PostgreSQL riêng: cùng dữ liệu vẫn đọc được; readiness 200.
- Lịch sử hiển thị phiên bản tạo/lưu; Lưu & chuyển sang sổ qua API thành công.
- `npm run dev` kh?i ??ng c? hai ?ng d?ng; thay ??i source backend ???c bi?n d?ch v? t? kh?i ??ng l?i th?nh c?ng. ?? b? incremental cache v? gi? dist khi watch ?? tr?nh l?i thi?u module.
- Helper ki?m tra PostgreSQL b?ng k?t n?i c? x?c th?c v? x?c minh data_directory, thay v? tr?ng th?i process b? sandbox h?n ch?.
- ?nh ki?m tra: `docs/previews/phase-3-ledger.jpg`.
- Swagger /api/docs-json: 200; OpenAPI snapshot trong docs/openapi.json.

## Giới hạn

- Tự động chọn file qua extension Chrome vẫn bị giới hạn file URL permission;
  không đổi quyền extension. Upload backend được kiểm tra qua multipart với PDF giả lập.
- Không kiểm tra dịch vụ ngoài, authentication hoặc production load.
- pg có deprecation warning từ đường gọi Prisma adapter về query đồng thời;
  các test/transaction đều đạt. Dependency khóa ở major 8; kiểm tra lại trước khi nâng major pg.
- Không chạy schema/migration trên dữ liệu thật. Giai đoạn 4–6 chưa triển khai.
