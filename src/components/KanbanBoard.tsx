"use client";

import { useState, useEffect } from 'react';
import type { IApplication } from './ApplicationList';
import SourceBadge from './SourceBadge';
import { formatStaticDate } from '@/src/lib/applicationUtils';

interface KanbanBoardProps {
  applications: IApplication[];
  onRefresh?: () => void;
}

type Status = 'Applied' | 'Interview' | 'Offer' | 'Rejected';

const STATUS_COLUMNS: Status[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

const STATUS_CONFIG: Record<Status, { bg: string; text: string; border: string }> = {
  Applied: { bg: '#EFF6FF', text: '#1D4ED8', border: '#3B82F6' },
  Interview: { bg: '#FFFBEB', text: '#B45309', border: '#F59E0B' },
  Offer: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function isStale(app: IApplication): boolean {
  const diff = Date.now() - new Date(app.lastUpdated).getTime();
  return diff > 7 * 86400000;
}

export default function KanbanBoard({ applications, onRefresh }: KanbanBoardProps) {
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
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            border: '1px solid #FECACA',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
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
                    title={isMounted && stale ? `No update in ${Math.floor((Date.now() - new Date(app.lastUpdated).getTime()) / 86400000)} days` : undefined}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '12px',
                      border: stale ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                      cursor: isUpdating ? 'not-allowed' : 'grab',
                      opacity: isDragging ? 0.5 : (isUpdating ? 0.7 : 1),
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDragging && !isUpdating) {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Company Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#111827',
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
                        color: '#6B7280',
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
                          color: stale ? '#B45309' : '#9CA3AF',
                          margin: 0,
                        }}
                      >
                        {stale && '⚠ '}
                        {isMounted ? relativeTime(app.appliedDate) : formatStaticDate(app.appliedDate)}
                      </p>
                    )}

                    {/* Notes Preview */}
                    {app.notes && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          margin: '8px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {app.notes}
                      </p>
                    )}

                    {isUpdating && (
                      <div
                        style={{
                          marginTop: '8px',
                          fontSize: '11px',
                          color: '#6B7280',
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
                    color: '#9CA3AF',
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
