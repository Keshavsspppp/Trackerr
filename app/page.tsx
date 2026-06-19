'use client';

import { signIn } from 'next-auth/react';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #F0F4FF 0%, #FFFFFF 100%)',
        padding: '24px',
      }}
    >
      {/* Wordmark */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.5px',
          }}
        >
          Trackerr<span style={{ color: '#3B82F6' }}>.</span>
        </span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: '20px',
          color: '#6B7280',
          textAlign: 'center',
          marginBottom: '40px',
          lineHeight: 1.4,
          maxWidth: '360px',
        }}
      >
        Track every application. Land the internship.
      </p>

      {/* Google sign-in button */}
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: '320px',
          height: '48px',
          background: '#3B82F6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 150ms ease',
          marginBottom: '48px',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#2563EB';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6';
        }}
      >
        {/* Google "G" icon */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            background: '#FFFFFF',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        </span>
        Sign in with Google
      </button>

      {/* Feature bullets */}
      <ul
        style={{
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px',
          padding: 0,
          width: '100%',
          maxWidth: '320px',
        }}
      >
        {[
          { icon: '🎓', text: 'Track all internship applications in one place' },
          { icon: '📈', text: 'Dashboard stats & conversion rate' },
          { icon: '📧', text: 'Email reminders for stale applications' },
        ].map(({ icon, text }) => (
          <li
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              color: '#374151',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
            {text}
          </li>
        ))}
      </ul>

      {/* Caption */}
      <p
        style={{
          fontSize: '12px',
          color: '#9CA3AF',
          textAlign: 'center',
          letterSpacing: '0.02em',
        }}
      >
        Free · No ads · Your data
      </p>
    </main>
  );
}
