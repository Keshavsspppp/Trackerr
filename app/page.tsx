'use client';

import { signIn } from 'next-auth/react';
import { Lock, Shield, Database, Play } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Inline style block for dark-mode-aware landing background */}
      <style>{`
        .landing-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 32px 24px;
          font-family: var(--font-inter, "Inter", system-ui, sans-serif);
          background: linear-gradient(180deg, var(--color-bg, #F3F4F6) 0%, var(--color-surface, #FFFFFF) 100%);
        }
        .landing-btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 340px;
          height: 48px;
          background: var(--color-accent, #3B82F6);
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 150ms ease;
          margin-bottom: 8px;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
          font-family: inherit;
        }
        .landing-btn-primary:hover {
          background: var(--color-accent-hover, #2563EB);
        }
        .landing-btn-primary:focus-visible {
          outline: 2px solid var(--color-accent, #3B82F6);
          outline-offset: 3px;
        }
        .landing-btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          max-width: 340px;
          height: 48px;
          background: transparent;
          color: var(--color-text-primary, #374151);
          border: 1px solid var(--color-border, #D1D5DB);
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms ease;
          margin-bottom: 24px;
          font-family: inherit;
        }
        .landing-btn-secondary:hover {
          background: var(--color-sidebar-hover, #F3F4F6);
          border-color: var(--color-text-muted, #9CA3AF);
        }
        .landing-btn-secondary:focus-visible {
          outline: 2px solid var(--color-accent, #3B82F6);
          outline-offset: 3px;
        }
        .landing-wordmark {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-text-primary, #111827);
          letter-spacing: -1.0px;
        }
        .landing-h1 {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text-primary, #111827);
          text-align: center;
          margin-bottom: 8px;
          line-height: 1.3;
          max-width: 400px;
          letter-spacing: -0.5px;
        }
        .landing-subtitle {
          font-size: 14px;
          color: var(--color-text-secondary, #4B5563);
          text-align: center;
          margin-bottom: 24px;
          line-height: 1.5;
          max-width: 360px;
        }
        .landing-preview-card {
          width: 100%;
          max-width: 340px;
          background: var(--color-surface, #FFFFFF);
          border-radius: 12px;
          padding: 12px 16px;
          border: 1px solid var(--color-border, #E5E7EB);
          box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .landing-trust-badges {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--color-text-secondary, #6B7280);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .landing-footer {
          margin-top: 24px;
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: var(--color-text-muted, #9CA3AF);
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
        .landing-footer a {
          color: var(--color-text-muted, #9CA3AF);
          text-decoration: underline;
          transition: color 150ms ease;
        }
        .landing-footer a:hover {
          color: var(--color-text-secondary, #6B7280);
        }
        .microcopy {
          font-size: 11px;
          color: var(--color-text-muted, #6B7280);
          margin-top: 0px;
          margin-bottom: 12px;
          text-align: center;
          max-width: 340px;
        }
      `}</style>

      <main className="landing-root">

        {/* Wordmark with Logo */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Trackerr Logo" width="36" height="36" style={{ borderRadius: '50%' }} />
          <span className="landing-wordmark">
            Trackerr<span style={{ color: 'var(--color-accent, #3B82F6)' }}>.</span>
          </span>
        </div>

        {/* Tagline */}
        <h1 className="landing-h1">
          Track every application.<br />Land the internship.
        </h1>

        {/* Subtitle */}
        <p className="landing-subtitle">
          See exactly where you stand — applied, interviewing, offers. All in one place.
        </p>

        {/* Preview Strip */}
        <div className="landing-preview-card" aria-hidden="true">
          {[
            { company: 'Google', role: 'SWE Intern', status: 'Interview', bg: 'var(--color-interview-bg, #FEF3C7)', text: 'var(--color-interview-text, #B45309)', dot: 'var(--color-interview-dot, #F59E0B)' },
            { company: 'Stripe', role: 'Backend Intern', status: 'Offer', bg: 'var(--color-offer-bg, #D1FAE5)', text: 'var(--color-offer-text, #065F46)', dot: 'var(--color-offer-dot, #10B981)' },
            { company: 'Meta', role: 'Product Intern', status: 'Applied', bg: 'var(--color-applied-bg, #E2E8F0)', text: 'var(--color-applied-text, #334155)', dot: 'var(--color-applied-dot, #64748B)' },
          ].map((item) => (
            <div
              key={item.company}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: item.company === 'Meta' ? 'none' : '1px solid var(--color-border, #F3F4F6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: item.dot,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #111827)' }}>
                  {item.company}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary, #6B7280)' }}>
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
          id="sign-in-google"
          className="landing-btn-primary"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
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

        {/* OAuth Security Microcopy */}
        <p className="microcopy">
          We only use Google sign-in for secure login — we never read your email.
        </p>

        {/* Try Demo Sandbox button */}
        <button
          id="try-demo"
          className="landing-btn-secondary"
          onClick={() => window.location.href = '/demo'}
        >
          <Play size={16} aria-hidden="true" />
          Try Demo Sandbox
        </button>

        {/* Trust Badges */}
        <div className="landing-trust-badges" aria-label="Trust indicators">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} aria-hidden="true" />
            <span>Secure OAuth</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} aria-hidden="true" />
            <span>No Ads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={12} aria-hidden="true" />
            <span>Your Data</span>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="landing-footer">
          <a href="/privacy">Privacy Policy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms">Terms of Service</a>
          <span aria-hidden="true">·</span>
          <a
            href="https://github.com/Keshavsspppp/Trackerr"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </footer>
      </main>
    </>
  );
}
