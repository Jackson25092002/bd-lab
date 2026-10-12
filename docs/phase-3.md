# Giai đoạn 3 - Database và REST API

## Đã hiện thực

- PostgreSQL 18 cluster riêng trong project, port 5433, SCRAM và mật khẩu ngẫu nhiên.
- Prisma ORM 7.10.0, schema, migration và seed idempotent bằng dữ liệu giả lập.
- Hồ sơ tiếp nhận, PDF metadata, mẫu, OCR snapshot và revision lịch sử.
- Upload một PDF tối đa 20 MB; đuôi, MIME, chữ ký PDF và file không trống được kiểm tra.
- PDF đặt tên ngẫu nhiên ở backend/uploads, giữ tên gốc ở database, có SHA-256 để phát hiện thay đổi.
- API tạo/xem/tìm kiếm hồ sơ, sửa nháp và thêm/xóa mẫu qua aggregate hồ sơ, đọc PDF/lịch sử.
- Lưu nháp bằng transaction. Version cũ trả 409, không ghi đè dữ liệu đã lưu.
- OCR gốc, PDF metadata và revision được bảo vệ bằng trigger không cho update/delete thông thường.
- Frontend API mode đọc/lưu database, thông báo tải/lưu/lỗi, xem lịch sử và giữ bản đang sửa khi lưu lỗi.
- Vẫn có mock mode để xem Giai đoạn 2 mà không cần backend.

## Nghiệm thu

1. Khởi động database, chạy frontend/backend theo README.
2. Tiếp nhận biên bản demo; ghi nhớ tham chiếu HS.
3. Sửa số lượng mẫu 2 và ghi chú, Lưu bản nháp.
4. Tải lại trang: thông tin đã sửa vẫn còn; dữ liệu gốc vẫn để trống số lượng mẫu 2.
5. Khởi động lại backend: hồ sơ/PDF vẫn đọc được.
6. Mở lịch sử: có snapshot khi tạo và khi lưu. Mỗi mẫu có UUID ổn định trong database.
7. Mở hai cửa sổ cùng hồ sơ: bản thứ hai với version cũ bị từ chối 409.

## Giới hạn và ranh giới

- Đây là môi trường phát triển local, chưa có Entra ID hoặc phân quyền người dùng.
- Không gọi AI. PDF thông thường không tạo dữ liệu OCR; raw trả cấu trúc trống khi chưa có extraction.
  Demo endpoint dùng payload cố định từ fixture và lưu snapshot thực vào database.
- Chưa có danh mục khách hàng; các thông tin khách hàng/address/contact là snapshot theo hồ sơ,
  tránh sửa thông tin một hồ sơ làm thay đổi hồ sơ khác.
- Chưa xác nhận/cấp mã mẫu/Số phiếu KQ; HS chỉ là tham chiếu hồ sơ nội bộ.
- Chưa có callback AI, đồng bộ Sheets, mapping theo tháng hoặc cập nhật cột M.
- Đọc danh sách API hiện trả tất cả hồ sơ local; bảng frontend lọc/phân trang trên tập đó.
  Cần bổ sung phân trang server và tải theo nhu cầu trước khi vận hành tập dữ liệu lớn.
- File system và database không có transaction phân tán. Nếu database từ chối create,
  file mới được dọn bằng compensation. Nếu máy tắt giữa hai thao tác có thể còn file orphan;
  backup/đối chiếu storage sẽ hoàn thiện trước triển khai.
- Seed chỉ thêm khi chưa có hồ sơ demo, không reset dữ liệu. Không có API xóa hồ sơ/gốc/lịch sử.
- Xóa mẫu khỏi nháp xóa dòng Sample hiện hành, nhưng snapshot gốc và revision vẫn giữ lịch sử.
- Khóa immutability áp dụng thao tác SQL thông thường; admin/superuser vẫn có thể thay đổi schema.
  Không coi đây là phân quyền hoặc tính bất biến chống quản trị viên.

## Dữ liệu và chạy lại

Giữ đồng thời `.local/postgres/data`, `backend/uploads` và cấu hình kết nối local.
Không xóa các thư mục này nếu muốn giữ hồ sơ. Mọi đường dẫn đều bị Git bỏ qua.
Có database `bd_lab_dev` và `bd_lab_test` riêng. Test không dùng database phát triển.

Prisma 7 được chọn theo [tài liệu chính thức](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql).
