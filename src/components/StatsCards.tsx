"use client";

import React, { useState } from "react";

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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '20px 24px',
        borderLeft: `4px solid ${card.accentColor}`,
        boxShadow: hovered
          ? '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'box-shadow 150ms ease, transform 150ms ease',
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
          color: '#6B7280',
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
          color: '#111827',
          lineHeight: 1.2,
        }}
        aria-label={`${card.label}: ${card.value}`}
      >
        {card.value}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: '#9CA3AF',
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
      accentColor: '#6366F1',
    },
    {
      label: 'Applied',
      value: stats.byStatus.Applied,
      description: 'Awaiting response',
      accentColor: '#3B82F6',
    },
    {
      label: 'Interview',
      value: stats.byStatus.Interview,
      description: 'In progress',
      accentColor: '#F59E0B',
    },
    {
      label: 'Offer',
      value: stats.byStatus.Offer,
      description: 'Received',
      accentColor: '#10B981',
    },
    {
      label: 'Rejected',
      value: stats.byStatus.Rejected,
      description: 'Not selected',
      accentColor: '#EF4444',
    },
    {
      label: 'Interview Rate',
      value: interviewRatePercent,
      description: 'Interviews + Offers / Total',
      accentColor: '#8B5CF6',
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
