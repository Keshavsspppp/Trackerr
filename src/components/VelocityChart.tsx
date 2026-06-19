"use client";

import { useState, useMemo } from 'react';
import type { IApplication } from './ApplicationList';

interface VelocityChartProps {
  applications: IApplication[];
}

type TimePeriod = '7days' | '30days' | '90days';

interface DataPoint {
  date: string;
  count: number;
  label: string;
}

function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function aggregateApplicationsByPeriod(
  applications: IApplication[],
  period: TimePeriod
): DataPoint[] {
  const now = new Date();
  const dataPoints: DataPoint[] = [];

  // Generate continuous dates based on period
  if (period === '7days') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      dataPoints.push({ date: key, count: 0, label });
    }
  } else if (period === '30days') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      dataPoints.push({ date: key, count: 0, label });
    }
  } else if (period === '90days') {
    const mondayOfCurrentWeek = getWeekStartDate(new Date());
    for (let i = 11; i >= 0; i--) {
      const d = new Date(mondayOfCurrentWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const label = `Week of ${d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })}`;
      dataPoints.push({ date: key, count: 0, label });
    }
  }

  // Populate counts from applications
  applications.forEach(app => {
    const appDate = new Date(app.createdAt);
    if (period === '90days') {
      const monday = getWeekStartDate(appDate).toISOString().split('T')[0];
      const point = dataPoints.find(p => p.date === monday);
      if (point) {
        point.count += 1;
      }
    } else {
      const dayKey = appDate.toISOString().split('T')[0];
      const point = dataPoints.find(p => p.date === dayKey);
      if (point) {
        point.count += 1;
      }
    }
  });

  return dataPoints;
}

export default function VelocityChart({ applications }: VelocityChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const chartData = useMemo(
    () => aggregateApplicationsByPeriod(applications, selectedPeriod),
    [applications, selectedPeriod]
  );

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const totalSubmissions = useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData]
  );

  const periods: Array<{ value: TimePeriod; label: string }> = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 12 Weeks' },
  ];

  // SVG Coordinates constants
  const chartHeight = 300;
  const paddingBottom = 45;
  const paddingTop = 35;
  const paddingLeft = 40;
  const paddingRight = 40;
  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = 800 - paddingLeft - paddingRight;

  // Path coordinates
  const points = chartData.map((d, i) => {
    const x = chartData.length === 1
      ? 400
      : paddingLeft + (i / (chartData.length - 1)) * graphWidth;
    const y = chartHeight - paddingBottom - (d.count / maxCount) * graphHeight;
    return { x, y, val: d.count };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header with Period Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
              letterSpacing: '-0.2px',
            }}
          >
            Submission Momentum
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {totalSubmissions}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              submissions
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={selectedPeriod === period.value ? 'hover-btn-accent' : 'hover-btn-neutral'}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                border: selectedPeriod === period.value ? 'none' : '1px solid var(--color-border)',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor:
                  selectedPeriod === period.value ? 'var(--color-accent)' : 'var(--color-surface)',
                color: selectedPeriod === period.value ? '#FFFFFF' : 'var(--color-text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {totalSubmissions > 0 ? (
        <div style={{ position: 'relative', height: '220px', marginTop: '12px' }}>
          <svg
            viewBox="0 0 800 300"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + ratio * graphHeight;
              return (
                <line
                  key={ratio}
                  x1={paddingLeft}
                  y1={y}
                  x2={800 - paddingRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area fill */}
            {points.length > 0 && (
              <path
                d={areaPath}
                fill="url(#chartGradient)"
              />
            )}

            {/* Line chart stroke */}
            {points.length > 0 && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="5"
                fill="var(--color-surface)"
                stroke="var(--color-accent)"
                strokeWidth="3"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(chartData[i])}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-surface)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                zIndex: 10,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {hoveredPoint.label}: {hoveredPoint.count} submission
              {hoveredPoint.count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            height: '220px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '14px',
            border: '1px dashed var(--color-border)',
            borderRadius: '8px',
            marginTop: '12px',
          }}
        >
          No applications tracked in this period
        </div>
      )}

      {/* X-axis labels */}
      {chartData.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            paddingLeft: '12px',
            paddingRight: '12px',
          }}
        >
          <span>{chartData[0].label}</span>
          {chartData.length > 2 && (
            <span>{chartData[Math.floor(chartData.length / 2)].label}</span>
          )}
          <span>{chartData[chartData.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}
