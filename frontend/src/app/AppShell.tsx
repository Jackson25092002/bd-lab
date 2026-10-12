import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileUp,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
  ChevronRight,
  Menu,
  X,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { useReception } from "../features/reception/context";
import { formatDate } from "../features/reception/model";
import { Dialog } from "../shared/components/Dialog";
const navigation = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/upload", label: "Tiếp nhận mẫu", icon: FileUp },
  { to: "/review", label: "Kiểm tra biên bản", icon: ClipboardCheck },
  { to: "/ledger", label: "Sổ nhận mẫu", icon: BookOpen },
];
export function AppShell() {
  const [open, setOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [today] = useState(() => formatDate(new Date().toISOString()));
  const { reset, mode, loading, error, reload } = useReception();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const active = navigation.find((item) =>
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.to),
  );
  return (
    <div className="app-shell">
      {open && (
        <button
          className="mobile-scrim"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <FlaskConical size={25} />
          </span>
          <span>
            <strong>
              BD <b>Lab</b>
            </strong>
            <small>BIỂN ĐỨC LABORATORY</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setOpen(false)}
          aria-label="Đóng menu"
        >
          <X size={20} />
        </button>
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={20} />
          <strong>
            Con người kiểm tra.
            <br />
            Dữ liệu được kiểm soát.
          </strong>
          <p>AI hỗ trợ nhận dạng. Nhân viên chịu trách nhiệm đối soát.</p>
        </div>
        <div className="sidebar-bottom">
          <span className="demo-dot" />
          <span>Môi trường giả lập</span>
          <small>v0.3</small>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Mở menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>BD Lab</span>
            <ChevronRight size={14} />
            <strong>{active?.label ?? "Trang không tồn tại"}</strong>
          </div>
          <div className="topbar-right">
            <span className="date-label">
              <CalendarDays size={16} />
              {today} <small>{mode === "mock" ? "Demo" : "Phát triển"}</small>
            </span>
            {mode === "mock" && (
              <button
                className="icon-button"
                title="Khôi phục dữ liệu demo"
                aria-label="Khôi phục dữ liệu demo"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw size={17} />
              </button>
            )}
            <div className="user-avatar">NM</div>
            <div className="user-info">
              <strong>Nhân viên nhận mẫu</strong>
              <span>Tài khoản demo</span>
            </div>
          </div>
        </header>
        <div className="demo-banner">
          <span className="demo-tag">DEMO</span>
          <span>
            {mode === "api"
              ? "Môi trường thử nghiệm · Hồ sơ và bản nháp lưu PostgreSQL · PDF lưu backend cục bộ · Chưa tích hợp AI"
              : "Dữ liệu giả lập · PDF xem cục bộ · Lưu nháp trong phiên, tải lại sẽ đặt lại"}
          </span>
        </div>
        {loading && (
          <div className="notice info" role="status">
            Đang tải hồ sơ từ PostgreSQL…
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button className="button compact" onClick={() => void reload()}>
              Thử kết nối lại
            </button>
          </div>
        )}
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          BD Lab · Công ty Biển Đức
          <span>
            Giai đoạn 3 /{" "}
            {mode === "api" ? "PostgreSQL & API" : "Giao diện mock"}
          </span>
        </footer>
      </div>
      {resetOpen && (
        <Dialog labelledBy="reset-title" onClose={() => setResetOpen(false)}>
          <h2 id="reset-title">Khôi phục dữ liệu demo?</h2>
          <p>
            Những hồ sơ và chỉnh sửa trong phiên này sẽ được thay bằng dữ liệu
            mẫu ban đầu.
          </p>
          <div className="modal-actions">
            <button className="button" onClick={() => setResetOpen(false)}>
              Giữ lại
            </button>
            <button
              className="button primary"
              onClick={() => {
                reset();
                setResetOpen(false);
              }}
            >
              Khôi phục
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
