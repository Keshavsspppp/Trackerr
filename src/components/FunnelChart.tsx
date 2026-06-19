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
}

export default function FunnelChart({ stats }: FunnelChartProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Define funnel stages (excluding Rejected as it's not part of forward conversion)
  const stages: StageConfig[] = [
    { label: 'Applied', count: stats.applied, color: '#3B82F6' },
    { label: 'Interview', count: stats.interview, color: '#F59E0B' },
    { label: 'Offer', count: stats.offer, color: '#10B981' },
    { label: 'Rejected', count: stats.rejected, color: '#EF4444' },
  ];

  // Find max count for width calculation
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  // Calculate conversion rates
  const getConversionRate = (currentCount: number, previousCount: number): string => {
    if (previousCount === 0) return '0%';
    return `${((currentCount / previousCount) * 100).toFixed(1)}%`;
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #E5E7EB',
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '20px',
        }}
      >
        Application Funnel
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const conversionRate = index > 0 ? getConversionRate(stage.count, stages[index - 1].count) : null;

          return (
            <div
              key={stage.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredStage(stage.label)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div
                style={{
                  width: `${widthPercentage}%`,
                  minWidth: stage.count > 0 ? '80px' : '0',
                  height: '48px',
                  backgroundColor: stage.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 200ms ease',
                  cursor: 'default',
                  boxShadow: hoveredStage === stage.label
                    ? '0 4px 12px rgba(0,0,0,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  transform: hoveredStage === stage.label ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                <span>{stage.label}</span>
                <span>
                  {stage.count} {conversionRate && `(${conversionRate})`}
                </span>
              </div>

              {/* Tooltip */}
              {hoveredStage === stage.label && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1F2937',
                    color: '#FFFFFF',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {stage.label}: {stage.count} applications
                  {conversionRate && ` (${conversionRate} conversion)`}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: '4px solid #1F2937',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
