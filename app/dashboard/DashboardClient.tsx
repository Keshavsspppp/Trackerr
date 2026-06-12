"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatsCards from "@/src/components/StatsCards";
import StatusFilter from "@/src/components/StatusFilter";
import ApplicationForm from "@/src/components/ApplicationForm";
import ApplicationList, {
  IApplication,
} from "@/src/components/ApplicationList";
import type { IApplicationStats } from "@/app/api/applications/stats/route";

interface DashboardClientProps {
  applications: IApplication[];
  stats: IApplicationStats;
}

type ApplicationStatus = "Applied" | "Interview" | "Offer" | "Rejected";

export default function DashboardClient({
  applications,
  stats,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<
    ApplicationStatus | undefined
  >(undefined);

  // Refresh server component data by triggering a re-render on the server
  function handleRefresh() {
    router.refresh();
  }

  // Filter applications client-side based on selected status
  const filteredApplications =
    selectedStatus === undefined
      ? applications
      : applications.filter((app) => app.status === selectedStatus);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
          Job Application Tracker
        </h1>
      </div>

      {/* Stats Cards */}
      <section aria-labelledby="stats-heading">
        <h2
          id="stats-heading"
          style={{
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Overview
        </h2>
        <StatsCards stats={stats} />
      </section>

      {/* Status Filter */}
      <section aria-labelledby="filter-heading">
        <h2
          id="filter-heading"
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Filter by Status
        </h2>
        <StatusFilter
          stats={stats}
          selectedStatus={selectedStatus}
          onFilter={(status) => setSelectedStatus(status)}
        />
      </section>

      {/* Add Application Form */}
      <section aria-labelledby="form-heading">
        <ApplicationForm onCreated={handleRefresh} />
      </section>

      {/* Application List */}
      <section aria-labelledby="list-heading">
        <h2
          id="list-heading"
          style={{
            margin: "0 0 1rem 0",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "#374151",
          }}
        >
          Applications
          {selectedStatus && (
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "#6b7280",
              }}
            >
              — filtered by {selectedStatus} ({filteredApplications.length})
            </span>
          )}
        </h2>
        <ApplicationList
          applications={filteredApplications}
          onRefresh={handleRefresh}
        />
      </section>
    </div>
  );
}
