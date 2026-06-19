import LoadingSkeleton from "@/src/components/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar Mock */}
      <aside 
        style={{
          width: '240px',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div style={{ height: '32px', background: 'var(--color-border)', borderRadius: '4px', width: '80%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ height: '32px', background: 'var(--color-border)', borderRadius: '8px' }} />
          <div style={{ height: '32px', background: 'var(--color-border)', borderRadius: '8px' }} />
        </div>
      </aside>

      {/* Main Content Area Mock */}
      <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: '36px', background: 'var(--color-border)', borderRadius: '4px', width: '200px' }} />
          <div style={{ height: '40px', background: 'var(--color-border)', borderRadius: '8px', width: '160px' }} />
        </div>

        {/* Stats cards loading */}
        <div>
          <LoadingSkeleton variant="stats" />
        </div>

        {/* Chart loading */}
        <div>
          <LoadingSkeleton variant="chart" />
        </div>

        {/* Table list loading */}
        <div>
          <LoadingSkeleton variant="table" />
        </div>
      </main>
    </div>
  );
}
