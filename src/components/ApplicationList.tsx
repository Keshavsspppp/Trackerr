"use client";

import { useState, useEffect } from "react";
import SourceBadge from "./SourceBadge";
import { formatStaticDate } from "@/src/lib/applicationUtils";

export interface IApplication {
  _id: string;
  userId: string;
  company: string;
  role: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  appliedDate?: string;
  jobUrl?: string;
  notes?: string;
  source?: "manual" | "extension" | "csv_import";
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
  const [deleteTarget, setDeleteTarget] = useState<IApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  async function handleDelete(id: string) {
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
          No internships yet
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#6B7280" }}>
          Add your first internship to get started.
        </p>
      </div>
    );
  }

  // ── Table ────────────────────────────────────────────────────────────────────
  return (
    <>
      {error && (
        <div
          role="alert"
          style={{
            margin: "0 0 16px",
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="delete-modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
              <span style={{ fontSize: "24px", lineHeight: 1, marginTop: "2px" }} role="img" aria-label="Warning">
                ⚠️
              </span>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Delete Internship?
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "14px",
                    color: "#6B7280",
                    lineHeight: 1.5,
                  }}
                >
                  Are you sure you want to delete the internship for{" "}
                  <strong>{deleteTarget.role}</strong> at{" "}
                  <strong>{deleteTarget.company}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#FFFFFF",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F9FAFB";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#C5C6C9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = deleteTarget._id;
                  setDeleteTarget(null);
                  handleDelete(id);
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B91C1C";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#DC2626";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table Layout */}
      <div
        className="desktop-table-container"
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
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
                  Posting URL
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
                const stale = isMounted && isStale(app);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          {app.company}
                        </span>
                        {app.source && app.source !== 'manual' && (
                          <SourceBadge source={app.source} />
                        )}
                      </div>
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
                            isMounted
                              ? stale
                                ? `⚠ No update in 7+ days (${new Date(app.appliedDate).toLocaleDateString()})`
                                : new Date(app.appliedDate).toLocaleDateString()
                              : formatStaticDate(app.appliedDate)
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
                          {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
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
                        aria-label={`Delete internship for ${app.role} at ${app.company}`}
                        disabled={deletingId === app._id}
                        onClick={() => setDeleteTarget(app)}
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

      {/* Mobile Card Layout */}
      <div className="mobile-card-list">
        {applications.map((app) => {
          const stale = isMounted && isStale(app);
          const cfg = STATUS_CONFIG[app.status];

          return (
            <div
              key={app._id}
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                border: stale ? "1px solid #F59E0B" : "1px solid #E5E7EB",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
                borderLeft: stale ? "4px solid #F59E0B" : "1px solid #E5E7EB",
              }}
            >
              {/* Company & Role */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                    {app.company}
                  </span>
                  {app.source && app.source !== "manual" && (
                    <SourceBadge source={app.source} />
                  )}
                </div>
                <div style={{ fontSize: "14px", color: "#4B5563", marginTop: "2px" }}>
                  {app.role}
                </div>
              </div>

              {/* Divider */}
              <hr style={{ border: 0, borderTop: "1px solid #F3F4F6", margin: 0 }} />

              {/* Details grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px 16px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <div style={{ color: "#9CA3AF", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Status
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className={`status-badge ${cfg.cssClass}`} style={{ padding: "2px 8px", fontSize: "11px" }}>
                      <span className="dot" />
                      {app.status}
                    </span>
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
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ color: "#9CA3AF", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Applied Date
                  </div>
                  <div>
                    {app.appliedDate ? (
                      <span
                        style={{
                          color: stale ? "#B45309" : "#4B5563",
                          fontWeight: 500,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {stale && <span aria-label="Stale application">⚠️</span>}
                        {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
                      </span>
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>—</span>
                    )}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ color: "#9CA3AF", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Posting URL
                  </div>
                  <div>
                    {app.jobUrl ? (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#3B82F6",
                          textDecoration: "underline",
                          fontWeight: 500,
                        }}
                      >
                        View Job Posting ↗
                      </a>
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>—</span>
                    )}
                  </div>
                </div>

                {app.notes && (
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ color: "#9CA3AF", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                      Notes
                    </div>
                    <div
                      style={{
                        color: "#4B5563",
                        fontSize: "13px",
                        background: "#F9FAFB",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #F3F4F6",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {app.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action row */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  aria-label={`Delete internship for ${app.role} at ${app.company}`}
                  disabled={deletingId === app._id}
                  onClick={() => setDeleteTarget(app)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: "#FEE2E2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    borderRadius: "8px",
                    cursor: deletingId === app._id ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "background-color 150ms ease, color 150ms ease",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FCA5A5";
                    (e.currentTarget as HTMLButtonElement).style.color = "#B91C1C";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEE2E2";
                    (e.currentTarget as HTMLButtonElement).style.color = "#DC2626";
                  }}
                >
                  {deletingId === app._id ? "Deleting…" : "Delete Internship"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
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
