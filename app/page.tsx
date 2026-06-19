import Link from 'next/link';
import { Lock, Shield, Database, Play } from 'lucide-react';
import GoogleSignInButton from '@/src/components/GoogleSignInButton';

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

        {/* Google social sign-in */}
        <GoogleSignInButton />

        {/* OAuth Security Microcopy */}
        <p className="microcopy">
          We only use Google sign-in for secure login — we never read your email.
        </p>

        {/* Try Demo Sandbox button */}
        <Link
          id="try-demo"
          className="landing-btn-secondary"
          href="/demo"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Play size={16} aria-hidden="true" />
          Try Demo Sandbox
        </Link>

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
