# Kiến trúc dự kiến và các quyết định chưa xác minh

Giai đoạn 1–3 đã hiện thực: giao diện theo Stitch, PostgreSQL/Prisma, API hồ sơ/PDF/bản nháp,
và lịch sử phiên bản. Xem `phase-3.md`, `database.md`, `api.md`.
Nội dung tích hợp dưới đây vẫn là định hướng, chưa gọi dịch vụ ngoài.

Frontend tổ chức theo feature; backend tổ chức theo module nghiệp vụ.
Adapter bên ngoài nằm trong integrations, AI Integration tách riêng.
PostgreSQL và Prisma đã triển khai ở Giai đoạn 3; storage cục bộ được tách khỏi module nghiệp vụ.

Luồng dự kiến: upload PDF → lưu hồ sơ/PDF gốc → SharePoint → Power Automate gọi
Microsoft AI Builder → callback có xác thực → bản nháp → nhân viên kiểm tra,
chỉnh sửa và xác nhận → cấp mã theo quy tắc đã xác minh → Google Sheets thử nghiệm.
Một PDF có nhiều mẫu; mỗi mẫu tương ứng một dòng trong sổ.

## Nguyên tắc cần giữ khi triển khai sau

- AI không tự xác nhận hồ sơ và không suy đoán trường không đọc được.
- Lưu riêng PDF gốc, dữ liệu OCR gốc và dữ liệu nhân viên chỉnh sửa.
- Không dùng dữ liệu thật để thử nghiệm khi chưa được cho phép.
- Không dùng Gemini API hoặc Azure AI Document Intelligence trong phiên bản đầu.
- Không ghi đè dữ liệu phòng ban khác; mapping Google Sheets phải theo cấu trúc từng tháng.
- Chưa cho phép cập nhật cột M (thông tin PTN/PQT) trước khi xác minh chủ sở hữu và quyền cập nhật.
- Chưa triển khai quy tắc Số phiếu KQ khi khách hàng gửi nhiều đợt trong ngày trước khi được xác minh.
- Các quy tắc cấp mã mẫu phải được xác minh trước khi lập trình.
- Callback phải có xác thực và cơ chế chống xử lý lặp khi thiết kế Giai đoạn 4.
- Authentication Microsoft Entra ID và phân quyền triển khai ở giai đoạn sau.
