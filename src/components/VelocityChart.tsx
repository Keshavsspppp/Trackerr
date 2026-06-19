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
  const startDate = new Date(now);

  // Calculate start date based on period
  if (period === '7days') startDate.setDate(now.getDate() - 7);
  else if (period === '30days') startDate.setDate(now.getDate() - 30);
  else if (period === '90days') startDate.setDate(now.getDate() - 90);

  // Determine bucket size
  const bucketSize = period === '7days' ? 'day' : 'week';

  // Filter applications within date range
  const filtered = applications.filter(app =>
    new Date(app.createdAt) >= startDate
  );

  // Group by bucket and count
  const buckets = new Map<string, number>();

  filtered.forEach(app => {
    const date = new Date(app.createdAt);
    const bucketKey =
      bucketSize === 'day'
        ? date.toISOString().split('T')[0] // YYYY-MM-DD
        : getWeekStartDate(date).toISOString().split('T')[0]; // Monday of week

    buckets.set(bucketKey, (buckets.get(bucketKey) || 0) + 1);
  });

  // Convert to array and add labels
  return Array.from(buckets.entries())
    .map(([date, count]) => ({
      date,
      count,
      label:
        bucketSize === 'day'
          ? new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : `Week of ${new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}`,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function VelocityChart({ applications }: VelocityChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30days');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const chartData = useMemo(
    () => aggregateApplicationsByPeriod(applications, selectedPeriod),
    [applications, selectedPeriod]
  );

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  const periods: Array<{ value: TimePeriod; label: string }> = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #E5E7EB',
      }}
    >
      {/* Header with Period Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}
        >
          Application Velocity
        </h3>

        <div style={{ display: 'flex', gap: '8px' }}>
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor:
                  selectedPeriod === period.value ? '#3B82F6' : '#F3F4F6',
                color: selectedPeriod === period.value ? '#FFFFFF' : '#6B7280',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (selectedPeriod !== period.value) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#E5E7EB';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== period.value) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    '#F3F4F6';
                }
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ position: 'relative', height: '300px' }}>
          <svg
            viewBox="0 0 800 300"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={(i * 300) / 4}
                x2="800"
                y2={(i * 300) / 4}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}

            {/* Line chart */}
            {chartData.length > 1 && (
              <polyline
                points={chartData
                  .map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 800;
                    const y = 300 - (d.count / maxCount) * 250 - 25;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {chartData.map((d, i) => {
              const x = (i / Math.max(chartData.length - 1, 1)) * 800;
              const y = 300 - (d.count / maxCount) * 250 - 25;

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#1F2937',
                color: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {hoveredPoint.label}: {hoveredPoint.count} application
              {hoveredPoint.count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: '14px',
          }}
        >
          No applications in this period
        </div>
      )}

      {/* X-axis labels */}
      {chartData.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '12px',
            fontSize: '12px',
            color: '#6B7280',
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
