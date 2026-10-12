import { describe, expect, it } from "vitest";
import {
  blankData,
  ledgerRows,
  MAX_PDF_SIZE,
  receptionMonth,
  saveDraft,
  toDemoCsv,
  validatePdf,
  validatePdfMeta,
} from "./model";
import { createDemoRecord } from "./mock-data";

describe("bản nháp và dữ liệu gốc", () => {
  it("giữ trường OCR không đọc được trống và lưu chỉnh sửa riêng", () => {
    const record = createDemoRecord();
    const edited = structuredClone(record.edited);
    expect(record.raw.samples[1].quantity).toBe("");
    edited.samples[1].quantity = "2 chai";
    edited.customer = "Đơn vị đã sửa";
    const saved = saveDraft(record, edited);
    expect(saved.raw).toEqual(record.raw);
    expect(saved.raw.samples[1].quantity).toBe("");
    expect(saved.edited.samples[1].quantity).toBe("2 chai");
    expect(saved.status).toBe("draft");
    expect(record.status).toBe("pending");
    edited.samples[1].quantity = "Thay đổi sau lưu";
    expect(saved.edited.samples[1].quantity).toBe("2 chai");
  });
  it("một PDF nhiều mẫu tạo đúng từng dòng và cập nhật sau xóa mẫu", () => {
    const record = createDemoRecord();
    expect(ledgerRows([record])).toHaveLength(3);
    const data = structuredClone(record.edited);
    data.samples.splice(1, 1);
    const saved = saveDraft(record, data);
    expect(ledgerRows([saved])).toHaveLength(2);
    expect(saved.raw.samples).toHaveLength(3);
    expect(ledgerRows([saved])[0].temporaryId).toMatch(/^DEMO-/);
  });
  it("PDF người dùng bắt đầu trống, không tự điền OCR giả lập", () => {
    const data = blankData();
    expect(data.samples).toEqual([]);
    expect(data.customer).toBe("");
    expect(data.collectedAt).toBe("");
  });
  it("CSV giữ ký tự và chặn nội dung ô bắt đầu bằng công thức", () => {
    const record = createDemoRecord();
    record.edited.customer = "=SUM(1,2)";
    record.edited.samples[0].name = 'Mẫu "Demo", nước';
    const csv = toDemoCsv(ledgerRows([record]));
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain('"Mẫu ""Demo"", nước"');
  });
  it("lọc tháng theo giờ Việt Nam tại thời điểm giao tháng", () => {
    expect(receptionMonth("2026-09-30T18:00:00Z")).toBe("2026-10");
  });
});
describe("kiểm tra PDF cục bộ", () => {
  it("chặn sai định dạng, MIME, tệp trống và quá 20 MB", () => {
    expect(
      validatePdfMeta({ name: "x.txt", type: "", size: 100 }),
    ).not.toBeNull();
    expect(
      validatePdfMeta({ name: "x.pdf", type: "text/plain", size: 100 }),
    ).not.toBeNull();
    expect(
      validatePdfMeta({ name: "x.pdf", type: "application/pdf", size: 0 }),
    ).not.toBeNull();
    expect(
      validatePdfMeta({
        name: "x.pdf",
        type: "application/pdf",
        size: MAX_PDF_SIZE + 1,
      }),
    ).not.toBeNull();
    expect(
      validatePdfMeta({ name: "x.PDF", type: "", size: MAX_PDF_SIZE }),
    ).toBeNull();
  });
  it("chặn file đổi đuôi thành PDF khi không có chữ ký PDF", async () => {
    expect(
      await validatePdf(
        new File(["not a pdf"], "fake.pdf", { type: "application/pdf" }),
      ),
    ).not.toBeNull();
    expect(
      await validatePdf(
        new File(["%PDF-1.7\nfixture"], "demo.pdf", {
          type: "application/pdf",
        }),
      ),
    ).toBeNull();
  });
});
