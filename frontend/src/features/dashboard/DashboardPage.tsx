import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  FlaskConical,
  ClipboardCheck,
  Save,
  CircleAlert,
  FileText,
  Activity,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useReception } from "../reception/context";
import { formatDate, ledgerRows } from "../reception/model";
import { Badge, PageHeader, StatCard } from "../../shared/components/ui";

export function DashboardPage() {
  const { records, mode } = useReception();
  const rows = ledgerRows(records);
  const pending = records.filter((record) => record.status !== "draft");
  const missing = rows.filter((row) => !row.sample.quantity).length;
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 7;
    return {
      hour,
      count: rows.filter(
        (row) =>
          Number(
            new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              hourCycle: "h23",
              timeZone: "Asia/Bangkok",
            }).format(new Date(row.record.receivedAt)),
          ) === hour,
      ).length,
    };
  });
  const maximum = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <>
      <PageHeader
        eyebrow="HỆ THỐNG QUẢN LÝ TIẾP NHẬN MẪU"
        title="Tổng quan tiếp nhận mẫu"
        description="Theo dõi hồ sơ, kiểm tra biên bản và quản lý mẫu trong không gian làm việc."
      >
        <Link className="button primary" to="/upload">
          <Plus size={17} />
          Tiếp nhận mẫu mới
        </Link>
      </PageHeader>
      <div className="stats-grid">
        <StatCard
          label="TỔNG MẪU TIẾP NHẬN"
          value={rows.length}
          unit="mẫu"
          icon={<FlaskConical size={22} />}
          footer={
            <>
              <span className="text-green">Dữ liệu giả lập</span>
              <span>Từ {records.length} biên bản</span>
            </>
          }
        />
        <StatCard
          label="BIÊN BẢN CHỜ KIỂM TRA"
          value={pending.length}
          unit="hồ sơ"
          icon={<ClipboardCheck size={22} />}
          footer={
            <Link className="text-orange" to="/review">
              Mở không gian đối soát →
            </Link>
          }
        />
        <StatCard
          label="HỒ SƠ ĐÃ LƯU NHÁP"
          value={records.filter((record) => record.status === "draft").length}
          unit="hồ sơ"
          tone="green"
          icon={<Save size={22} />}
          footer={
            <>
              <span className="text-green">
                {mode === "api" ? "Lưu PostgreSQL" : "Lưu trong phiên demo"}
              </span>
              <span>Chưa xác nhận</span>
            </>
          }
        />
        <StatCard
          label="MẪU CẦN BỔ SUNG"
          value={missing}
          unit="mẫu"
          tone="red"
          icon={<CircleAlert size={22} />}
          footer={
            <>
              <span className="text-red">Số lượng còn trống</span>
              <span>Cần kiểm tra PDF</span>
            </>
          }
        />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Activity size={18} />
                  Hoạt động tiếp nhận mẫu
                </h2>
                <p>Số mẫu theo giờ tiếp nhận của các hồ sơ trong danh sách</p>
              </div>
              <span className="small-chip">UTC+7 · Giờ tiếp nhận</span>
            </div>
            <div
              className="chart"
              role="img"
              aria-label={`Số mẫu theo giờ: ${buckets.map((bucket) => `${bucket.hour} giờ: ${bucket.count} mẫu`).join(", ")}`}
            >
              <div className="chart-grid">
                <span />
                <span />
                <span />
                <span />
              </div>
              {buckets.map((bucket) => (
                <div className="chart-column" key={bucket.hour}>
                  <span className="chart-value">{bucket.count}</span>
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max(2, (bucket.count / maximum) * 140)}px`,
                    }}
                  />
                  <span className="chart-hour">
                    {String(bucket.hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <i />
              Mẫu tiếp nhận <span>Biểu đồ cập nhật theo dữ liệu hồ sơ</span>
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <FileText size={18} />
                  Biên bản tiếp nhận gần đây
                </h2>
                <p>Mở một hồ sơ để kiểm tra PDF và dữ liệu nhận dạng</p>
              </div>
              <Link className="text-link" to="/ledger">
                Xem sổ nhận mẫu <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>HỒ SƠ DEMO</th>
                    <th>KHÁCH HÀNG / ĐƠN VỊ</th>
                    <th>SỐ MẪU</th>
                    <th>TRẠNG THÁI</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr key={record.id}>
                      <td>
                        <Link className="record-id" to={`/review/${record.id}`}>
                          {record.reference ?? record.id}
                        </Link>
                        <small>{formatDate(record.receivedAt, true)}</small>
                      </td>
                      <td>
                        <strong>
                          {record.edited.customer || "Chưa nhập khách hàng"}
                        </strong>
                        <small>{record.fileName}</small>
                      </td>
                      <td>{record.edited.samples.length}</td>
                      <td>
                        <Badge status={record.status} />
                      </td>
                      <td>
                        <Link
                          className="table-open"
                          to={`/review/${record.id}`}
                          aria-label={`Kiểm tra ${record.id}`}
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="panel queue-panel">
            <div className="panel-heading">
              <h2>
                <ClipboardCheck size={18} />
                Hàng đợi kiểm tra
              </h2>
              <span className="count-pill">{pending.length}</span>
            </div>
            {pending.length ? (
              pending.slice(0, 3).map((record) => (
                <Link
                  key={record.id}
                  to={`/review/${record.id}`}
                  className="queue-item"
                >
                  <span className="file-icon">
                    <FileText size={23} />
                  </span>
                  <div>
                    <strong>{record.reference ?? record.id}</strong>
                    <p>{record.edited.customer || "PDF được chọn từ máy"}</p>
                    <Badge status={record.status} />
                  </div>
                  <ArrowRight size={15} />
                </Link>
              ))
            ) : (
              <p className="muted">Các hồ sơ đã được lưu nháp.</p>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <ShieldCheck size={18} />
                Phạm vi bản demo
              </h2>
            </div>
            <div className="scope-row">
              <span className="status-dot green" />
              <span>Giao diện & dữ liệu mẫu</span>
              <b>Sẵn sàng</b>
            </div>
            <div className="scope-row">
              <span className="status-dot gray" />
              <span>AI Builder / SharePoint</span>
              <small>Chưa kết nối</small>
            </div>
            <div className="scope-row">
              <span className="status-dot gray" />
              <span>Google Sheets</span>
              <small>Chưa kết nối</small>
            </div>
          </section>
          <section className="workflow-card">
            <div className="workflow-icon">
              <FlaskConical size={25} />
            </div>
            <h2>Mỗi mẫu, một dòng sổ.</h2>
            <p>
              Kiểm tra từng mẫu trong biên bản trước khi đưa dữ liệu vào quy
              trình chính thức.
            </p>
            <ol>
              <li>
                <Check size={14} />
                Tiếp nhận PDF
              </li>
              <li>
                <Check size={14} />
                Đối soát & chỉnh sửa
              </li>
              <li>
                <Save size={14} />
                Lưu hồ sơ nháp
              </li>
            </ol>
            <Link to="/upload">
              Thử quy trình <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
