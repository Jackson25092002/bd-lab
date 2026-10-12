import { useEffect, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import {
  FileText,
  Save,
  Plus,
  Trash2,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  LockKeyhole,
  ChevronDown,
} from "lucide-react";
import { useReception } from "../reception/context";
import { formatDate } from "../reception/model";
import type {
  ExtractedData,
  ReceptionRecord,
  Sample,
} from "../reception/types";
import { Badge, EmptyState, PageHeader } from "../../shared/components/ui";
import { Dialog } from "../../shared/components/Dialog";
import { receptionApi } from "../reception/api";

export function ReviewPage() {
  const { records, revision, loading, error } = useReception();
  const { id } = useParams();
  const record = id ? records.find((item) => item.id === id) : records[0];
  if (loading) return <p className="muted">Đang tải hồ sơ…</p>;
  if (error)
    return (
      <p className="muted">
        Chưa tải được hồ sơ. Kiểm tra kết nối và nhấn “Thử kết nối lại”.
      </p>
    );
  if (!record)
    return (
      <EmptyState
        title="Chưa có hồ sơ hoặc không tìm thấy hồ sơ này"
        description="Chọn một PDF hoặc tạo hồ sơ thử nghiệm để bắt đầu."
      />
    );
  return <ReviewWorkspace key={`${record.id}:${revision}`} record={record} />;
}
function ReviewWorkspace({ record }: { record: ReceptionRecord }) {
  const { records, save, mode } = useReception();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [history, setHistory] = useState<Awaited<
    ReturnType<typeof receptionApi.history>
  > | null>(null);
  const [historyError, setHistoryError] = useState("");
  const navigate = useNavigate();
  const [data, setData] = useState<ExtractedData>(() =>
    structuredClone(record.edited),
  );
  const dirty = JSON.stringify(data) !== JSON.stringify(record.edited);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update<K extends keyof ExtractedData>(
    key: K,
    value: ExtractedData[K],
  ) {
    setData((current) => ({ ...current, [key]: value }));
  }
  function updateSample(id: string, key: keyof Sample, value: string) {
    setData((current) => ({
      ...current,
      samples: current.samples.map((sample) =>
        sample.id === id ? { ...sample, [key]: value } : sample,
      ),
    }));
  }
  async function saveChanges(proceed = false) {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await save(record.id, data);
      setHistory(null);
      if (proceed && blocker.state === "blocked") blocker.proceed();
    } catch (issue) {
      setSaveError(
        issue instanceof Error
          ? issue.message
          : "Không thể lưu. Bản đang sửa vẫn được giữ trên màn hình.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function loadHistory() {
    setHistoryError("");
    try {
      setHistory(await receptionApi.history(record.id));
    } catch (issue) {
      setHistoryError(
        issue instanceof Error ? issue.message : "Không tải được lịch sử.",
      );
    }
  }
  const missing = data.samples.filter(
    (sample) => !sample.quantity.trim(),
  ).length;
  return (
    <>
      <PageHeader
        eyebrow="ĐỐI SOÁT / PDF & DỮ LIỆU"
        title="Kiểm tra biên bản"
        description="Đối chiếu PDF gốc với dữ liệu bên phải. Chỉnh sửa thông tin và lưu bản nháp."
      >
        <Link className="button" to="/ledger">
          Xem sổ nhận mẫu
        </Link>
        <button
          className="button primary"
          disabled={saving}
          onClick={() => void saveChanges()}
        >
          <Save size={17} />
          {saving ? "Đang lưu…" : "Lưu bản nháp"}
        </button>
      </PageHeader>
      <div className="review-record-bar">
        <div className="record-selector">
          <FileText size={18} />
          <label htmlFor="record-select">Hồ sơ</label>
          <select
            id="record-select"
            value={record.id}
            onChange={(event) => navigate(`/review/${event.target.value}`)}
          >
            {records.map((item) => (
              <option key={item.id} value={item.id}>
                {item.reference ?? item.id} · {item.fileName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Badge status={record.status} />
          <span className="small-chip">{data.samples.length} mẫu</span>
          <span className={dirty ? "text-orange" : "muted"}>
            {dirty
              ? "Có thay đổi chưa lưu"
              : record.savedAt
                ? `Đã lưu ${formatDate(record.savedAt, true)}`
                : "Chưa chỉnh sửa"}
          </span>
        </div>
      </div>
      {saveError && (
        <div className="notice error" role="alert">
          {saveError} · Chỉnh sửa chưa lưu vẫn đang ở trên màn hình.
        </div>
      )}
      <div className="review-grid">
        <section className="pdf-panel">
          <div className="pdf-toolbar">
            <span>
              <FileText size={17} />
              <strong>PDF gốc</strong>
            </span>
            <a
              className="text-link"
              href={record.pdfUrl}
              target="_blank"
              rel="noreferrer"
            >
              Mở riêng <ExternalLink size={15} />
            </a>
          </div>
          <div className="pdf-file-name">{record.fileName}</div>
          <iframe
            title={`PDF gốc ${record.id}`}
            src={`${record.pdfUrl}#view=FitH`}
          />
          <div className="pdf-caption">
            <LockKeyhole size={15} />
            PDF gốc được giữ nguyên. Nếu trình duyệt không hiển thị PDF, chọn
            “Mở riêng”.
          </div>
        </section>
        <fieldset className="review-form" disabled={saving}>
          <div className={`notice ${record.demo ? "warning" : "info"}`}>
            <CircleAlert size={18} />
            <div>
              <strong>
                {record.demo
                  ? "Dữ liệu nhận dạng giả lập"
                  : "Chưa có dữ liệu nhận dạng"}
              </strong>
              <p>
                {record.demo
                  ? "Các trường bên dưới là dữ liệu mẫu. Thông tin không đọc được được để trống."
                  : "PDF này chưa được gửi tới AI. Hãy nhập thông tin khi đối chiếu tài liệu."}
              </p>
            </div>
          </div>
          {record.savedAt && !dirty && (
            <div className="notice success" role="status">
              {mode === "api"
                ? "Đã lưu bản nháp vào PostgreSQL. Dữ liệu gốc vẫn được giữ nguyên."
                : "Đã lưu bản nháp trong phiên demo. Dữ liệu gốc vẫn được giữ nguyên."}
            </div>
          )}
          <section className="panel form-section">
            <div className="panel-heading">
              <h2>
                <span className="section-letter">A</span>Thông tin khách hàng &
                biên bản
              </h2>
            </div>
            <div className="form-grid">
              <Field
                label="Khách hàng / đơn vị"
                value={data.customer}
                onChange={(value) => update("customer", value)}
                wide
                placeholder="Nhập đúng thông tin trên PDF"
              />
              <Field
                label="Địa chỉ"
                value={data.address}
                onChange={(value) => update("address", value)}
                wide
              />
              <Field
                label="Người liên hệ"
                value={data.contact}
                onChange={(value) => update("contact", value)}
              />
              <Field
                label="Ngày lấy mẫu"
                value={data.collectedAt}
                onChange={(value) => update("collectedAt", value)}
                type="date"
              />
              <Field
                label="Người lấy mẫu"
                value={data.collector}
                onChange={(value) => update("collector", value)}
                wide
              />
            </div>
          </section>
          <section className="panel form-section">
            <div className="panel-heading">
              <div>
                <h2>
                  <span className="section-letter">B</span>Danh sách mẫu
                </h2>
                <p>Mỗi mẫu tương ứng một dòng trong sổ nhận mẫu</p>
              </div>
              <button
                className="button compact"
                onClick={() =>
                  update("samples", [
                    ...data.samples,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      matrix: "",
                      location: "",
                      quantity: "",
                      tests: "",
                    },
                  ])
                }
              >
                <Plus size={15} />
                Thêm mẫu
              </button>
            </div>
            {!data.samples.length && (
              <p className="form-empty">
                Chưa có mẫu. Nhấn “Thêm mẫu” để nhập dữ liệu từ PDF.
              </p>
            )}
            <div className="sample-list">
              {data.samples.map((sample, index) => (
                <article
                  className={`sample-card ${!sample.quantity.trim() ? "needs-review" : ""}`}
                  key={sample.id}
                >
                  <header>
                    <strong>
                      <FlaskIcon />
                      Mẫu {String(index + 1).padStart(2, "0")}
                    </strong>
                    <span className="small-chip">ID tạm / chưa cấp mã</span>
                    <button
                      className="icon-button danger"
                      aria-label={`Xóa mẫu ${index + 1}`}
                      onClick={() =>
                        update(
                          "samples",
                          data.samples.filter((item) => item.id !== sample.id),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </header>
                  <div className="form-grid">
                    <Field
                      label={`Tên mẫu ${index + 1}`}
                      value={sample.name}
                      onChange={(value) =>
                        updateSample(sample.id, "name", value)
                      }
                      wide
                    />
                    <label>
                      Loại mẫu
                      <select
                        aria-label={`Loại mẫu ${index + 1}`}
                        value={sample.matrix}
                        onChange={(event) =>
                          updateSample(sample.id, "matrix", event.target.value)
                        }
                      >
                        <option value="">Chưa xác định</option>
                        {[
                          "Nước thải",
                          "Nước mặt",
                          "Nước ngầm",
                          "Không khí",
                          "Đất",
                          "Bùn",
                          "Khác",
                        ].map((matrix) => (
                          <option key={matrix}>{matrix}</option>
                        ))}
                        {sample.matrix &&
                          ![
                            "Nước thải",
                            "Nước mặt",
                            "Nước ngầm",
                            "Không khí",
                            "Đất",
                            "Bùn",
                            "Khác",
                          ].includes(sample.matrix) && (
                            <option>{sample.matrix}</option>
                          )}
                      </select>
                    </label>
                    <Field
                      label={`Số lượng mẫu ${index + 1}`}
                      value={sample.quantity}
                      onChange={(value) =>
                        updateSample(sample.id, "quantity", value)
                      }
                      placeholder="Chưa đọc được / chưa nhập"
                      warning={!sample.quantity.trim()}
                    />
                    <Field
                      label={`Vị trí lấy mẫu ${index + 1}`}
                      value={sample.location}
                      onChange={(value) =>
                        updateSample(sample.id, "location", value)
                      }
                      wide
                    />
                    <Field
                      label={`Chỉ tiêu mẫu ${index + 1}`}
                      value={sample.tests}
                      onChange={(value) =>
                        updateSample(sample.id, "tests", value)
                      }
                      wide
                    />
                  </div>
                  {!sample.quantity.trim() && (
                    <div className="field-warning">
                      <CircleAlert size={14} />
                      Số lượng còn trống. Kiểm tra PDF; không suy đoán dữ liệu.
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section className="panel form-section">
            <div className="panel-heading">
              <h2>
                <span className="section-letter">C</span>Ghi chú đối soát
              </h2>
            </div>
            <label>
              Ghi chú
              <textarea
                value={data.note}
                onChange={(event) => update("note", event.target.value)}
                rows={3}
              />
            </label>
            <details className="raw-data">
              <summary>
                <ClipboardCheck size={16} />
                Xem dữ liệu nhận dạng gốc <ChevronDown size={15} />
              </summary>
              <p>
                {record.demo
                  ? "Dữ liệu OCR mẫu trước chỉnh sửa, được giữ riêng."
                  : "Chưa chạy OCR; các trường gốc đều trống."}
              </p>
              <pre>{JSON.stringify(record.raw, null, 2)}</pre>
            </details>
          </section>
        </fieldset>
      </div>
      <div className="review-savebar">
        <div>
          <span className={`status-dot ${dirty ? "orange" : "green"}`} />
          <strong>
            {dirty
              ? "Có thay đổi chưa lưu"
              : mode === "api"
                ? `Bản nháp · Phiên bản ${record.version ?? 0}`
                : "Bản nháp trong phiên demo"}
          </strong>
          <small>
            {missing
              ? `${missing} mẫu còn thiếu số lượng`
              : "Kiểm tra thông tin trước khi lưu"}
          </small>
        </div>
        <div>
          <button className="button" disabled title="Triển khai ở Giai đoạn 5">
            <LockKeyhole size={16} />
            Xác nhận & cấp mã (GĐ5)
          </button>
          <button
            className="button primary"
            disabled={saving}
            onClick={() => void saveChanges()}
          >
            <Save size={16} />
            {saving ? "Đang lưu…" : "Lưu bản nháp"}
          </button>
        </div>
      </div>
      {blocker.state === "blocked" && (
        <Dialog labelledBy="discard-title" onClose={() => blocker.reset()}>
          <h2 id="discard-title">Rời hồ sơ khi chưa lưu?</h2>
          <p>
            Bạn có thay đổi chưa lưu. Có thể lưu nháp trước hoặc bỏ các thay đổi
            này.
          </p>
          <div className="modal-actions">
            {saveError && (
              <p className="notice error" role="alert">
                {saveError}
              </p>
            )}
            <button className="button" onClick={() => blocker.reset()}>
              Ở lại
            </button>
            <button className="button" onClick={() => blocker.proceed()}>
              Bỏ thay đổi
            </button>
            <button
              className="button primary"
              disabled={saving}
              onClick={() => void saveChanges(true)}
            >
              Lưu & chuyển
            </button>
          </div>
        </Dialog>
      )}
      {mode === "api" && (
        <section className="panel form-section history-panel">
          <div className="panel-heading">
            <h2>Lịch sử bản nháp</h2>
            <button
              className="button compact"
              onClick={() => void loadHistory()}
            >
              Tải lịch sử
            </button>
          </div>
          {historyError && (
            <p role="alert" className="text-red">
              {historyError}
            </p>
          )}
          {history?.map((item) => (
            <details className="raw-data" key={item.id}>
              <summary>
                Phiên bản {item.version} · {formatDate(item.createdAt, true)} ·{" "}
                {item.action}
              </summary>
              <pre>{JSON.stringify(item.snapshot, null, 2)}</pre>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
function Field({
  label,
  value,
  onChange,
  wide,
  type = "text",
  placeholder,
  warning,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  type?: string;
  placeholder?: string;
  warning?: boolean;
}) {
  return (
    <label
      className={`${wide ? "wide" : ""} ${warning ? "warning-field" : ""}`}
    >
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? "Chưa nhập"}
      />
    </label>
  );
}
function FlaskIcon() {
  return <FileText size={16} />;
}
