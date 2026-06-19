"use client";

interface SourceBadgeProps {
  source: 'manual' | 'extension' | 'csv_import';
}

export default function SourceBadge({ source }: SourceBadgeProps) {
  // Only render badge for 'extension' and 'csv_import' sources (hide 'manual')
  if (source === 'manual') {
    return null;
  }

  const config = {
    extension: {
      bg: '#E9D5FF',
      text: '#6B21A8',
      label: 'Extension',
    },
    csv_import: {
      bg: '#CCFBF1',
      text: '#115E59',
      label: 'CSV Import',
    },
  };

  const style = config[source];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '10px',
        fontWeight: 600,
        borderRadius: '3px',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      }}
    >
      {style.label}
    </span>
  );
}
