"use client";

import { useState } from "react";

export interface IApplication {
  _id: string;
  userId: string;
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  appliedDate?: string;
  jobUrl?: string;
  notes?: string;
  lastUpdated: string;
  createdAt: string;
}

interface ApplicationListProps {
  applications: IApplication[];
  onRefresh?: () => void;
}

const STATUS_OPTIONS: IApplication["status"][] = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  IApplication["status"],
  { bg: string; text: string; dot: string; cssClass: string }
> = {
  Applied: {
    bg: "#DBEAFE",
    text: "#1D4ED8",
    dot: "#3B82F6",
    cssClass: "status-applied",
  },
  Interview: {
    bg: "#FEF3C7",
    text: "#B45309",
    dot: "#F59E0B",
    cssClass: "status-interview",
  },
  Offer: {
    bg: "#D1FAE5",
    text: "#065F46",
    dot: "#10B981",
    cssClass: "status-offer",
  },
  Rejected: {
    bg: "#FEE2E2",
    text: "#991B1B",
    dot: "#EF4444",
    cssClass: "status-rejected",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function isStale(app: IApplication): boolean {
  if (app.status !== "Applied") return false;
  const diff = Date.now() - new Date(app.lastUpdated).getTime();
  return diff > 7 * 86400000;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApplicationList({
  applications,
  onRefresh,
}: ApplicationListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(
    id: string,
    newStatus: IApplication["status"]
  ) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to update status");
      } else {
        onRefresh?.();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id: string, company: string, role: string) {
    const confirmed = window.confirm(
      `Delete the application for "${role}" at "${company}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to delete application");
      } else {
        onRefresh?.();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (applications.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          textAlign: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "40px", lineHeight: 1 }}>📭</span>
        <p
          style={{
            margin: "8px 0 4px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          No applications yet
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>
          Add your first one to get started.
        </p>
      </div>
    );
  }

  // ── Table ────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
      }}
    >
      {error && (
        <div
          role="alert"
          style={{
            margin: "12px 16px 0",
            padding: "10px 14px",
            backgroundColor: "#FEE2E2",
            color: "#991B1B",
            borderRadius: "8px",
            border: "1px solid #FECACA",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F9FAFB",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <th scope="col" style={thStyle}>
                Company
              </th>
              <th scope="col" style={thStyle}>
                Role
              </th>
              <th scope="col" style={thStyle}>
                Status
              </th>
              <th scope="col" style={thStyle}>
                Applied Date
              </th>
              <th scope="col" style={thStyle}>
                Job URL
              </th>
              <th scope="col" style={{ ...thStyle, maxWidth: "180px" }}>
                Notes
              </th>
              <th scope="col" style={{ ...thStyle, textAlign: "right" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const stale = isStale(app);
              const cfg = STATUS_CONFIG[app.status];

              return (
                <tr
                  key={app._id}
                  style={{
                    borderBottom: "1px solid #F3F4F6",
                    borderLeft: stale
                      ? "3px solid #F59E0B"
                      : "3px solid transparent",
                    transition: "background 100ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "transparent";
                  }}
                >
                  {/* Company */}
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {app.company}
                    </span>
                  </td>

                  {/* Role */}
                  <td style={{ ...tdStyle, color: "#374151" }}>{app.role}</td>

                  {/* Status — badge + styled select for changing */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Visual badge */}
                      <span
                        className={`status-badge ${cfg.cssClass}`}
                        aria-hidden="true"
                      >
                        <span className="dot" />
                        {app.status}
                      </span>
                      {/* Dropdown to change status */}
                      <select
                        aria-label={`Change status for ${app.role} at ${app.company}`}
                        value={app.status}
                        disabled={updatingId === app._id}
                        onChange={(e) =>
                          handleStatusChange(
                            app._id,
                            e.target.value as IApplication["status"]
                          )
                        }
                        style={{
                          appearance: "none",
                          WebkitAppearance: "none",
                          background: "transparent",
                          border: "1px solid #E5E7EB",
                          borderRadius: "4px",
                          fontSize: "11px",
                          padding: "2px 18px 2px 4px",
                          cursor: updatingId === app._id ? "not-allowed" : "pointer",
                          color: "#6B7280",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 4px center",
                          backgroundSize: "7px 4px",
                          minHeight: "24px",
                          opacity: updatingId === app._id ? 0.5 : 1,
                        }}
                        title="Change status"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Applied Date — relative time with stale tooltip */}
                  <td style={tdStyle}>
                    {app.appliedDate ? (
                      <span
                        title={
                          stale
                            ? `⚠ No update in 7+ days (${new Date(app.appliedDate).toLocaleDateString()})`
                            : new Date(app.appliedDate).toLocaleDateString()
                        }
                        style={{
                          color: stale ? "#B45309" : "#6B7280",
                          fontSize: "13px",
                          cursor: "default",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {stale && (
                          <span aria-label="Stale application" role="img">
                            ⚠
                          </span>
                        )}
                        {relativeTime(app.appliedDate)}
                      </span>
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>—</span>
                    )}
                  </td>

                  {/* Job URL */}
                  <td style={tdStyle}>
                    {app.jobUrl ? (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#3B82F6",
                          textDecoration: "underline",
                          fontSize: "13px",
                        }}
                      >
                        Link ↗
                      </a>
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>—</span>
                    )}
                  </td>

                  {/* Notes */}
                  <td
                    style={{
                      ...tdStyle,
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "#6B7280",
                      fontSize: "13px",
                    }}
                    title={app.notes ?? undefined}
                  >
                    {app.notes || <span style={{ color: "#9CA3AF" }}>—</span>}
                  </td>

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <button
                      aria-label={`Delete application for ${app.role} at ${app.company}`}
                      disabled={deletingId === app._id}
                      onClick={() =>
                        handleDelete(app._id, app.company, app.role)
                      }
                      style={{
                        padding: "5px 12px",
                        backgroundColor: "#DC2626",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        cursor:
                          deletingId === app._id ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                        transition: "background 150ms ease",
                        opacity: deletingId === app._id ? 0.6 : 1,
                        minHeight: "30px",
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== app._id)
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                            "#B91C1C";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "#DC2626";
                      }}
                    >
                      {deletingId === app._id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Style constants ──────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  fontWeight: 600,
  fontSize: "12px",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};
