"use client";

interface LoadingSkeletonProps {
  variant: 'table' | 'kanban' | 'stats' | 'chart';
}

export default function LoadingSkeleton({ variant }: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              padding: '14px 16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="skeleton-bar" style={{ width: '20%', height: '16px' }} />
            <div className="skeleton-bar" style={{ width: '25%', height: '16px' }} />
            <div className="skeleton-bar" style={{ width: '15%', height: '16px' }} />
            <div className="skeleton-bar" style={{ width: '15%', height: '16px' }} />
            <div className="skeleton-bar" style={{ width: '10%', height: '16px' }} />
            <div className="skeleton-bar" style={{ width: '15%', height: '16px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'kanban') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[...Array(4)].map((_, colIndex) => (
          <div
            key={colIndex}
            style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '16px',
              minHeight: '400px',
            }}
          >
            <div className="skeleton-bar" style={{ width: '60%', height: '20px', marginBottom: '16px' }} />
            {[...Array(3)].map((_, cardIndex) => (
              <div
                key={cardIndex}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  border: '1px solid #E5E7EB',
                }}
              >
                <div className="skeleton-bar" style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
                <div className="skeleton-bar" style={{ width: '60%', height: '14px' }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
        }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #E5E7EB',
            }}
          >
            <div className="skeleton-bar" style={{ width: '60%', height: '12px', marginBottom: '12px' }} />
            <div className="skeleton-bar" style={{ width: '40%', height: '36px', marginBottom: '8px' }} />
            <div className="skeleton-bar" style={{ width: '80%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #E5E7EB',
          minHeight: '300px',
        }}
      >
        <div className="skeleton-bar" style={{ width: '40%', height: '24px', marginBottom: '24px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-bar" style={{ width: `${90 - i * 15}%`, height: '40px' }} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
