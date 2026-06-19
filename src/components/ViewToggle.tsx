"use client";

interface ViewToggleProps {
  currentView: 'table' | 'kanban';
  onViewChange: (view: 'table' | 'kanban') => void;
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  const buttonStyle = (view: 'table' | 'kanban'): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: currentView === view ? '6px' : '6px',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    backgroundColor: currentView === view ? '#3B82F6' : '#FFFFFF',
    color: currentView === view ? '#FFFFFF' : '#374151',
    border: currentView === view ? 'none' : '1px solid #E5E7EB',
  });

  return (
    <div
      role="tablist"
      aria-label="View mode toggle"
      style={{
        display: 'inline-flex',
        gap: '8px',
        padding: '4px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
      }}
    >
      <button
        role="tab"
        aria-selected={currentView === 'table'}
        aria-label="Table view"
        onClick={() => onViewChange('table')}
        style={buttonStyle('table')}
        onMouseEnter={(e) => {
          if (currentView !== 'table') {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'table') {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
          }
        }}
      >
        📊 Table View
      </button>
      <button
        role="tab"
        aria-selected={currentView === 'kanban'}
        aria-label="Kanban view"
        onClick={() => onViewChange('kanban')}
        style={buttonStyle('kanban')}
        onMouseEnter={(e) => {
          if (currentView !== 'kanban') {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
          }
        }}
        onMouseLeave={(e) => {
          if (currentView !== 'kanban') {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
          }
        }}
      >
        📋 Kanban View
      </button>
    </div>
  );
}
