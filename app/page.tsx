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
        gap: '1rem',
      }}
    >
      <h1>Job Application Tracker</h1>
      <p>Track your job applications in one place.</p>
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          cursor: 'pointer',
          borderRadius: '0.375rem',
          border: '1px solid #ccc',
          background: '#fff',
        }}
      >
        Sign in with Google
      </button>
    </main>
  );
}
