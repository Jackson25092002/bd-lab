# BD Lab API

NestJS + Prisma + PostgreSQL. Xem README gốc và docs/phase-3.md để chạy.
Schema/migration/seed nằm trong prisma/. Swagger ở /api/docs khi không production.
.env riêng chứa DATABASE_URL và TEST_DATABASE_URL; không đưa credential lên Git.
API aggregate hồ sơ lưu mẫu và revision trong transaction; PDF lưu qua LocalPdfStorage.
Chưa tích hợp AI hoặc authentication; chỉ dùng môi trường local và dữ liệu thử nghiệm.
