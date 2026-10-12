import type { ExtractedData, ReceptionRecord } from "./types";

export const demoData: ExtractedData = {
  customer: "Công ty Môi trường Minh An (giả lập)",
  address: "Khu công nghiệp Demo, Thành phố mô phỏng",
  contact: "Người liên hệ thử nghiệm",
  collectedAt: "2026-10-12",
  collector: "Nhân viên lấy mẫu Demo",
  note: "Biên bản giả lập. Trường số lượng mẫu 2 không đọc được; cần nhân viên kiểm tra.",
  samples: [
    {
      id: "sample-1",
      name: "Nước thải đầu vào",
      matrix: "Nước thải",
      location: "Bể thu gom A",
      quantity: "2 chai × 500 ml",
      tests: "pH, COD, BOD₅, TSS",
    },
    {
      id: "sample-2",
      name: "Nước thải sau xử lý",
      matrix: "Nước thải",
      location: "Điểm xả B",
      quantity: "",
      tests: "pH, COD, TSS",
      uncertain: true,
    },
    {
      id: "sample-3",
      name: "Nước mặt khu vực C",
      matrix: "Nước mặt",
      location: "Điểm quan trắc C",
      quantity: "1 chai × 1.000 ml",
      tests: "pH, DO, TSS",
    },
  ],
};
export function createDemoRecord(id = "DEMO-001"): ReceptionRecord {
  return {
    id,
    fileName: "BB_lay_mau_DEMO.pdf",
    fileSize: 48000,
    pdfUrl: "/demo/bien-ban-demo.pdf",
    demo: true,
    receivedAt: "2026-10-12T08:30:00+07:00",
    status: "pending",
    raw: structuredClone(demoData),
    edited: structuredClone(demoData),
  };
}
export function initialRecords(): ReceptionRecord[] {
  const first = createDemoRecord();
  const second = createDemoRecord("DEMO-002");
  second.status = "draft";
  second.receivedAt = "2026-10-12T09:15:00+07:00";
  second.savedAt = "2026-10-12T09:25:00+07:00";
  const third = createDemoRecord("DEMO-003");
  third.status = "reviewing";
  third.receivedAt = "2026-10-12T10:10:00+07:00";
  return [first, second, third];
}
