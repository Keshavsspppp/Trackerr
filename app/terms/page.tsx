'use client';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#4B5563', marginBottom: '16px' }}>
          Last updated: June 19, 2026
        </p>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#374151', marginBottom: '16px' }}>
          Welcome to Trackerr. By accessing our application, you agree to follow these simple terms:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '15px', lineHeight: 1.6, color: '#374151', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Usage:</strong> Trackerr is a tool designed to help you track your job and internship applications. Please use it in good faith and do not attempt to misuse our systems.
          </li>
          <li>
            <strong>Account:</strong> Secure authentication is provided through Google. You are responsible for keeping your login credentials safe.
          </li>
          <li>
            <strong>Disclaimer:</strong> Trackerr is provided "as is" without warranty of any kind. We strive to maintain reliable services, but we are not liable for any data loss.
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
