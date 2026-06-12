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

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: "#3b82f6",    // blue
  Interview: "#f59e0b",  // amber
  Offer: "#10b981",      // green
  Rejected: "#ef4444",   // red
};

export default function StatusFilter({
  stats,
  selectedStatus,
  onFilter,
}: StatusFilterProps) {
  const handleClick = (status: ApplicationStatus | undefined) => {
    onFilter(status);
  };

  const isAllSelected = selectedStatus === undefined;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center",
      }}
      role="group"
      aria-label="Filter applications by status"
    >
      {/* "All" button */}
      <button
        onClick={() => handleClick(undefined)}
        aria-pressed={isAllSelected}
        style={{
          padding: "6px 14px",
          borderRadius: "9999px",
          border: "2px solid",
          borderColor: isAllSelected ? "#6366f1" : "#d1d5db",
          backgroundColor: isAllSelected ? "#6366f1" : "transparent",
          color: isAllSelected ? "#ffffff" : "#374151",
          fontWeight: isAllSelected ? 600 : 400,
          cursor: "pointer",
          fontSize: "14px",
          transition: "all 0.15s ease",
        }}
      >
        All{" "}
        <span
          style={{
            display: "inline-block",
            minWidth: "20px",
            textAlign: "center",
            backgroundColor: isAllSelected ? "rgba(255,255,255,0.25)" : "#e5e7eb",
            color: isAllSelected ? "#ffffff" : "#374151",
            borderRadius: "9999px",
            padding: "0 6px",
            fontSize: "12px",
            fontWeight: 600,
            marginLeft: "4px",
          }}
        >
          {stats.total}
        </span>
      </button>

      {/* Per-status buttons */}
      {STATUSES.map((status) => {
        const isSelected = selectedStatus === status;
        const count = stats.byStatus[status];
        const color = STATUS_COLORS[status];

        return (
          <button
            key={status}
            onClick={() => handleClick(status)}
            aria-pressed={isSelected}
            style={{
              padding: "6px 14px",
              borderRadius: "9999px",
              border: "2px solid",
              borderColor: isSelected ? color : "#d1d5db",
              backgroundColor: isSelected ? color : "transparent",
              color: isSelected ? "#ffffff" : "#374151",
              fontWeight: isSelected ? 600 : 400,
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.15s ease",
            }}
          >
            {status}{" "}
            <span
              style={{
                display: "inline-block",
                minWidth: "20px",
                textAlign: "center",
                backgroundColor: isSelected
                  ? "rgba(255,255,255,0.25)"
                  : "#e5e7eb",
                color: isSelected ? "#ffffff" : "#374151",
                borderRadius: "9999px",
                padding: "0 6px",
                fontSize: "12px",
                fontWeight: 600,
                marginLeft: "4px",
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
