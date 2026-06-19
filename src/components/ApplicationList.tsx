"use client";

import { useState, useEffect } from "react";
import { Edit3, Trash2, Search, X, AlertTriangle } from "lucide-react";
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
  onEdit?: (application: IApplication) => void;
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
    bg: "var(--color-applied-bg)",
    text: "var(--color-applied-text)",
    dot: "var(--color-applied-dot)",
    cssClass: "status-applied",
  },
  Interview: {
    bg: "var(--color-interview-bg)",
    text: "var(--color-interview-text)",
    dot: "var(--color-interview-dot)",
    cssClass: "status-interview",
  },
  Offer: {
    bg: "var(--color-offer-bg)",
    text: "var(--color-offer-text)",
    dot: "var(--color-offer-dot)",
    cssClass: "status-offer",
  },
  Rejected: {
    bg: "var(--color-rejected-bg)",
    text: "var(--color-rejected-text)",
    dot: "var(--color-rejected-dot)",
    cssClass: "status-rejected",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(dateStr);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / 86400000);
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Tomorrow";
  if (diffDays < -1) return `In ${Math.abs(diffDays)} days`;
  return `${diffDays} days ago`;
}

function isStale(app: IApplication): boolean {
  if (app.status !== "Applied") return false;
  const diff = Date.now() - new Date(app.lastUpdated).getTime();
  return diff > 7 * 86400000;
}

export function getInitialsColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: '#EFF6FF', text: '#1D4ED8' }, // Blue
    { bg: '#ECFDF5', text: '#047857' }, // Green
    { bg: '#FDF2F8', text: '#BE185D' }, // Pink
    { bg: '#F5F3FF', text: '#6D28D9' }, // Purple
    { bg: '#FFF7ED', text: '#C2410C' }, // Orange
    { bg: '#F0FDFA', text: '#0F766E' }, // Teal
    { bg: '#FEF2F2', text: '#B91C1C' }, // Red
    { bg: '#F8FAFC', text: '#475569' }, // Slate
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ApplicationList({
  applications,
  onRefresh,
  onEdit,
}: ApplicationListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IApplication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"appliedDateDesc" | "appliedDateAsc" | "companyAsc" | "companyDesc">("appliedDateDesc");
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});

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

  // Filter & Sort logic
  const filtered = applications.filter((app) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      app.company.toLowerCase().includes(query) ||
      app.role.toLowerCase().includes(query)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "companyAsc") {
      return a.company.localeCompare(b.company);
    }
    if (sortBy === "companyDesc") {
      return b.company.localeCompare(a.company);
    }
    const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
    const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;
    if (sortBy === "appliedDateAsc") {
      return dateA - dateB;
    }
    return dateB - dateA;
  });

  // ── Empty state (global) ────────────────────────────────────────────────────
  if (applications.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          background: "var(--color-surface)",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
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
            color: "var(--color-text-primary)",
          }}
        >
          No matching internships
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)" }}>
          No internships are currently tracked with this status filter.
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
            backgroundColor: "var(--color-rejected-bg)",
            color: "var(--color-rejected-text)",
            borderRadius: "8px",
            border: "1px solid var(--color-rejected-dot)",
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
              <AlertTriangle size={24} style={{ color: "var(--color-rejected-dot)", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Delete Internship?
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "14px",
                    color: "var(--color-text-secondary)",
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
                className="hover-btn-neutral"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
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
                className="hover-btn-danger"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Sort Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-secondary)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search by company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              fontSize: "14px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-input)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label htmlFor="sort-select" style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-input)",
              background: "var(--color-surface)",
              color: "var(--color-text-primary)",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="appliedDateDesc">Applied Date (Newest)</option>
            <option value="appliedDateAsc">Applied Date (Oldest)</option>
            <option value="companyAsc">Company (A-Z)</option>
            <option value="companyDesc">Company (Z-A)</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            background: "var(--color-surface)",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
            textAlign: "center",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <Search size={32} style={{ color: "var(--color-text-muted)" }} />
          <p style={{ margin: "4px 0", fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
            No results found
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
            We couldn't find any internships matching "{searchQuery}".
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table Layout */}
          <div
            className="desktop-table-container"
            style={{
              background: "var(--color-surface)",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
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
                      background: "var(--color-bg)",
                      borderBottom: "1px solid var(--color-border)",
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
                    <th scope="col" style={{ ...thStyle, maxWidth: "200px" }}>
                      Notes
                    </th>
                    <th scope="col" style={{ ...thStyle, textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((app) => {
                    const stale = isMounted && isStale(app);
                    const cfg = STATUS_CONFIG[app.status];

                    return (
                      <tr
                        key={app._id}
                        className="hover-bg-gray"
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          borderLeft: stale
                            ? "3px solid var(--color-stale-border)"
                            : "3px solid transparent",
                        }}
                      >
                        {/* Company */}
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                backgroundColor: getInitialsColor(app.company).bg,
                                color: getInitialsColor(app.company).text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {app.company.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {app.company}
                            </span>
                            {app.source && app.source !== 'manual' && (
                              <SourceBadge source={app.source} />
                            )}
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ ...tdStyle, color: "var(--color-text-primary)" }}>{app.role}</td>

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
                                border: "1px solid var(--color-border)",
                                borderRadius: "4px",
                                fontSize: "11px",
                                padding: "2px 18px 2px 4px",
                                cursor: updatingId === app._id ? "not-allowed" : "pointer",
                                color: "var(--color-text-secondary)",
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
                                color: stale ? "var(--color-stale-text)" : "var(--color-text-secondary)",
                                fontSize: "13px",
                                cursor: "default",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {stale && (
                                <AlertTriangle size={14} style={{ color: "var(--color-stale-border)" }} />
                              )}
                              {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>—</span>
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
                                color: "var(--color-accent)",
                                textDecoration: "underline",
                                fontSize: "13px",
                              }}
                            >
                              Link ↗
                            </a>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>—</span>
                          )}
                        </td>

                        {/* Notes click-to-expand */}
                        <td
                          style={{
                            ...tdStyle,
                            maxWidth: "200px",
                            fontSize: "13px",
                          }}
                        >
                          {app.notes ? (
                            <div>
                              <div
                                style={{
                                  color: "var(--color-text-secondary)",
                                  cursor: app.notes.length > 30 ? "pointer" : "default",
                                  overflow: expandedNotesIds[app._id] ? "visible" : "hidden",
                                  textOverflow: expandedNotesIds[app._id] ? "clip" : "ellipsis",
                                  whiteSpace: expandedNotesIds[app._id] ? "normal" : "nowrap",
                                  wordBreak: "break-word",
                                }}
                                onClick={() => {
                                  if (app.notes && app.notes.length > 30) {
                                    setExpandedNotesIds(prev => ({
                                      ...prev,
                                      [app._id]: !prev[app._id]
                                    }));
                                  }
                                }}
                              >
                                {app.notes}
                              </div>
                              {app.notes.length > 30 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedNotesIds(prev => ({
                                      ...prev,
                                      [app._id]: !prev[app._id]
                                    }));
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--color-accent)",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    padding: 0,
                                    marginTop: "2px",
                                    display: "block",
                                  }}
                                >
                                  {expandedNotesIds[app._id] ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              aria-label={`Edit internship for ${app.role} at ${app.company}`}
                              onClick={() => onEdit?.(app)}
                              className="hover-btn-neutral"
                              style={{
                                padding: "5px 12px",
                                border: "1px solid var(--color-border)",
                                borderRadius: "6px",
                                background: "var(--color-surface)",
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                                minHeight: "30px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              aria-label={`Delete internship for ${app.role} at ${app.company}`}
                              disabled={deletingId === app._id}
                              onClick={() => setDeleteTarget(app)}
                              className="hover-btn-danger"
                              style={{
                                padding: "5px 12px",
                                backgroundColor: "#DC2626",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "6px",
                                cursor: deletingId === app._id ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                fontWeight: 500,
                                opacity: deletingId === app._id ? 0.6 : 1,
                                minHeight: "30px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Trash2 size={12} /> {deletingId === app._id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
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
            {sorted.map((app) => {
              const stale = isMounted && isStale(app);
              const cfg = STATUS_CONFIG[app.status];

              return (
                <div
                  key={app._id}
                  style={{
                    background: "var(--color-surface)",
                    borderRadius: "12px",
                    border: stale ? "1px solid var(--color-stale-border)" : "1px solid var(--color-border)",
                    padding: "16px",
                    boxShadow: "var(--shadow-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    position: "relative",
                    borderLeft: stale ? "4px solid var(--color-stale-border)" : "1px solid var(--color-border)",
                  }}
                >
                  {/* Company & Role */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: getInitialsColor(app.company).bg,
                          color: getInitialsColor(app.company).text,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {app.company.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {app.company}
                      </span>
                      {app.source && app.source !== "manual" && (
                        <SourceBadge source={app.source} />
                      )}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {app.role}
                    </div>
                  </div>

                  {/* Divider */}
                  <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: 0 }} />

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
                      <div style={{ color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
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
                            border: "1px solid var(--color-border)",
                            borderRadius: "4px",
                            fontSize: "11px",
                            padding: "2px 18px 2px 4px",
                            cursor: updatingId === app._id ? "not-allowed" : "pointer",
                            color: "var(--color-text-secondary)",
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
                      <div style={{ color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                        Applied Date
                      </div>
                      <div>
                        {app.appliedDate ? (
                          <span
                            style={{
                              color: stale ? "var(--color-stale-text)" : "var(--color-text-secondary)",
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {stale && <AlertTriangle size={14} style={{ color: "var(--color-stale-border)" }} />}
                            {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </div>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                        Posting URL
                      </div>
                      <div>
                        {app.jobUrl ? (
                          <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--color-accent)",
                              textDecoration: "underline",
                              fontWeight: 500,
                            }}
                          >
                            View Job Posting ↗
                          </a>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </div>
                    </div>

                    {app.notes && (
                      <div style={{ gridColumn: "span 2" }}>
                        <div style={{ color: "var(--color-text-muted)", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "4px" }}>
                          Notes
                        </div>
                        <div
                          style={{
                            color: "var(--color-text-secondary)",
                            fontSize: "13px",
                            background: "var(--color-bg)",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border)",
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
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      aria-label={`Edit internship for ${app.role} at ${app.company}`}
                      onClick={() => onEdit?.(app)}
                      className="hover-btn-neutral"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        background: "var(--color-surface)",
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      aria-label={`Delete internship for ${app.role} at ${app.company}`}
                      disabled={deletingId === app._id}
                      onClick={() => setDeleteTarget(app)}
                      className="hover-btn-danger"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#DC2626",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "8px",
                        cursor: deletingId === app._id ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Trash2 size={14} /> {deletingId === app._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// ── Style constants ──────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  fontWeight: 600,
  fontSize: "12px",
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  whiteSpace: "nowrap",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};
