"use client";

import { useState } from 'react';

interface FunnelChartProps {
  stats: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
}

interface StageConfig {
  label: string;
  count: number;
  color: string;
  bg: string;
}

export default function FunnelChart({ stats }: FunnelChartProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Forward-funnel stages (Applied → Interview → Offer)
  const funnelStages: StageConfig[] = [
    { label: 'Applied',   count: stats.applied,   color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Interview', count: stats.interview, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Offer',     count: stats.offer,     color: '#10B981', bg: '#ECFDF5' },
  ];

  // Rejected is shown separately below as a drop-off metric
  const rejected = stats.rejected;

  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  const getConversionRate = (current: number, previous: number) =>
    previous === 0 ? '–' : `${((current / previous) * 100).toFixed(1)}%`;

  // Min bar width so a label is always readable
  const MIN_WIDTH_PCT = 18;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.2px',
          }}
        >
          Internship Funnel
        </h3>
        {/* Rejected pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: '#FEF2F2',
            borderRadius: '999px',
            border: '1px solid #FECACA',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#EF4444',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
            {rejected} Rejected
          </span>
        </div>
      </div>

      {/* Funnel bars — centered trapezoid style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {funnelStages.map((stage, index) => {
          const widthPct = Math.max(
            MIN_WIDTH_PCT,
            maxCount > 0 ? (stage.count / maxCount) * 100 : MIN_WIDTH_PCT
          );
          const prevStage = funnelStages[index - 1];
          const convRate = index > 0
            ? getConversionRate(stage.count, prevStage.count)
            : null;
          const isHovered = hoveredStage === stage.label;

          return (
            <div key={stage.label}>
              {/* Conversion arrow between stages */}
              {index > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '4px 0',
                    color: '#9CA3AF',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1v10M2 7l4 4 4-4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ color: '#6B7280' }}>{convRate} conversion</span>
                </div>
              )}

              {/* The funnel bar itself — centered */}
              <div
                style={{ display: 'flex', justifyContent: 'center' }}
                onMouseEnter={() => setHoveredStage(stage.label)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '52px',
                    backgroundColor: isHovered
                      ? stage.color
                      : stage.bg,
                    border: `2px solid ${stage.color}`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    cursor: 'default',
                    transition: 'width 300ms ease, background-color 200ms ease, box-shadow 200ms ease',
                    boxShadow: isHovered
                      ? `0 4px 16px ${stage.color}40`
                      : '0 1px 3px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle diagonal fill accent */}
                  {!isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg, ${stage.color}12 0%, transparent 60%)`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isHovered ? '#FFFFFF' : stage.color,
                      letterSpacing: '-0.1px',
                      position: 'relative',
                      zIndex: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stage.label}
                  </span>

                  <span
                    style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: isHovered ? '#FFFFFF' : '#111827',
                      position: 'relative',
                      zIndex: 1,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {stage.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom summary row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
          Overall offer rate
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#10B981',
          }}
        >
          {stats.applied === 0
            ? '–'
            : `${((stats.offer / stats.applied) * 100).toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
}
