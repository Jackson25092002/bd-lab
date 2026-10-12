import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Check,
  LoaderCircle,
  CircleAlert,
  Download,
} from "lucide-react";
import { PageHeader } from "../../shared/components/ui";
import { useReception } from "../reception/context";
import { validatePdf } from "../reception/model";

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef(0);
  const { receivePdf, createDemo, mode, loading } = useReception();
  const navigate = useNavigate();
  useEffect(
    () => () => {
      selection.current++;
    },
    [],
  );
  async function choose(files: FileList | null) {
    if (!files?.length) return;
    const requestId = ++selection.current;
    setError("");
    setFile(null);
    setDemo(false);
    setValidating(true);
    if (files.length !== 1) {
      setError("Mỗi lần chỉ chọn một PDF. Một PDF có thể chứa nhiều mẫu.");
      setValidating(false);
      return;
    }
    try {
      const issue = await validatePdf(files[0]);
      if (requestId !== selection.current) return;
      if (issue) setError(issue);
      else setFile(files[0]);
    } catch {
      if (requestId === selection.current)
        setError("Không đọc được tệp. Vui lòng chọn lại PDF.");
    } finally {
      if (requestId === selection.current) setValidating(false);
    }
  }
  function useDemo() {
    selection.current++;
    setValidating(false);
    setFile(null);
    setDemo(true);
    setError("");
  }
  async function proceed() {
    if (busy || loading || validating || (!file && !demo)) return;
    const operation = selection.current;
    setBusy(true);
    setError("");
    try {
      const record = demo ? await createDemo() : await receivePdf(file!);
      if (operation === selection.current) navigate(`/review/${record.id}`);
    } catch (issue) {
      if (operation === selection.current)
        setError(
          issue instanceof Error ? issue.message : "Không thể tiếp nhận PDF.",
        );
    } finally {
      if (operation === selection.current) setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="TIẾP NHẬN / BIÊN BẢN LẤY MẪU"
        title="Tiếp nhận biên bản mới"
        description={
          mode === "api"
            ? "Lưu PDF gốc vào backend cục bộ và nhập dữ liệu hồ sơ. Chỉ dùng tài liệu thử nghiệm."
            : "Chọn PDF để xem trên máy, hoặc dùng biên bản demo để thử luồng nhận dạng."
        }
      />
      <div className="stepper">
        <div className="active">
          <b>1</b>
          <span>
            Chọn biên bản<small>PDF gốc / tệp demo</small>
          </span>
        </div>
        <i />
        <div>
          <b>2</b>
          <span>
            Kiểm tra dữ liệu<small>Nhận dạng giả lập</small>
          </span>
        </div>
        <i />
        <div>
          <b>3</b>
          <span>
            Lưu hồ sơ nháp<small>Chưa xác nhận chính thức</small>
          </span>
        </div>
      </div>
      <div className="upload-columns">
        <div>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <UploadCloud size={19} />
                Tải lên biên bản lấy mẫu
              </h2>
              <span className="small-chip">PDF · Tối đa 20 MB</span>
            </div>
            <div
              className={`dropzone ${dragging ? "dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!busy) void choose(event.dataTransfer.files);
              }}
            >
              <span className="upload-icon">
                <UploadCloud size={34} />
              </span>
              <h3>Kéo thả biên bản PDF vào đây</h3>
              <p>Hoặc chọn một tệp từ máy tính của bạn</p>
              <button
                className="button primary"
                disabled={busy || validating}
                onClick={() => input.current?.click()}
              >
                <UploadCloud size={17} />
                Chọn tệp PDF
              </button>
              <small>
                {mode === "api"
                  ? "PDF lưu ở backend cục bộ · Chưa gửi SharePoint hoặc AI"
                  : "Tệp chỉ được xem cục bộ trong phiên demo"}
              </small>
              <input
                ref={input}
                hidden
                type="file"
                accept=".pdf,application/pdf"
                aria-label="Chọn tệp PDF"
                onChange={(event) => {
                  void choose(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>
            {error && (
              <div className="notice error" role="alert">
                <CircleAlert size={18} />
                {error}
              </div>
            )}
            {validating && (
              <p role="status" className="inline-message">
                <LoaderCircle size={17} className="spin" />
                Đang kiểm tra tệp…
              </p>
            )}
            {(file || demo) && (
              <div className="selected-file">
                <span className="file-icon">
                  <FileText size={25} />
                </span>
                <div>
                  <strong>{file?.name ?? "BB_lay_mau_DEMO.pdf"}</strong>
                  <small>
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB · PDF cục bộ`
                      : "Biên bản giả lập · 3 mẫu · Không chứa dữ liệu thật"}
                  </small>
                </div>
                <span className="text-green">
                  <Check size={18} />
                </span>
                <button
                  disabled={busy}
                  className="icon-button"
                  aria-label="Bỏ tệp đã chọn"
                  onClick={() => {
                    selection.current++;
                    setFile(null);
                    setDemo(false);
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="upload-actions">
              <span>
                {demo
                  ? "Đã sẵn sàng mô phỏng nhận dạng"
                  : file
                    ? "Sẵn sàng xem PDF và nhập dữ liệu"
                    : "Chọn một PDF để tiếp tục"}
              </span>
              <button
                className="button primary"
                disabled={busy || loading || validating || (!file && !demo)}
                onClick={proceed}
              >
                {busy ? (
                  <>
                    <LoaderCircle size={17} className="spin" />
                    {demo ? "Đang mô phỏng…" : "Đang mở PDF…"}
                  </>
                ) : (
                  <>
                    {demo
                      ? "Mô phỏng nhận dạng & kiểm tra"
                      : "Mở PDF & nhập dữ liệu"}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </section>
          <section className="demo-file-card">
            <div className="demo-file-icon">
              <Sparkles size={25} />
            </div>
            <div>
              <span className="eyebrow">BẮT ĐẦU VỚI DỮ LIỆU GIẢ LẬP</span>
              <h2>Thử trọn luồng với một biên bản mẫu</h2>
              <p>
                Ba mẫu trong một PDF, có một trường chưa đọc được để bạn thực
                hành đối soát.
              </p>
              <div className="demo-file-actions">
                <button className="button" disabled={busy} onClick={useDemo}>
                  <Sparkles size={16} />
                  Sử dụng biên bản demo
                </button>
                <a
                  className="text-link"
                  href="/demo/bien-ban-demo.pdf"
                  download
                >
                  <Download size={15} />
                  Tải PDF demo
                </a>
              </div>
            </div>
          </section>
        </div>
        <aside>
          <section className="panel guide-panel">
            <span className="guide-icon">
              <ShieldCheck size={25} />
            </span>
            <h2>
              Giữ dữ liệu gốc.
              <br />
              Kiểm tra trước khi sử dụng.
            </h2>
            <p>
              Bản demo giúp bạn đánh giá giao diện mà không cần kết nối dịch vụ
              bên ngoài.
            </p>
            <ul>
              <li>
                <Check size={17} />
                <div>
                  <strong>PDF do bạn chọn</strong>
                  <p>
                    {mode === "api"
                      ? "PDF lưu trên backend cục bộ. Các trường nhận dạng bắt đầu trống."
                      : "Chỉ hiển thị trên máy. Các trường nhận dạng bắt đầu trống."}
                  </p>
                </div>
              </li>
              <li>
                <Check size={17} />
                <div>
                  <strong>Nhận dạng có nhãn giả lập</strong>
                  <p>Chỉ biên bản demo có dữ liệu OCR mẫu.</p>
                </div>
              </li>
              <li>
                <Check size={17} />
                <div>
                  <strong>Nhân viên tự kiểm tra</strong>
                  <p>
                    Không tự điền trường không đọc được, không tự xác nhận hồ
                    sơ.
                  </p>
                </div>
              </li>
            </ul>
            <div className="notice info">
              {mode === "api"
                ? "PDF lưu ở backend và nháp lưu PostgreSQL. Chưa kết nối SharePoint hoặc AI Builder."
                : "Chưa lưu PDF lên backend hay SharePoint. Nháp chỉ giữ trong phiên trình duyệt."}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
