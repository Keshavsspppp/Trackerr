"use client";

import { useEffect } from "react";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard page error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        background: "var(--color-bg)",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <span style={{ fontSize: "64px", lineHeight: 1 }} role="img" aria-label="Error">⚠️</span>
      <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
        Something went wrong!
      </h2>
      <p style={{ color: "var(--color-text-secondary)", maxWidth: "420px", fontSize: "15px", lineHeight: 1.5, margin: 0 }}>
        An error occurred while loading the dashboard. Please try again or reload the page.
      </p>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          onClick={() => reset()}
          className="hover-btn-accent"
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--color-accent)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="hover-btn-neutral"
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
