"use client";

import { useState, useEffect } from 'react';
import { Edit3, AlertTriangle } from 'lucide-react';
import type { IApplication } from './ApplicationList';
import SourceBadge from './SourceBadge';
import { formatStaticDate } from '@/src/lib/applicationUtils';

interface KanbanBoardProps {
  applications: IApplication[];
  onRefresh?: () => void;
  onEdit?: (application: IApplication) => void;
}

type Status = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

const STATUS_COLUMNS: Status[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

const STATUS_CONFIG: Record<Status, { bg: string; text: string; border: string }> = {
  Applied: { bg: 'var(--color-applied-bg)', text: 'var(--color-applied-text)', border: 'var(--color-applied-dot)' },
  Interview: { bg: 'var(--color-interview-bg)', text: 'var(--color-interview-text)', border: 'var(--color-interview-dot)' },
  Offer: { bg: 'var(--color-offer-bg)', text: 'var(--color-offer-text)', border: 'var(--color-offer-dot)' },
  Rejected: { bg: 'var(--color-rejected-bg)', text: 'var(--color-rejected-text)', border: 'var(--color-rejected-dot)' },
};

function relativeTime(dateStr: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(dateStr);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / 86400000);
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays < -1) return `In ${Math.abs(diffDays)} days`;
  return `${diffDays} days ago`;
}

function isStale(app: IApplication): boolean {
  if (app.status !== 'Applied') return false;
  const diff = Date.now() - new Date(app.lastUpdated).getTime();
  return diff > 7 * 86400000;
}

export default function KanbanBoard({ applications, onRefresh, onEdit }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Group applications by status
  const applicationsByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = applications.filter(app => app.status === status);
    return acc;
  }, {} as Record<Status, IApplication[]>);

  async function handleStatusChange(id: string, newStatus: Status) {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Failed to update status');
      } else {
        onRefresh?.();
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDragStart(e: React.DragEvent, appId: string) {
    setDraggedId(appId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ appId }));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e: React.DragEvent, targetStatus: Status) {
    e.preventDefault();
    if (!draggedId) return;

    const draggedApp = applications.find(app => app._id === draggedId);
    if (!draggedApp || draggedApp.status === targetStatus) {
      setDraggedId(null);
      return;
    }

    handleStatusChange(draggedId, targetStatus);
    setDraggedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-rejected-bg)',
            color: 'var(--color-rejected-text)',
            borderRadius: '8px',
            border: '1px solid var(--color-rejected-dot)',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <div className="kanban-grid">
        {STATUS_COLUMNS.map(status => {
          const config = STATUS_CONFIG[status];
          const apps = applicationsByStatus[status];

          return (
            <div
              key={status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
              style={{
                backgroundColor: config.bg,
                borderRadius: '12px',
                padding: '16px',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: config.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {status}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '999px',
                    backgroundColor: config.border,
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '0 8px',
                  }}
                >
                  {apps.length}
                </span>
              </div>

              {/* Cards */}
              {apps.map(app => {
                const stale = isMounted && isStale(app);
                const isDragging = draggedId === app._id;
                const isUpdating = updatingId === app._id;

                return (
                  <div
                    key={app._id}
                    draggable={!isUpdating}
                    onDragStart={(e) => handleDragStart(e, app._id)}
                    onDragEnd={handleDragEnd}
                    className="hover-translate"
                    title={isMounted && stale ? `No update in 7+ days` : undefined}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: '8px',
                      padding: '12px',
                      border: stale ? '2px solid var(--color-stale-border)' : '1px solid var(--color-border)',
                      cursor: isUpdating ? 'not-allowed' : 'grab',
                      opacity: isDragging ? 0.5 : (isUpdating ? 0.7 : 1),
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {/* Company Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          margin: 0,
                        }}
                      >
                        {app.company}
                      </h4>
                      {app.source && app.source !== 'manual' && (
                        <SourceBadge source={app.source} />
                      )}
                    </div>

                    {/* Role */}
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 8px 0',
                      }}
                    >
                      {app.role}
                    </p>

                    {/* Applied Date */}
                    {app.appliedDate && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: stale ? 'var(--color-stale-text)' : 'var(--color-text-secondary)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {stale && <AlertTriangle size={12} style={{ color: 'var(--color-stale-border)' }} />}
                        {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
                      </p>
                    )}

                    {/* Notes Preview */}
                    {app.notes && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          margin: '8px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {app.notes}
                      </p>
                    )}

                    {/* Mobile Only Status Select */}
                    <div
                      className="mobile-only-status-select"
                      style={{
                        marginTop: "8px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label htmlFor={`mobile-status-select-${app._id}`} style={{ display: "none" }}>
                        Move status
                      </label>
                      <select
                        id={`mobile-status-select-${app._id}`}
                        value={app.status}
                        disabled={isUpdating}
                        onChange={(e) => handleStatusChange(app._id, e.target.value as Status)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {STATUS_COLUMNS.map((s) => (
                          <option key={s} value={s}>
                            Move to {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Edit button */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "6px",
                        marginTop: "10px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEdit?.(app)}
                        className="hover-btn-neutral"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "4px",
                          background: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                        aria-label={`Edit ${app.role} at ${app.company}`}
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                    </div>

                    {isUpdating && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        Updating...
                      </div>
                    )}
                  </div>
                );
              })}

              {apps.length === 0 && (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: 'var(--color-text-muted)',
                    fontSize: '13px',
                  }}
                >
                  Drop applications here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
