import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  BookOpen,
  X,
} from "lucide-react";
import { useReception } from "../reception/context";
import {
  formatDate,
  ledgerRows,
  receptionMonth,
  toDemoCsv,
} from "../reception/model";
import { Badge, EmptyState, PageHeader } from "../../shared/components/ui";

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}
export function LedgerPage() {
  const { records } = useReception();
  const [query, setQuery] = useState("");
  const [matrix, setMatrix] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const rows = ledgerRows(records);
  const filtered = rows.filter(({ record, sample, temporaryId }) => {
    const text = normalized(
      `${temporaryId} ${record.edited.customer} ${sample.name} ${sample.location} ${record.fileName}`,
    );
    return (
      text.includes(normalized(query)) &&
      (!matrix || sample.matrix === matrix) &&
      (!status || record.status === status) &&
      (!month || receptionMonth(record.receivedAt) === month)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const matrices = Array.from(
    new Set(rows.map((row) => row.sample.matrix).filter(Boolean)),
  );
  function clear() {
    setQuery("");
    setMatrix("");
    setStatus("");
    setMonth("");
    setPage(1);
  }
  function exportCsv() {
    const csv = toDemoCsv(filtered);
    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "BD-Lab-so-nhan-mau-DEMO.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeader
        eyebrow="SỔ TIẾP NHẬN / DANH SÁCH HỒ SƠ"
        title="Sổ nhận mẫu phòng thí nghiệm"
        description="Một mẫu tương ứng một dòng. Dữ liệu hiển thị từ bản nháp đã lưu của từng hồ sơ."
      >
        <button
          className="button"
          disabled={!filtered.length}
          onClick={exportCsv}
        >
          <Download size={16} />
          Xuất CSV demo
        </button>
        <Link className="button primary" to="/upload">
          <Plus size={17} />
          Nhận mẫu mới
        </Link>
      </PageHeader>
      <div className="ledger-summary">
        <BookOpen size={21} />
        <div>
          <strong>{rows.length} mẫu</strong>
          <span>từ {records.length} biên bản trong danh sách</span>
        </div>
        <span className="summary-separator" />
        <div>
          <strong>
            {records.filter((record) => record.status === "draft").length} hồ sơ
            nháp
          </strong>
          <span>Chưa cấp mã mẫu / Số phiếu KQ</span>
        </div>
        <span className="small-chip">Google Sheets chưa kết nối</span>
      </div>
      <section className="panel ledger-panel">
        <div className="ledger-filters">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Tìm mẫu trong sổ"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm ID tạm, tên mẫu, khách hàng…"
            />
            {query && (
              <button
                className="icon-button"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          <span className="filter-icon">
            <SlidersHorizontal size={17} />
            Lọc
          </span>
          <label className="filter-field">
            Loại mẫu
            <select
              aria-label="Loại mẫu"
              value={matrix}
              onChange={(event) => {
                setMatrix(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại mẫu</option>
              {matrices.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Trạng thái
            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ kiểm tra</option>
              <option value="reviewing">Đang kiểm tra</option>
              <option value="draft">Đã lưu nháp</option>
            </select>
          </label>
          <label className="filter-field">
            Tháng tiếp nhận
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setPage(1);
              }}
            />
          </label>
          {(query || matrix || status || month) && (
            <button className="text-link" onClick={clear}>
              Xóa bộ lọc
            </button>
          )}
        </div>
        {!filtered.length ? (
          <EmptyState
            title="Không có mẫu phù hợp"
            description="Thử đổi từ khóa hoặc xóa bộ lọc. Hồ sơ chưa nhập mẫu sẽ chưa có dòng trong sổ."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>ID TẠM / HỒ SƠ</th>
                    <th>MẪU / VỊ TRÍ</th>
                    <th>KHÁCH HÀNG</th>
                    <th>LOẠI MẪU</th>
                    <th>SỐ LƯỢNG</th>
                    <th>TRẠNG THÁI</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visible.map(({ record, sample, temporaryId }, index) => (
                    <tr key={`${record.id}-${sample.id}`}>
                      <td>
                        {String(
                          (currentPage - 1) * pageSize + index + 1,
                        ).padStart(2, "0")}
                      </td>
                      <td>
                        <Link className="record-id" to={`/review/${record.id}`}>
                          {temporaryId}
                        </Link>
                        <small>{formatDate(record.receivedAt)}</small>
                      </td>
                      <td>
                        <strong>{sample.name || "Chưa nhập tên mẫu"}</strong>
                        <small>{sample.location || "Chưa nhập vị trí"}</small>
                      </td>
                      <td>
                        {record.edited.customer || "Chưa nhập khách hàng"}
                      </td>
                      <td>
                        <span className="matrix-tag">
                          {sample.matrix || "Chưa xác định"}
                        </span>
                      </td>
                      <td>
                        {sample.quantity || (
                          <span className="text-orange">Cần bổ sung</span>
                        )}
                      </td>
                      <td>
                        <Badge status={record.status} />
                      </td>
                      <td>
                        <Link
                          className="table-open"
                          to={`/review/${record.id}`}
                          aria-label={`Xem mẫu ${temporaryId}`}
                        >
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Hiển thị {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} /{" "}
                {filtered.length} mẫu
              </span>
              <div className="pagination-controls">
                <button
                  className="icon-button"
                  aria-label="Trang trước"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Trang {currentPage} / {pageCount}
                </span>
                <button
                  className="icon-button"
                  aria-label="Trang sau"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <label>
                Số dòng
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  <option>5</option>
                  <option>10</option>
                  <option>25</option>
                </select>
              </label>
            </div>
          </>
        )}
      </section>
      <div className="ledger-footnote">
        <span className="status-dot orange" />
        Tham chiếu HS và ID DEMO chỉ để nhận diện hồ sơ; chưa phải mã mẫu hoặc
        Số phiếu KQ. Quy tắc cấp mã sẽ được xác minh ở giai đoạn sau.
      </div>
    </>
  );
}
