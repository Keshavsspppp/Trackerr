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
  Applied:   { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6",  activeBg: "#3B82F6"  },
  Interview: { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B",  activeBg: "#F59E0B"  },
  Offer:     { bg: "#D1FAE5", text: "#065F46", dot: "#10B981",  activeBg: "#10B981"  },
  Rejected:  { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444",  activeBg: "#EF4444"  },
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
        style={{
          ...pillBase,
          background: isAllSelected ? "#6366F1" : "#FFFFFF",
          borderColor: isAllSelected ? "#6366F1" : "#E5E7EB",
          color: isAllSelected ? "#FFFFFF" : "#374151",
          fontWeight: isAllSelected ? 600 : 500,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: isAllSelected ? "#FFFFFF" : "#9CA3AF",
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
            background: isAllSelected ? "rgba(255,255,255,0.25)" : "#F3F4F6",
            color: isAllSelected ? "#FFFFFF" : "#6B7280",
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
            style={{
              ...pillBase,
              background: isSelected ? cfg.activeBg : "#FFFFFF",
              borderColor: isSelected ? cfg.activeBg : "#E5E7EB",
              color: isSelected ? "#FFFFFF" : "#374151",
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
                background: isSelected ? "rgba(255,255,255,0.25)" : "#F3F4F6",
                color: isSelected ? "#FFFFFF" : "#6B7280",
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
