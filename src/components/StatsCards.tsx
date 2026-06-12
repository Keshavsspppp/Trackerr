import React from "react";

interface IApplicationStats {
  total: number;
  byStatus: {
    Applied: number;
    Interview: number;
    Offer: number;
    Rejected: number;
  };
  interviewRate: number;
}

interface StatsCardsProps {
  stats: IApplicationStats;
}

interface CardConfig {
  label: string;
  value: string | number;
  description: string;
  accentColor: string;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const interviewRatePercent =
    stats.total === 0
      ? "0%"
      : `${(stats.interviewRate * 100).toFixed(1)}%`;

  const cards: CardConfig[] = [
    {
      label: "Total Applications",
      value: stats.total,
      description: "All time",
      accentColor: "#6366f1",
    },
    {
      label: "Applied",
      value: stats.byStatus.Applied,
      description: "Awaiting response",
      accentColor: "#3b82f6",
    },
    {
      label: "Interview",
      value: stats.byStatus.Interview,
      description: "In progress",
      accentColor: "#f59e0b",
    },
    {
      label: "Offer",
      value: stats.byStatus.Offer,
      description: "Received",
      accentColor: "#10b981",
    },
    {
      label: "Rejected",
      value: stats.byStatus.Rejected,
      description: "Not selected",
      accentColor: "#ef4444",
    },
    {
      label: "Interview Rate",
      value: interviewRatePercent,
      description: "Interviews + Offers / Total",
      accentColor: "#8b5cf6",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "16px",
      }}
      role="region"
      aria-label="Application statistics"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "20px 16px",
            borderTop: `4px solid ${card.accentColor}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {card.label}
          </span>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
            aria-label={`${card.label}: ${card.value}`}
          >
            {card.value}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            {card.description}
          </span>
        </div>
      ))}
    </div>
  );
}
