import { randomUUID } from 'node:crypto';
import type { DraftDataDto } from './dto/save-draft.dto.js';

export function emptyData(): DraftDataDto {
  return {
    customer: '',
    address: '',
    contact: '',
    collectedAt: '',
    collector: '',
    note: '',
    samples: [],
  };
}
export function demoData(): DraftDataDto {
  return {
    customer: 'Công ty Môi trường Minh An (giả lập)',
    address: 'Khu công nghiệp Demo, Thành phố mô phỏng',
    contact: 'Người liên hệ thử nghiệm',
    collectedAt: '2026-10-12',
    collector: 'Nhân viên lấy mẫu Demo',
    note: 'Biên bản giả lập. Trường số lượng mẫu 2 không đọc được; cần nhân viên kiểm tra.',
    samples: [
      {
        id: randomUUID(),
        name: 'Nước thải đầu vào',
        matrix: 'Nước thải',
        location: 'Bể thu gom A',
        quantity: '2 chai × 500 ml',
        tests: 'pH, COD, BOD₅, TSS',
      },
      {
        id: randomUUID(),
        name: 'Nước thải sau xử lý',
        matrix: 'Nước thải',
        location: 'Điểm xả B',
        quantity: '',
        tests: 'pH, COD, TSS',
        uncertain: true,
      },
      {
        id: randomUUID(),
        name: 'Nước mặt khu vực C',
        matrix: 'Nước mặt',
        location: 'Điểm quan trắc C',
        quantity: '1 chai × 1.000 ml',
        tests: 'pH, DO, TSS',
      },
    ],
  };
}
