"use client";

import { Table, Kanban } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'table' | 'kanban';
  onViewChange: (view: 'table' | 'kanban') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const buttonStyle = (view: 'table' | 'kanban'): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    backgroundColor: currentView === view ? 'var(--color-accent)' : 'var(--color-surface)',
    color: currentView === view ? '#FFFFFF' : 'var(--color-text-secondary)',
    border: currentView === view ? 'none' : '1px solid var(--color-border)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  });

  return (
    <div
      role="tablist"
      aria-label="View mode toggle"
      style={{
        display: 'inline-flex',
        gap: '8px',
        padding: '4px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        role="tab"
        aria-selected={currentView === 'table'}
        aria-label="Table view"
        onClick={() => onViewChange('table')}
        style={buttonStyle('table')}
        className={currentView === 'table' ? 'hover-btn-accent' : 'hover-btn-neutral'}
      >
        <Table size={16} /> Table View
      </button>
      <button
        role="tab"
        aria-selected={currentView === 'kanban'}
        aria-label="Kanban view"
        onClick={() => onViewChange('kanban')}
        style={buttonStyle('kanban')}
        className={currentView === 'kanban' ? 'hover-btn-accent' : 'hover-btn-neutral'}
      >
        <Kanban size={16} /> Kanban View
      </button>
    </div>
  );
}
