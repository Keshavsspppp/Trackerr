"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  Plus,
  Download,
  GraduationCap
} from "lucide-react";
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
  const [editingApplication, setEditingApplication] = useState<IApplication | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load saved view mode and sidebar configuration from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('trackerr_view_mode');
    if (savedView === 'table' || savedView === 'kanban') {
      setViewMode(savedView);
    }
    const savedSidebar = localStorage.getItem('trackerr_sidebar_open');
    if (savedSidebar !== null) {
      setSidebarOpen(savedSidebar === 'true');
    }
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          setSlideOverOpen(false);
          setEditingApplication(undefined);
          target.blur();
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingApplication(undefined);
        setSlideOverOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === '1') {
        setSelectedStatus(undefined);
      } else if (e.key === '2') {
        setSelectedStatus('Applied');
      } else if (e.key === '3') {
        setSelectedStatus('Interview');
      } else if (e.key === '4') {
        setSelectedStatus('Offer');
      } else if (e.key === 'Escape') {
        setSlideOverOpen(false);
        setEditingApplication(undefined);
        setShowShortcutsModal(false);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('trackerr_sidebar_open', String(next));
      return next;
    });
  }

  function handleViewChange(newView: 'table' | 'kanban') {
    setViewMode(newView);
    localStorage.setItem('trackerr_view_mode', newView);
  }

  function handleRefresh() {
    router.refresh();
  }

  function handleCreated() {
    setSlideOverOpen(false);
    setEditingApplication(undefined);
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
      <aside
        className="layout-sidebar"
        aria-label="Main navigation"
        style={!sidebarOpen ? { display: 'none' } : undefined}
      >
        {/* Wordmark with Logo */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="Trackerr Logo" width="28" height="28" style={{ borderRadius: "50%" }} />
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              Trackerr
              <span style={{ color: "var(--color-accent)" }}>.</span>
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <Menu size={18} />
          </button>
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
            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </button>
          <button
            className={`nav-item${view === "all" ? " active" : ""}`}
            aria-current={view === "all" ? "page" : undefined}
            onClick={() => { setView("all"); setSelectedStatus(undefined); }}
            style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
          >
            <ClipboardList size={18} aria-hidden="true" />
            All Internships
          </button>
        </nav>

        {/* User section */}
        <div
          style={{
            padding: "16px 12px",
            borderTop: "1px solid var(--color-border)",
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
                  background: "var(--color-accent)",
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
                color: "var(--color-text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "140px",
              }}
            >
              {userName}
            </span>
          </div>

          {/* Sign out button */}
          <button
            className="nav-item"
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div
        className="layout-main"
        style={!sidebarOpen ? { marginLeft: 0 } : undefined}
      >
        {/* Mobile top header */}
        <header
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
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
                color: "var(--color-text-primary)",
                minWidth: "44px",
                minHeight: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Menu size={24} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo.png" alt="Trackerr Logo" width="24" height="24" style={{ borderRadius: "50%" }} />
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                Trackerr<span style={{ color: "var(--color-accent)" }}>.</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingApplication(undefined);
              setSlideOverOpen(true);
            }}
            aria-label="Add new application"
            className="hover-btn-accent"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              height: "36px",
              padding: "0 14px",
              background: "var(--color-accent)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add
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
                background: "var(--color-surface)",
                zIndex: 46,
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--shadow-modal)",
              }}
            >
              <div
                style={{
                  padding: "20px 20px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <img src="/logo.png" alt="Trackerr Logo" width="28" height="28" style={{ borderRadius: "50%" }} />
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Trackerr<span style={{ color: "var(--color-accent)" }}>.</span>
                </span>
              </div>
              <nav style={{ flex: 1, padding: "16px 12px" }}>
                <button
                  className={`nav-item${view === "dashboard" ? " active" : ""}`}
                  onClick={() => { setView("dashboard"); setSelectedStatus(undefined); setMobileMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
                >
                  <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
                </button>
                <button
                  className={`nav-item${view === "all" ? " active" : ""}`}
                  style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
                  onClick={() => { setView("all"); setSelectedStatus(undefined); setMobileMenuOpen(false); }}
                >
                  <ClipboardList size={18} aria-hidden="true" /> All Internships
                </button>
              </nav>
              <div
                style={{
                  padding: "16px 12px",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <button
                  className="nav-item"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{ color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <LogOut size={18} aria-hidden="true" /> Sign out
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  aria-label="Expand sidebar"
                  className="desktop-only-menu-btn"
                  style={{
                    background: "none",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    padding: "8px",
                    color: "var(--color-text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <Menu size={20} />
                </button>
              )}
              <h1
                style={{
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                {view === "dashboard" ? "Dashboard" : "All Internships"}
              </h1>
            </div>
            {/* Desktop "+ Add Internship" button */}
            <button
              onClick={() => {
                setEditingApplication(undefined);
                setSlideOverOpen(true);
              }}
              className="desktop-add-btn hover-btn-accent"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "40px",
                padding: "0 18px",
                background: "var(--color-accent)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} /> Add Internship
            </button>
          </div>

          {applications.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 24px",
                background: "var(--color-surface)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                textAlign: "center",
                gap: "16px",
                boxShadow: "var(--shadow-card)",
                marginTop: "20px",
              }}
            >
              <GraduationCap size={64} style={{ color: "var(--color-accent)" }} />
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                Welcome to Trackerr!
              </h3>
              <p style={{ margin: 0, fontSize: "15px", color: "var(--color-text-secondary)", maxWidth: "420px", lineHeight: 1.5 }}>
                You haven't tracked any applications yet. Add your first internship to begin tracking your recruitment journey!
              </p>
              <button
                onClick={() => {
                  setEditingApplication(undefined);
                  setSlideOverOpen(true);
                }}
                className="hover-btn-accent"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "44px",
                  padding: "0 24px",
                  background: "var(--color-accent)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={16} /> Add your first internship
              </button>
            </div>
          ) : (
            <>
              {/* Stats Cards — only on Dashboard view */}
              {view === "dashboard" && (
                <section aria-labelledby="stats-heading" style={{ marginBottom: "28px" }}>
                  <h2
                    id="stats-heading"
                    style={{
                      margin: "0 0 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-text-secondary)",
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
                      color: "var(--color-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <span>{view === "all" ? `All Internships (${filteredApplications.length})` : "Internships"}</span>
                    {view === "dashboard" && selectedStatus && (
                      <span
                        style={{
                          fontWeight: 400,
                          textTransform: "none",
                          letterSpacing: 0,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        — {selectedStatus} ({filteredApplications.length})
                      </span>
                    )}
                    <span 
                      onClick={() => setShowShortcutsModal(true)}
                      style={{ 
                        marginLeft: "8px", 
                        fontSize: "11px", 
                        color: "var(--color-text-muted)", 
                        fontWeight: 400, 
                        textTransform: "none",
                        letterSpacing: 0,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Click to view shortcuts help"
                    >
                      (Press <kbd style={{ padding: "1px 5px", border: "1px solid var(--color-border)", borderRadius: "4px", background: "var(--color-bg)", fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>?</kbd> for shortcuts)
                    </span>
                  </h2>

                  {/* View Toggle and CSV buttons */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
                    <button
                      onClick={handleExportCSV}
                      className="hover-btn-neutral"
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Download size={16} /> Export CSV
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
                    onEdit={(app) => {
                      setEditingApplication(app);
                      setSlideOverOpen(true);
                    }}
                  />
                ) : (
                  <KanbanBoard
                    applications={filteredApplications}
                    onRefresh={handleRefresh}
                    onEdit={(app) => {
                      setEditingApplication(app);
                      setSlideOverOpen(true);
                    }}
                  />
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {/* ── Slide-over panel ── */}
      <SlideOver
        isOpen={slideOverOpen}
        onClose={() => {
          setSlideOverOpen(false);
          setEditingApplication(undefined);
        }}
        title={editingApplication ? "← Edit Internship" : "← Add Internship"}
      >
        <ApplicationForm
          application={editingApplication}
          onCancel={() => {
            setSlideOverOpen(false);
            setEditingApplication(undefined);
          }}
          onCreated={handleCreated}
          onUpdated={() => {
            setSlideOverOpen(false);
            setEditingApplication(undefined);
            handleRefresh();
          }}
          showToast={showToast}
        />
      </SlideOver>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
              padding: '24px',
              boxShadow: 'var(--shadow-modal)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--color-text-secondary)', padding: '4px' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Add new internship', keys: ['N'] },
                { label: 'Search internships', keys: ['/'] },
                { label: 'Filter: All', keys: ['1'] },
                { label: 'Filter: Applied', keys: ['2'] },
                { label: 'Filter: Interview', keys: ['3'] },
                { label: 'Filter: Offer', keys: ['4'] },
                { label: 'Close modal / cancel', keys: ['Esc'] },
                { label: 'Toggle this help panel', keys: ['?'] },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {item.keys.map(k => (
                      <kbd
                        key={k}
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '11px',
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          color: 'var(--color-text-primary)',
                          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                          fontWeight: 700,
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

