"""Generate the fictional PDF fixture. No client or production data is used."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tmp' / 'python'))
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
import pymupdf

root = Path(__file__).resolve().parents[1]
output = root / 'frontend/public/demo/bien-ban-demo.pdf'
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold', 'C:/Windows/Fonts/arialbd.ttf'))
c = canvas.Canvas(str(output), pagesize=A4)
c.setTitle('BD Lab - Biên bản giả lập - Không dùng cho nghiệp vụ')
c.setAuthor('BD Lab demo')
w, h = A4

def text(x, y, value, size=10, bold=False, color='#334155'):
    c.setFillColor(HexColor(color))
    c.setFont('ArialBold' if bold else 'Arial', size)
    c.drawString(x, y, value)

c.setFillColor(HexColor('#fff2e6')); c.rect(36, h-75, w-72, 38, fill=1, stroke=0)
text(48, h-61, 'DEMO - DỮ LIỆU GIẢ LẬP - KHÔNG DÙNG CHO NGHIỆP VỤ', 10, True, '#c46220')
text(36, h-111, 'BD LAB / CÔNG TY BIỂN ĐỨC', 11, True)
text(36, h-145, 'BIÊN BẢN LẤY MẪU THỬ NGHIỆM', 17, True)
text(36, h-168, 'Tài liệu mẫu để kiểm tra giao diện tiếp nhận và đối soát dữ liệu.', 10)
for i, line in enumerate([
    'Khách hàng: Công ty Môi trường Minh An (giả lập)',
    'Địa chỉ: Khu công nghiệp Demo, Thành phố mô phỏng',
    'Người liên hệ: Người liên hệ thử nghiệm',
    'Ngày lấy mẫu: 12/10/2026',
    'Người lấy mẫu: Nhân viên lấy mẫu Demo',
]): text(36, h-210-i*23, line)

text(36, h-345, 'DANH SÁCH MẪU', 11, True)
samples = [
 ('01', 'Nước thải đầu vào', 'Bể thu gom A', '2 chai x 500 ml', 'pH, COD, BOD5, TSS'),
 ('02', 'Nước thải sau xử lý', 'Điểm xả B', '[KHÔNG ĐỌC ĐƯỢC]', 'pH, COD, TSS'),
 ('03', 'Nước mặt khu vực C', 'Điểm quan trắc C', '1 chai x 1.000 ml', 'pH, DO, TSS'),
]
for i, (index, name, location, quantity, tests) in enumerate(samples):
    y = h-365-i*100
    c.setFillColor(HexColor('#f7f9fc')); c.rect(36, y-81, w-72, 85, fill=1, stroke=0)
    text(48, y-15, f'Mẫu {index}: {name}', 11, True)
    text(48, y-36, f'Vị trí: {location}')
    text(48, y-55, f'Số lượng: {quantity}', 10, False, '#b76928' if i==1 else '#334155')
    text(48, y-73, f'Chỉ tiêu: {tests}')

text(36, 135, 'Ghi chú: Số lượng mẫu 02 được cố ý làm thiếu để thử đối soát.', 9)
text(36, 115, 'Không suy đoán trường không đọc được. Không có chữ ký xác nhận.', 9)
c.setStrokeColor(HexColor('#e2e8f0')); c.line(36, 70, w-36, 70)
text(36, 52, 'BẢN GIẢ LẬP / Chỉ phục vụ phát triển giao diện', 9, color='#94a3b8')
text(w-95, 52, 'Trang 1 / 1', 9, color='#94a3b8')
c.save()
doc = pymupdf.open(output)
assert len(doc) == 1
assert 'KHÔNG ĐỌC ĐƯỢC' in doc[0].get_text()
doc[0].get_pixmap(matrix=pymupdf.Matrix(1.5,1.5)).save(root / 'tmp/pdfs/bien-ban-demo.png')
print(f'Created {output.name}: {output.stat().st_size} bytes, 1 page')
