'use client';

export default function PrivacyPage() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F3F4F6 0%, #FFFFFF 100%)',
        padding: '40px 24px',
        fontFamily: 'var(--font-inter, "Inter", system-ui, sans-serif)',
        color: '#111827',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.5px' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#4B5563', marginBottom: '16px' }}>
          Last updated: June 19, 2026
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#374151', marginBottom: '16px' }}>
          At Trackerr, we value your privacy. This policy outlines how we handle your information:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '15px', lineHeight: 1.6, color: '#374151', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Data Security:</strong> We only use Google sign-in to securely authenticate your account. We never read, store, or access your Gmail messages or other Google services.
          </li>
          <li>
            <strong>Data Ownership:</strong> We do not sell, share, or distribute your tracked application data to any third parties. All your records are private to you.
          </li>
          <li>
            <strong>Data Deletion:</strong> You have full control over your data. You can delete individual applications at any time, or request complete account and data deletion by contacting us.
          </li>
        </ul>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
            padding: '0 16px',
            background: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
        >
          Back to Home
        </button>
      </div>
    </main>
  );
}
