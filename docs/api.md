# REST API BD Lab - Giai đoạn 3

Base URL: http://localhost:3000/api. Swagger: http://localhost:3000/api/docs.
OpenAPI snapshot: [openapi.json](openapi.json). Các endpoint hiện dùng local development, chưa có login.

| Method | Path | Chức năng |
|---|---|---|
| GET | /health | Trạng thái tiến trình |
| GET | /health/ready | Kiểm tra PostgreSQL |
| GET | /reception-records | Danh sách; optional query search (khách hàng/tên mẫu), status |
| POST | /reception-records | Multipart file PDF, tạo hồ sơ và bản nháp trống |
| POST | /reception-records/demo | Tạo hồ sơ fixture; chỉ khi ENABLE_DEMO_FIXTURES=true và không production |
| GET | /reception-records/:id | Hồ sơ, mẫu, raw và edited |
| PATCH | /reception-records/:id/draft | Lưu nháp với version; thêm/sửa/xóa mẫu qua danh sách edited.samples |
| GET | /reception-records/:id/pdf | Byte PDF gốc, kiểm tra SHA-256 trước khi trả |
| GET | /reception-records/:id/history | Revision từ mới tới cũ |

Tham số :id là UUID, không phải tham chiếu HS hiển thị. Upload dùng field multipart `file`.
Danh sách hiện trả array đầy đủ; không nhận query page/pageSize.

## Lưu nháp

```json
{
  "version": 0,
  "edited": {
    "customer": "Đơn vị giả lập",
    "address": "",
    "contact": "",
    "collectedAt": "2026-10-12",
    "collector": "",
    "note": "",
    "samples": []
  }
}
```

Giữ nguyên id của mẫu đang có; tạo UUID mới khi thêm mẫu. Tối đa 100 mẫu/hồ sơ.
Ngày lấy mẫu là YYYY-MM-DD hợp lệ hoặc chuỗi trống. Trường chưa đọc được giữ trống.
Payload không được chứa raw/status/reference/pdfUrl hoặc trường ngoài DTO.
Version lấy từ lần đọc hồ sơ gần nhất; phản hồi lưu trả version mới.

## Mã phản hồi

- 200 đọc/lưu thành công; 201 tạo hồ sơ.
- 400 dữ liệu sai, UUID sai, file không phải PDF hoặc mẫu thuộc hồ sơ khác.
- 403 fixture bị tắt; 404 hồ sơ/PDF không tìm thấy.
- 409 version cũ/trùng ID: giữ bản đang chỉnh, đọc bản mới trước khi lưu lại.
- 413 PDF vượt 20 MB hoặc JSON vượt giới hạn.
- 503 database/storage không sẵn sàng hoặc SHA-256 PDF không khớp.

Không có API xác nhận, cấp mã, xóa dữ liệu gốc hoặc đồng bộ dịch vụ ngoài.
