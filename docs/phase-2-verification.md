# Kết quả kiểm tra Giai đoạn 2

Ngày: 12/10/2026. Môi trường: Windows, Node.js 24.18.0, npm 11.16.0.

## Kiểm tra tự động

- Build TypeScript và Vite: đạt.
- Lint frontend: đạt, không có cảnh báo.
- 7 test frontend: đạt. Bao gồm giữ riêng OCR gốc/bản chỉnh sửa, một PDF nhiều dòng,
  thêm/xóa ở bản nháp, dữ liệu đầu vào trống, kiểm tra PDF, CSV và múi giờ khi giao tháng.
- npm audit sau cài dependency: 0 vulnerabilities.
- PDF demo được render thành PNG và kiểm tra: 1 trang, tiếng Việt đúng, không chồng lấn nội dung.

## Kiểm tra trình duyệt Chrome

- Dashboard và 3 màn hình nghiệp vụ hiển thị.
- Chọn biên bản demo, mô phỏng nhận dạng, chuyển sang đối soát: đạt.
- PDF demo hiển thị bằng trình đọc PDF tích hợp Chrome: đạt.
- Trường số lượng mẫu 2 trống; sau chỉnh sửa và lưu, dữ liệu gốc vẫn trống: đạt.
- Thêm rồi xóa mẫu; lưu bản nháp và trạng thái cập nhật: đạt.
- Rời hồ sơ khi chưa lưu mở dialog; Lưu & chuyển đưa dữ liệu đã sửa vào sổ: đạt.
- Tìm kiếm không dấu, lọc trạng thái, phân trang và không có kết quả: đạt.
- Khôi phục bộ dữ liệu ban đầu: đạt (3 hồ sơ, 9 dòng mẫu).
- Màn hình hẹp với viewport override 390 x 844 (vùng nội dung 375 px do scrollbar):
  tiếp nhận và đối soát xếp dọc; menu mobile hoạt động; sổ có bảng cuộn riêng,
  document không tràn ngang.
- Console không có error/warn tại lần kiểm tra cuối.
- Ảnh kiểm tra: `previews/dashboard.jpg`, `previews/ledger.jpg`, `previews/review.jpg`.

## Giới hạn kiểm tra

Tự động chọn PDF cục bộ qua file chooser chưa kiểm tra end-to-end vì extension ChatGPT
trong Chrome chưa cho phép file URLs. Không thay đổi quyền extension.
Nút chọn tệp đã mở chooser; logic kiểm tra tệp được kiểm tra bằng unit tests.
Người dùng có thể thử bằng PDF giả lập trong `frontend/public/demo/` qua thao tác chọn tệp thủ công.
Chưa kiểm tra trên Safari/Firefox hoặc thiết bị mobile thực.

Không dùng dữ liệu thật; không triển khai Giai đoạn 3–6.
