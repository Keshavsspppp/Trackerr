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
        setError(data.error ?? "Failed to update status");
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
        setError(data.error ?? "Failed to delete application");
      } else {
        onRefresh?.();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setDeletingId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
        No applications yet — add one above!
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "0.375rem",
            border: "1px solid #fca5a5",
          }}
        >
          {error}
        </div>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid #e5e7eb",
              textAlign: "left",
              color: "#374151",
            }}
          >
            <th style={thStyle}>Company</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Applied Date</th>
            <th style={thStyle}>Job URL</th>
            <th style={thStyle}>Notes</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app._id}
              style={{
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <td style={tdStyle}>
                <span style={{ fontWeight: 600 }}>{app.company}</span>
              </td>
              <td style={tdStyle}>{app.role}</td>
              <td style={tdStyle}>
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
                  style={getSelectStyle(app.status)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td style={tdStyle}>
                {app.appliedDate
                  ? new Date(app.appliedDate).toLocaleDateString()
                  : "—"}
              </td>
              <td style={tdStyle}>
                {app.jobUrl ? (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    Link
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td
                style={{
                  ...tdStyle,
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={app.notes ?? undefined}
              >
                {app.notes || "—"}
              </td>
              <td style={tdStyle}>
                <button
                  aria-label={`Delete application for ${app.role} at ${app.company}`}
                  disabled={deletingId === app._id}
                  onClick={() => handleDelete(app._id, app.company, app.role)}
                  style={deleteButtonStyle}
                  onMouseEnter={(e) => {
                    if (deletingId !== app._id) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "#b91c1c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "#dc2626";
                  }}
                >
                  {deletingId === app._id ? "Deleting…" : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "0.625rem 0.75rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0.625rem 0.75rem",
  verticalAlign: "middle",
};

const deleteButtonStyle: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  backgroundColor: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "0.375rem",
  cursor: "pointer",
  fontSize: "0.8125rem",
  fontWeight: 500,
  transition: "background-color 0.15s",
};

function getSelectStyle(status: IApplication["status"]): React.CSSProperties {
  const colorMap: Record<IApplication["status"], React.CSSProperties> = {
    Applied: {
      backgroundColor: "#dbeafe",
      color: "#1d4ed8",
      border: "1px solid #93c5fd",
    },
    Interview: {
      backgroundColor: "#fef9c3",
      color: "#a16207",
      border: "1px solid #fde047",
    },
    Offer: {
      backgroundColor: "#dcfce7",
      color: "#15803d",
      border: "1px solid #86efac",
    },
    Rejected: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fca5a5",
    },
  };

  return {
    ...colorMap[status],
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    paddingRight: "1.5rem",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
    backgroundSize: "8px 5px",
  };
}
