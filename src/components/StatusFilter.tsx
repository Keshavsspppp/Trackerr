"use client";

import React from "react";

type ApplicationStatus = "Applied" | "Interview" | "Offer" | "Rejected";

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

interface StatusFilterProps {
  stats: IApplicationStats;
  selectedStatus?: ApplicationStatus | undefined;
  onFilter: (status: ApplicationStatus | undefined) => void;
}

const STATUSES: ApplicationStatus[] = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
];

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  activeBg: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  Applied:   { bg: "var(--color-applied-bg)", text: "var(--color-applied-text)", dot: "var(--color-applied-dot)",  activeBg: "var(--color-applied-dot)"  },
  Interview: { bg: "var(--color-interview-bg)", text: "var(--color-interview-text)", dot: "var(--color-interview-dot)",  activeBg: "var(--color-interview-dot)"  },
  Offer:     { bg: "var(--color-offer-bg)", text: "var(--color-offer-text)", dot: "var(--color-offer-dot)",  activeBg: "var(--color-offer-dot)"  },
  Rejected:  { bg: "var(--color-rejected-bg)", text: "var(--color-rejected-text)", dot: "var(--color-rejected-dot)",  activeBg: "var(--color-rejected-dot)"  },
};

export default function StatusFilter({
  stats,
  selectedStatus,
  onFilter,
}: StatusFilterProps) {
  const isAllSelected = selectedStatus === undefined;

  const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid",
    transition: "all 150ms ease",
    whiteSpace: "nowrap",
    minHeight: "36px",
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: "8px",
        alignItems: "center",
        overflowX: "auto",
        paddingBottom: "4px",
      }}
      role="group"
      aria-label="Filter applications by status"
    >
      {/* "All" pill */}
      <button
        onClick={() => onFilter(undefined)}
        aria-pressed={isAllSelected}
        className={isAllSelected ? "hover-btn-accent" : "hover-btn-neutral"}
        style={{
          ...pillBase,
          background: isAllSelected ? "var(--color-accent)" : "var(--color-surface)",
          borderColor: isAllSelected ? "var(--color-accent)" : "var(--color-border)",
          color: isAllSelected ? "#FFFFFF" : "var(--color-text-primary)",
          fontWeight: isAllSelected ? 600 : 500,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: isAllSelected ? "#FFFFFF" : "var(--color-text-muted)",
            flexShrink: 0,
          }}
        />
        All
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "20px",
            height: "20px",
            borderRadius: "999px",
            background: isAllSelected ? "rgba(255,255,255,0.25)" : "var(--color-bg)",
            color: isAllSelected ? "#FFFFFF" : "var(--color-text-secondary)",
            fontSize: "11px",
            fontWeight: 600,
            padding: "0 5px",
          }}
        >
          {stats.total}
        </span>
      </button>

      {/* Per-status pills */}
      {STATUSES.map((status) => {
        const isSelected = selectedStatus === status;
        const cfg = STATUS_CONFIG[status];
        const count = stats.byStatus[status];

        return (
          <button
            key={status}
            onClick={() => onFilter(status)}
            aria-pressed={isSelected}
            className={isSelected ? "hover-btn-accent" : "hover-btn-neutral"}
            style={{
              ...pillBase,
              background: isSelected ? cfg.activeBg : "var(--color-surface)",
              borderColor: isSelected ? cfg.activeBg : "var(--color-border)",
              color: isSelected ? "#FFFFFF" : "var(--color-text-primary)",
              fontWeight: isSelected ? 600 : 500,
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isSelected ? "#FFFFFF" : cfg.dot,
                flexShrink: 0,
              }}
            />
            {status}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                borderRadius: "999px",
                background: isSelected ? "rgba(255,255,255,0.25)" : "var(--color-bg)",
                color: isSelected ? "#FFFFFF" : "var(--color-text-secondary)",
                fontSize: "11px",
                fontWeight: 600,
                padding: "0 5px",
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
