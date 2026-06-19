'use client';

import { signIn } from 'next-auth/react';
import { Lock, Shield, Database, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F3F4F6 0%, #FFFFFF 100%)',
        padding: '32px 24px',
        fontFamily: 'var(--font-inter, "Inter", system-ui, sans-serif)',
      }}
    >
      

      {/* Wordmark with Logo */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
        <img src="/logo.png" alt="Trackerr Logo" width="36" height="36" style={{ borderRadius: '50%' }} />
        <span
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-1.0px',
          }}
        >
          Trackerr<span style={{ color: '#3B82F6' }}>.</span>
        </span>
      </div>

      {/* Tagline */}
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
          marginBottom: '8px',
          lineHeight: 1.3,
          maxWidth: '400px',
          letterSpacing: '-0.5px',
        }}
      >
        Track every application.<br />Land the internship.
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '14px',
          color: '#4B5563',
          textAlign: 'center',
          marginBottom: '24px',
          lineHeight: 1.5,
          maxWidth: '360px',
        }}
      >
        See exactly where you stand — applied, interviewing, offers. All in one place.
      </p>

      {/* Preview Strip */}
      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          background: 'var(--color-surface, #FFFFFF)',
          borderRadius: '12px',
          padding: '12px 16px',
          border: '1px solid var(--color-border, #E5E7EB)',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08))',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {[
          { company: 'Google', role: 'SWE Intern', status: 'Interview', bg: 'var(--color-interview-bg, #FEF3C7)', text: 'var(--color-interview-text, #B45309)', dot: 'var(--color-interview-dot, #F59E0B)' },
          { company: 'Stripe', role: 'Backend Intern', status: 'Offer', bg: 'var(--color-offer-bg, #D1FAE5)', text: 'var(--color-offer-text, #065F46)', dot: 'var(--color-offer-dot, #10B981)' },
          { company: 'Meta', role: 'Product Intern', status: 'Applied', bg: 'var(--color-applied-bg, #DBEAFE)', text: 'var(--color-applied-text, #1D4ED8)', dot: 'var(--color-applied-dot, #3B82F6)' },
        ].map((item) => (
          <div
            key={item.company}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: item.company === 'Meta' ? 'none' : '1px solid #F3F4F6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.dot,
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                {item.company}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {item.role}
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: item.bg,
                color: item.text,
              }}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Google sign-in button */}
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: '340px',
          height: '48px',
          background: 'var(--color-accent, #3B82F6)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 150ms ease',
          marginBottom: '12px',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover, #2563EB)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent, #3B82F6)';
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
        Continue with Google
      </button>

      {/* Try Demo Sandbox button */}
      <button
        onClick={() => window.location.href = '/demo'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          maxWidth: '340px',
          height: '48px',
          background: 'transparent',
          color: '#374151',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 150ms ease',
          marginBottom: '24px',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#9CA3AF';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
        }}
      >
        Try Demo Sandbox
      </button>

      {/* Trust Badges */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: '12px',
          color: '#6B7280',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Lock size={12} />
          <span>Secure OAuth</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={12} />
          <span>No Ads</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Database size={12} />
          <span>Your Data</span>
        </div>
      </div>
    </main>
  );
}
