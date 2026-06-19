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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '12 Weeks' },
  ];

  // SVG Coordinates constants
  const chartHeight = 300;
  const paddingBottom = 45;
  const paddingTop = 35;
  const paddingLeft = 45;
  const paddingRight = 45;
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

  // Calculate smooth curved path using cubic bezier curves with horizontal tangents
  const linePath = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 3;
    const cpY1 = prev.y;
    const cpX2 = prev.x + 2 * (p.x - prev.x) / 3;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    // Map mouse X to SVG coordinate system (0 to 800)
    const svgX = (clickX / width) * 800;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    
    points.forEach((p, idx) => {
      const distance = Math.abs(p.x - svgX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = idx;
      }
    });
    
    setHoveredIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredPoint = hoveredIndex !== null ? chartData[hoveredIndex] : null;
  const hoveredCoords = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '24px',
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
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
              letterSpacing: '-0.2px',
            }}
          >
            Submission Momentum
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
              {totalSubmissions}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {totalSubmissions === 1 ? 'submission' : 'submissions'} in this period
            </span>
          </div>
        </div>

        {/* Premium segmented control pill tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-bg)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        >
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor:
                  selectedPeriod === period.value ? 'var(--color-surface)' : 'transparent',
                color: selectedPeriod === period.value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: selectedPeriod === period.value ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 200ms ease',
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
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
              </linearGradient>
              <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-accent)" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Ambient Background Gradient Frame Border (No grid lines) */}
            <rect
              x={paddingLeft}
              y={paddingTop}
              width={graphWidth}
              height={graphHeight}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Area fill */}
            {points.length > 0 && (
              <path
                d={areaPath}
                fill="url(#chartGradient)"
                style={{ transition: 'd 300ms ease' }}
              />
            )}

            {/* Line chart stroke */}
            {points.length > 0 && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                style={{ transition: 'd 300ms ease' }}
              />
            )}

            {/* Subtle Hover Crosshairs (Vertical + Horizontal) */}
            {hoveredCoords && (
              <g style={{ pointerEvents: 'none' }}>
                {/* Vertical crosshair line */}
                <line
                  x1={hoveredCoords.x}
                  y1={paddingTop}
                  x2={hoveredCoords.x}
                  y2={chartHeight - paddingBottom}
                  stroke="var(--color-accent)"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                  opacity="0.5"
                  style={{ transition: 'x1 100ms ease, x2 100ms ease' }}
                />
                {/* Horizontal crosshair line */}
                <line
                  x1={paddingLeft}
                  y1={hoveredCoords.y}
                  x2={800 - paddingRight}
                  y2={hoveredCoords.y}
                  stroke="var(--color-accent)"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                  opacity="0.5"
                  style={{ transition: 'y1 100ms ease, y2 100ms ease' }}
                />
              </g>
            )}

            {/* Snapped Circle Dot on Hover */}
            {hoveredCoords && (
              <circle
                cx={hoveredCoords.x}
                cy={hoveredCoords.y}
                r="6"
                fill="var(--color-surface)"
                stroke="var(--color-accent)"
                strokeWidth="3"
                style={{
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
                  transition: 'cx 100ms ease, cy 100ms ease'
                }}
              />
            )}

            {/* X-axis labels inside SVG for perfect snapping alignment */}
            {chartData.length > 0 && (
              <g style={{ userSelect: 'none' }}>
                <text
                  x={points[0].x}
                  y={chartHeight - 12}
                  fill="var(--color-text-secondary)"
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="start"
                >
                  {chartData[0].label}
                </text>
                {chartData.length > 2 && (
                  <text
                    x={points[Math.floor(chartData.length / 2)].x}
                    y={chartHeight - 12}
                    fill="var(--color-text-secondary)"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="middle"
                  >
                    {chartData[Math.floor(chartData.length / 2)].label}
                  </text>
                )}
                <text
                  x={points[points.length - 1].x}
                  y={chartHeight - 12}
                  fill="var(--color-text-secondary)"
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="end"
                >
                  {chartData[chartData.length - 1].label}
                </text>
              </g>
            )}
          </svg>

          {/* Premium Dynamic Snapping Tooltip */}
          {hoveredCoords && hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${(hoveredCoords.x / 800) * 100}%`,
                top: `${(hoveredCoords.y / chartHeight) * 100 - 15}%`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-surface)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: 'var(--shadow-modal)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                transition: 'left 100ms ease, top 100ms ease',
                zIndex: 50,
              }}
            >
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {hoveredPoint.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-bg)', fontWeight: 700 }}>
                {hoveredPoint.count} {hoveredPoint.count === 1 ? 'submission' : 'submissions'}
              </span>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid var(--color-text-primary)',
                }}
              />
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
            borderRadius: '12px',
            marginTop: '12px',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          No applications tracked in this period
        </div>
      )}
    </div>
  );
}
