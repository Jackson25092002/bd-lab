import type { ReactNode } from "react";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../../features/reception/model";
import type { RecordStatus } from "../../features/reception/types";
export function Badge({ status }: { status: RecordStatus }) {
  return <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>;
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <FlaskConical size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      <Link className="button primary" to="/upload">
        Tiếp nhận mẫu <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function StatCard({
  label,
  value,
  unit,
  icon,
  footer,
  tone = "orange",
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  footer: ReactNode;
  tone?: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-head">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="stat-footer">{footer}</div>
    </article>
  );
}
