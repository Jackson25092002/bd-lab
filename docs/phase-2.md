# Giai đoạn 2 - Giao diện và luồng demo

Ngày triển khai: 12/10/2026. Thiết kế tham chiếu: BD Lab Management System trên Stitch.

## Chạy thử

Tại thư mục gốc: `npm.cmd run dev`.
Frontend: http://localhost:5174. Giai đoạn 2 có thể chạy riêng bằng `npm.cmd run dev:frontend`,
không cần backend hoặc dịch vụ ngoài.

1. Mở **Tiếp nhận mẫu**.
2. Nhấn **Sử dụng biên bản demo**.
3. Nhấn **Mô phỏng nhận dạng & kiểm tra**.
4. Xem PDF bên trái, sửa trường số lượng mẫu 2 bên phải.
5. Nhấn **Lưu bản nháp**, rồi mở **Sổ nhận mẫu**.
6. Tìm hồ sơ DEMO mới: PDF 3 mẫu tạo 3 dòng sổ. Lọc, phân trang hoặc xuất CSV demo.

Có thể chọn PDF từ máy hoặc kéo thả vào vùng tiếp nhận. Kiểm tra đuôi, MIME,
tệp không trống, giới hạn 20 MB và chữ ký `%PDF-`. Đây là kiểm tra sơ bộ,
không phải kiểm tra cấu trúc toàn bộ PDF. PDF lỗi/hỏng/mã hóa có thể không xem được;
trình đọc PDF của trình duyệt xử lý việc hiển thị. Có liên kết **Mở riêng** làm phương án dự phòng.
PDF người dùng không được OCR; các trường bắt đầu trống và có thể thêm mẫu thủ công.

## Đã hiện thực

- Dashboard: số mẫu, hồ sơ chờ kiểm tra, hồ sơ nháp, trường thiếu; biểu đồ và hàng đợi từ dữ liệu phiên.
- Upload: chọn/kéo thả một PDF, kiểm tra sơ bộ, bỏ tệp, trạng thái chờ và mô phỏng nhận dạng với fixture.
- Review: PDF gốc và dữ liệu cạnh nhau trên desktop; xếp dọc ở màn hình hẹp.
- Sửa khách hàng, ngày lấy mẫu, người lấy mẫu, ghi chú; thêm/xóa và chỉnh từng mẫu.
- Dữ liệu gốc và chỉnh sửa là hai bản riêng. Xem dữ liệu gốc trong mục mở rộng.
- Lưu nháp, cảnh báo khi chuyển trang/hồ sơ nếu chưa lưu, cảnh báo khi tải lại có thay đổi chưa lưu.
- Ledger: mỗi mẫu một dòng, tìm kiếm có/không dấu, lọc loại/trạng thái/tháng, phân trang và xuất CSV.
- Các thời gian hồ sơ hiển thị theo múi giờ Asia/Bangkok (UTC+7).
- Khôi phục dữ liệu demo có hộp thoại. Dialog hỗ trợ Tab/Shift+Tab và Escape.
- Responsive, menu mobile, trạng thái không có kết quả và không tìm thấy hồ sơ.
- Font Inter và icons local; không dùng CDN trong ứng dụng.

## Giới hạn có chủ đích

- Dữ liệu chỉ giữ trong bộ nhớ của phiên. Tải lại trang hoặc đóng tab sẽ đặt lại.
- PDF cục bộ dùng object URL, không gửi backend, SharePoint, Stitch hay bất kỳ API OCR nào.
- 3 hồ sơ seed cùng tham chiếu một PDF 3 mẫu để thử các trạng thái khác nhau. Tất cả là dữ liệu giả lập.
- Mô phỏng OCR chỉ dùng fixture, không suy đoán trường từ PDF người dùng.
- ID DEMO là tham chiếu UI, không phải mã mẫu hoặc Số phiếu KQ chính thức.
- Nút xác nhận/cấp mã bị khóa. Không cập nhật cột M hay dữ liệu phòng ban khác.
- Chưa thiết kế Prisma/database, chưa gọi AI Builder/Power Automate/SharePoint/Google Sheets/Entra ID.

## Cấu trúc frontend

- `src/app/`: shell, điều hướng và layout.
- `src/features/dashboard`, `upload`, `review`, `ledger`: từng màn hình.
- `src/features/reception`: types, model thuần, fixtures và provider giữ dữ liệu phiên.
- `src/shared/components`: UI dùng chung, dialog.
- `src/index.css`: style responsive và nhận diện theo Stitch.
- `public/demo/bien-ban-demo.pdf`: tài liệu thử hoàn toàn giả lập.
- `docs/design/stitch/`: HTML/PNG thiết kế tham chiếu, không được thực thi trong ứng dụng.

Chỉ tiếp tục Giai đoạn 3 khi người dùng xác nhận.
