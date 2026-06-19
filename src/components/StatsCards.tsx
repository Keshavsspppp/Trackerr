"use client";

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
  trends?: {
    totalDelta: number;
    appliedDelta: number;
    interviewDelta: number;
    offerDelta: number;
    rejectedDelta: number;
    interviewRateDelta: number;
  };
}

interface StatsCardsProps {
  stats: IApplicationStats;
}

interface CardConfig {
  label: string;
  value: string | number;
  description: string;
  accentColor: string;
  trend?: {
    value: number;
    isPercent?: boolean;
  };
}

function StatCard({ card }: { card: CardConfig }) {
  const hasTrend = card.trend !== undefined;
  const trendValue = card.trend?.value ?? 0;
  const isPercent = card.trend?.isPercent ?? false;

  const trendText = hasTrend
    ? `${trendValue >= 0 ? "+" : ""}${
        isPercent ? (trendValue * 100).toFixed(1) + "%" : trendValue
      }`
    : "";

  const trendColor =
    trendValue > 0
      ? "var(--color-offer-text, #065F46)"
      : trendValue < 0
      ? "var(--color-rejected-text, #991B1B)"
      : "var(--color-text-secondary, #6B7280)";

  const trendBg =
    trendValue > 0
      ? "var(--color-offer-bg, #D1FAE5)"
      : trendValue < 0
      ? "var(--color-rejected-bg, #FEE2E2)"
      : "var(--color-border, #E5E7EB)";

  return (
    <div
      className="hover-translate"
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "12px",
        padding: "20px 24px",
        borderLeft: `4px solid ${card.accentColor}`,
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {card.label}
        </span>
        {hasTrend && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "4px",
              color: trendColor,
              backgroundColor: trendBg,
              display: "inline-flex",
              alignItems: "center",
            }}
            title={`${trendText} vs previous 30 days`}
          >
            {trendText}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          lineHeight: 1.2,
        }}
        aria-label={`${card.label}: ${card.value}`}
      >
        {card.value}
      </span>
      <span
        style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
        }}
      >
        {card.description}
      </span>
    </div>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const interviewRatePercent =
    stats.total === 0 ? "0%" : `${(stats.interviewRate * 100).toFixed(1)}%`;

  const cards: CardConfig[] = [
    {
      label: "Total",
      value: stats.total,
      description: "All internships",
      accentColor: "var(--color-accent)",
      trend: stats.trends ? { value: stats.trends.totalDelta } : undefined,
    },
    {
      label: "Applied",
      value: stats.byStatus.Applied,
      description: "Awaiting response",
      accentColor: "var(--color-applied-dot)",
      trend: stats.trends ? { value: stats.trends.appliedDelta } : undefined,
    },
    {
      label: "Interview",
      value: stats.byStatus.Interview,
      description: "In progress",
      accentColor: "var(--color-interview-dot)",
      trend: stats.trends ? { value: stats.trends.interviewDelta } : undefined,
    },
    {
      label: "Offer",
      value: stats.byStatus.Offer,
      description: "Received",
      accentColor: "var(--color-offer-dot)",
      trend: stats.trends ? { value: stats.trends.offerDelta } : undefined,
    },
    {
      label: "Rejected",
      value: stats.byStatus.Rejected,
      description: "Not selected",
      accentColor: "var(--color-rejected-dot)",
      trend: stats.trends ? { value: stats.trends.rejectedDelta } : undefined,
    },
    {
      label: "Interview Rate",
      value: interviewRatePercent,
      description: "Interviews + Offers / Total",
      accentColor: "var(--color-applied-text)",
      trend: stats.trends
        ? { value: stats.trends.interviewRateDelta, isPercent: true }
        : undefined,
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
      aria-label="Internship statistics"
    >
      {cards.map((card) => (
        <StatCard key={card.label} card={card} />
      ))}
    </div>
  );
}
