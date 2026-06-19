"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import StatsCards from "@/src/components/StatsCards";
import StatusFilter from "@/src/components/StatusFilter";
import ApplicationForm from "@/src/components/ApplicationForm";
import ApplicationList, {
  IApplication,
} from "@/src/components/ApplicationList";
import SlideOver from "@/src/components/SlideOver";
import { useToast } from "@/src/components/Toast";
import ViewToggle from "@/src/components/ViewToggle";
import KanbanBoard from "@/src/components/KanbanBoard";
import FunnelChart from "@/src/components/FunnelChart";
import CSVImporter from "@/src/components/CSVImporter";
import { exportApplicationsToCSV } from "@/src/lib/csvExport";
import type { IApplicationStats } from "@/app/api/applications/stats/route";
import dynamic from "next/dynamic";
import LoadingSkeleton from "@/src/components/LoadingSkeleton";

const VelocityChart = dynamic(() => import("@/src/components/VelocityChart"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="chart" />,
});

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
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [view, setView] = useState<"dashboard" | "all">("dashboard");
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedStatus, setSelectedStatus] = useState<
    ApplicationStatus | undefined
  >(undefined);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load saved view mode from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('trackerr_view_mode');
    if (savedView === 'table' || savedView === 'kanban') {
      setViewMode(savedView);
    }
  }, []);

  function handleViewChange(newView: 'table' | 'kanban') {
    setViewMode(newView);
    localStorage.setItem('trackerr_view_mode', newView);
  }

  function handleRefresh() {
    router.refresh();
  }

  function handleCreated() {
    setSlideOverOpen(false);
    handleRefresh();
  }

  function handleExportCSV() {
    exportApplicationsToCSV(applications);
    showToast('CSV exported successfully', 'success');
  }

  const userId = session?.user ? (session.user as { id?: string }).id || '' : '';

  const filteredApplications =
    selectedStatus === undefined
      ? applications
      : applications.filter((app) => app.status === selectedStatus);

  const userName =
    session?.user?.name ?? session?.user?.email ?? "User";
  const userImage = session?.user?.image ?? null;
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="layout-root">
      {/* ── Sidebar (desktop only) ── */}
      <aside className="layout-sidebar" aria-label="Main navigation">
        {/* Wordmark */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.3px",
            }}
          >
            Trackerr
            <span style={{ color: "#3B82F6" }}>.</span>
          </span>
        </div>

        {/* Nav links */}
        <nav
          style={{ flex: 1, padding: "16px 12px" }}
          aria-label="Primary navigation"
        >
          <button
            className={`nav-item${view === "dashboard" ? " active" : ""}`}
            aria-current={view === "dashboard" ? "page" : undefined}
            onClick={() => { setView("dashboard"); setSelectedStatus(undefined); }}
          >
            <span aria-hidden="true" style={{ fontSize: "16px" }}>
              📊
            </span>
            Dashboard
          </button>
          <button
            className={`nav-item${view === "all" ? " active" : ""}`}
            aria-current={view === "all" ? "page" : undefined}
            onClick={() => { setView("all"); setSelectedStatus(undefined); }}
            style={{ marginTop: "4px" }}
          >
            <span aria-hidden="true" style={{ fontSize: "16px" }}>
              📋
            </span>
            All Internships
          </button>
        </nav>

        {/* User section */}
        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          {/* Avatar + name row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 4px",
              marginBottom: "8px",
            }}
          >
            {userImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={userImage}
                alt={userName}
                width={32}
                height={32}
                style={{ borderRadius: "50%", flexShrink: 0 }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#3B82F6",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {userInitial}
              </div>
            )}
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </span>
          </div>

          {/* Sign out button */}
          <button
            className="nav-item"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ color: "#6B7280" }}
          >
            <span aria-hidden="true" style={{ fontSize: "16px" }}>
              🚪
            </span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="layout-main">
        {/* Mobile top header */}
        <header
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            position: "sticky",
            top: 0,
            zIndex: 40,
          }}
          className="mobile-header"
          aria-label="Mobile header"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                fontSize: "20px",
                lineHeight: 1,
                color: "#374151",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ☰
            </button>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              Trackerr<span style={{ color: "#3B82F6" }}>.</span>
            </span>
          </div>
          <button
            onClick={() => setSlideOverOpen(true)}
            aria-label="Add new application"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "36px",
              padding: "0 14px",
              background: "#3B82F6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add
          </button>
        </header>

        {/* Mobile overlay menu */}
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 45,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "240px",
                background: "#FFFFFF",
                zIndex: 46,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  padding: "24px 20px 20px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Trackerr<span style={{ color: "#3B82F6" }}>.</span>
                </span>
              </div>
              <nav style={{ flex: 1, padding: "16px 12px" }}>
                <button
                  className={`nav-item${view === "dashboard" ? " active" : ""}`}
                  onClick={() => { setView("dashboard"); setSelectedStatus(undefined); setMobileMenuOpen(false); }}
                >
                  <span aria-hidden="true">📊</span> Dashboard
                </button>
                <button
                  className={`nav-item${view === "all" ? " active" : ""}`}
                  style={{ marginTop: "4px" }}
                  onClick={() => { setView("all"); setSelectedStatus(undefined); setMobileMenuOpen(false); }}
                >
                  <span aria-hidden="true">📋</span> All Internships
                </button>
              </nav>
              <div
                style={{
                  padding: "16px 12px",
                  borderTop: "1px solid #E5E7EB",
                }}
              >
                <button
                  className="nav-item"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ color: "#6B7280" }}
                >
                  <span aria-hidden="true">🚪</span> Sign out
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page body */}
        <main
          style={{
            flex: 1,
            padding: "32px 32px 48px",
            maxWidth: "1200px",
            width: "100%",
          }}
        >
          {/* Desktop page header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.3px",
              }}
            >
              {view === "dashboard" ? "Dashboard" : "All Internships"}
            </h1>
            {/* Desktop "+ Add Application" button */}
            <button
              onClick={() => setSlideOverOpen(true)}
              className="desktop-add-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "40px",
                padding: "0 18px",
                background: "#3B82F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#2563EB";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#3B82F6";
              }}
            >
              + Add Internship
            </button>
          </div>

          {/* Stats Cards — only on Dashboard view */}
          {view === "dashboard" && (
          <section aria-labelledby="stats-heading" style={{ marginBottom: "28px" }}>
            <h2
              id="stats-heading"
              style={{
                margin: "0 0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Overview
            </h2>
            <StatsCards stats={stats} />
          </section>
          )}

          {/* Analytics Charts — only on Dashboard view */}
          {view === "dashboard" && (
            <>
              <section style={{ marginBottom: "28px" }}>
                <FunnelChart
                  stats={{
                    applied: stats.byStatus.Applied,
                    interview: stats.byStatus.Interview,
                    offer: stats.byStatus.Offer,
                    rejected: stats.byStatus.Rejected,
                  }}
                />
              </section>

              <section style={{ marginBottom: "28px" }}>
                <VelocityChart applications={applications} />
              </section>
            </>
          )}

          {/* Filter pills + table section */}
          <section aria-labelledby="apps-heading">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <h2
                id="apps-heading"
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {view === "all" ? `All Internships (${filteredApplications.length})` : "Internships"}
                {view === "dashboard" && selectedStatus && (
                  <span
                    style={{
                      marginLeft: "8px",
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                      color: "#9CA3AF",
                    }}
                  >
                    — {selectedStatus} ({filteredApplications.length})
                  </span>
                )}
              </h2>

              {/* View Toggle and CSV buttons */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
                <button
                  onClick={handleExportCSV}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#6366F1",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#4F46E5";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6366F1";
                  }}
                >
                  📤 Export CSV
                </button>
                <CSVImporter userId={userId} onImportComplete={handleRefresh} />
              </div>
            </div>

            {/* Filter pills — only on Dashboard view */}
            {view === "dashboard" && (
            <div style={{ marginBottom: "20px" }}>
              <StatusFilter
                stats={stats}
                selectedStatus={selectedStatus}
                onFilter={(status) => setSelectedStatus(status)}
              />
            </div>
            )}

            {/* Application table or Kanban board */}
            {viewMode === 'table' ? (
              <ApplicationList
                applications={filteredApplications}
                onRefresh={handleRefresh}
              />
            ) : (
              <KanbanBoard
                applications={filteredApplications}
                onRefresh={handleRefresh}
              />
            )}
          </section>
        </main>
      </div>

      {/* ── Slide-over panel ── */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        title="← Add Internship"
      >
        <ApplicationForm
          onCancel={() => setSlideOverOpen(false)}
          onCreated={handleCreated}
          showToast={showToast}
        />
      </SlideOver>
    </div>
  );
}
