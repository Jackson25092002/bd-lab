import type { ExtractedData, ReceptionRecord } from "./types";

export const STATUS_LABELS = {
  pending: "Chờ kiểm tra",
  reviewing: "Đang kiểm tra",
  draft: "Đã lưu nháp",
};
export const MAX_PDF_SIZE = 20 * 1024 * 1024;
export function blankData(): ExtractedData {
  return {
    customer: "",
    address: "",
    contact: "",
    collectedAt: "",
    collector: "",
    note: "",
    samples: [],
  };
}
export function saveDraft(
  record: ReceptionRecord,
  data: ExtractedData,
): ReceptionRecord {
  return {
    ...record,
    edited: structuredClone(data),
    status: "draft",
    savedAt: new Date().toISOString(),
  };
}
export function validatePdfMeta(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== "application/pdf")
  )
    return "Vui lòng chọn tệp định dạng PDF.";
  if (file.size === 0) return "Tệp đang trống. Vui lòng chọn một PDF khác.";
  if (file.size > MAX_PDF_SIZE) return "PDF vượt quá giới hạn 20 MB.";
  return null;
}
export async function validatePdf(file: File): Promise<string | null> {
  const error = validatePdfMeta(file);
  if (error) return error;
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...bytes) === "%PDF-"
    ? null
    : "Nội dung tệp không có chữ ký PDF hợp lệ.";
}
export function ledgerRows(records: ReceptionRecord[]) {
  return records.flatMap((record) =>
    record.edited.samples.map((sample, index) => ({
      record,
      sample,
      temporaryId: `${record.reference ?? record.id}/${String(index + 1).padStart(2, "0")}`,
    })),
  );
}
export function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}
export function receptionMonth(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
}
export function toDemoCsv(rows: ReturnType<typeof ledgerRows>) {
  const cell = (value: string) =>
    `"${(/^\s*[=+@-]/.test(value) || /^[\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
  return [
    [
      "Tham chiếu nội bộ (chưa cấp mã mẫu)",
      "Khách hàng",
      "Tên mẫu",
      "Loại mẫu",
      "Vị trí",
      "Số lượng",
      "Chỉ tiêu",
      "Trạng thái",
    ].join(","),
    ...rows.map(({ record, sample, temporaryId }) =>
      [
        temporaryId,
        record.edited.customer,
        sample.name,
        sample.matrix,
        sample.location,
        sample.quantity,
        sample.tests,
        STATUS_LABELS[record.status],
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\r\n");
}
