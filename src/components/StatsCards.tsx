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

function StatCard({ card }: { card: CardConfig }) {
  return (
    <div
      className="hover-translate"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '20px 24px',
        borderLeft: `4px solid ${card.accentColor}`,
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        cursor: 'default',
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {card.label}
      </span>
      <span
        style={{
          fontSize: '36px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1.2,
        }}
        aria-label={`${card.label}: ${card.value}`}
      >
        {card.value}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--color-text-muted)',
        }}
      >
        {card.description}
      </span>
    </div>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const interviewRatePercent =
    stats.total === 0
      ? '0%'
      : `${(stats.interviewRate * 100).toFixed(1)}%`;

  const cards: CardConfig[] = [
    {
      label: 'Total',
      value: stats.total,
      description: 'All internships',
      accentColor: 'var(--color-accent)',
    },
    {
      label: 'Applied',
      value: stats.byStatus.Applied,
      description: 'Awaiting response',
      accentColor: 'var(--color-applied-dot)',
    },
    {
      label: 'Interview',
      value: stats.byStatus.Interview,
      description: 'In progress',
      accentColor: 'var(--color-interview-dot)',
    },
    {
      label: 'Offer',
      value: stats.byStatus.Offer,
      description: 'Received',
      accentColor: 'var(--color-offer-dot)',
    },
    {
      label: 'Rejected',
      value: stats.byStatus.Rejected,
      description: 'Not selected',
      accentColor: 'var(--color-rejected-dot)',
    },
    {
      label: 'Interview Rate',
      value: interviewRatePercent,
      description: 'Interviews + Offers / Total',
      accentColor: 'var(--color-applied-text)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px',
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
