"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  Plus,
  Download,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Monitor
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
  isDemo?: boolean;
}

type ApplicationStatus = "Applied" | "Interview" | "Offer" | "Rejected";

export default function DashboardClient({
  applications,
  stats: initialStats,
  isDemo = false,
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
  const [analyticsOpen, setAnalyticsOpen] = useState(false); // Collapsed by default
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [demoApps, setDemoApps] = useState<IApplication[]>([]);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const deleteTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(deleteTimeouts.current).forEach(clearTimeout);
    };
  }, []);

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
    const savedAnalytics = localStorage.getItem('trackerr_analytics_open');
    if (savedAnalytics !== null) {
      setAnalyticsOpen(savedAnalytics === 'true');
    }
    const savedTheme = localStorage.getItem('trackerr_theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('trackerr_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  }

  useEffect(() => {
    if (isDemo) {
      setDemoApps(applications);
    }
  }, [applications, isDemo]);

  const stats = useMemo(() => {
    const appsToUse = isDemo ? demoApps : applications;
    const activeApps = appsToUse.filter((app) => !pendingDeleteIds.includes(app._id));

    const byStatus = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
    };
    for (const app of activeApps) {
      const s = app.status;
      if (s in byStatus) {
        byStatus[s] += 1;
      }
    }
    const total = activeApps.length;
    const interviewRate = total === 0 ? 0 : (byStatus.Interview + byStatus.Offer) / total;
    return {
      total,
      byStatus,
      interviewRate,
      trends: initialStats.trends,
    };
  }, [demoApps, applications, pendingDeleteIds, initialStats, isDemo]);

  function handleDemoStatusChange(id: string, newStatus: any) {
    setDemoApps((prev) =>
      prev.map((app) => (app._id === id ? { ...app, status: newStatus, lastUpdated: new Date().toISOString() } : app))
    );
    showToast(`[Demo Sandbox] Moved internship to ${newStatus}`, "success");
  }

  function handleDemoDelete(id: string) {
    setDemoApps((prev) => prev.filter((app) => app._id !== id));
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showToast("Failed to delete application", "error");
      } else {
        handleRefresh();
      }
    } catch {
      showToast("Network error — please try again", "error");
    }
  }

  function triggerDelete(app: IApplication) {
    const id = app._id;
    setPendingDeleteIds((prev) => [...prev, id]);

    showToast(`Deleted internship at ${app.company}`, "success", {
      label: "Undo",
      onClick: () => {
        if (deleteTimeouts.current[id]) {
          clearTimeout(deleteTimeouts.current[id]);
          delete deleteTimeouts.current[id];
        }
        setPendingDeleteIds((prev) => prev.filter((itemId) => itemId !== id));
      },
    });

    const timeout = setTimeout(async () => {
      delete deleteTimeouts.current[id];
      if (isDemo) {
        handleDemoDelete(id);
      } else {
        await handleDelete(id);
      }
      setPendingDeleteIds((prev) => prev.filter((itemId) => itemId !== id));
    }, 5000);

    deleteTimeouts.current[id] = timeout;
  }

  function handleCloseSlideOver() {
    if (isFormDirty) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to discard them?");
      if (!confirmClose) return;
    }
    setSlideOverOpen(false);
    setEditingApplication(undefined);
    setIsFormDirty(false);
  }

  function handleDeleteFromForm(app: IApplication) {
    setIsFormDirty(false);
    setSlideOverOpen(false);
    setEditingApplication(undefined);
    triggerDelete(app);
  }

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
    const savedAnalytics = localStorage.getItem('trackerr_analytics_open');
    if (savedAnalytics !== null) {
      setAnalyticsOpen(savedAnalytics === 'true');
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

  function handleCreated(newApp?: IApplication) {
    setIsFormDirty(false);
    setSlideOverOpen(false);
    setEditingApplication(undefined);
    if (isDemo && newApp) {
      setDemoApps((prev) => [newApp, ...prev]);
    } else {
      handleRefresh();
    }
  }

  function handleUpdated(updatedApp?: IApplication) {
    setIsFormDirty(false);
    setSlideOverOpen(false);
    setEditingApplication(undefined);
    if (isDemo && updatedApp) {
      setDemoApps((prev) =>
        prev.map((app) => (app._id === updatedApp._id ? updatedApp : app))
      );
    } else {
      handleRefresh();
    }
  }

  function handleExportCSV() {
    exportApplicationsToCSV(applications);
    showToast('CSV exported successfully', 'success');
  }

  const userId = session?.user ? (session.user as { id?: string }).id || '' : '';

  const baseApps = isDemo ? demoApps : applications;

  const visibleApps = baseApps.filter((app) => !pendingDeleteIds.includes(app._id));

  const filteredApplications =
    selectedStatus === undefined
      ? visibleApps
      : visibleApps.filter((app) => app.status === selectedStatus);

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
              justifyContent: "space-between",
              padding: "8px 4px",
              marginBottom: "8px",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
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
                  maxWidth: "80px",
                }}
              >
                {userName}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Toggle theme (currently ${theme})`}
              title={`Switch theme (currently ${theme})`}
              style={{
                background: "none",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                padding: "6px",
                cursor: "pointer",
                color: "var(--color-text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-sidebar-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              {theme === "light" ? (
                <Sun size={14} />
              ) : theme === "dark" ? (
                <Moon size={14} />
              ) : (
                <Monitor size={14} />
              )}
            </button>
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
            className="btn-primary"
            style={{ height: "36px", padding: "0 14px", fontSize: "13px" }}
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
            maxWidth: sidebarOpen ? "1200px" : "none",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {isDemo && (
            <div className="demo-banner">
              <span>
                <strong>Demo Sandbox Mode:</strong> You are playing with mock data in-memory. Sign in to save your own applications permanently.
              </span>
              <button
                onClick={() => router.push("/")}
                className="btn-primary"
                style={{ height: "28px", padding: "0 12px", fontSize: "12px", borderRadius: "4px" }}
              >
                Go to Sign In
              </button>
            </div>
          )}
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
              <h1 className="dashboard-header-title">
                {view === "dashboard" ? "Dashboard" : "All Internships"}
              </h1>
            </div>
            {/* Desktop "+ Add Internship" button */}
            <button
              onClick={() => {
                setEditingApplication(undefined);
                setSlideOverOpen(true);
              }}
              className="desktop-add-btn btn-primary"
            >
              <Plus size={16} /> Add Internship
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="card-empty-state">
              <GraduationCap size={64} style={{ color: "var(--color-accent)" }} />
              <h3 className="card-empty-state-title">
                Welcome to Trackerr!
              </h3>
              <p className="card-empty-state-text">
                You haven't tracked any applications yet. Add your first internship to begin tracking your recruitment journey!
              </p>
              <button
                onClick={() => {
                  setEditingApplication(undefined);
                  setSlideOverOpen(true);
                }}
                className="btn-primary"
                style={{ height: "44px", padding: "0 24px" }}
              >
                <Plus size={16} /> Add your first internship
              </button>
            </div>
          ) : (
            <>
              {/* Collapsible Analytics Section — only on Dashboard view */}
              {view === "dashboard" && (
                <section aria-labelledby="analytics-heading" style={{ marginBottom: "28px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "8px 12px",
                      background: "var(--color-surface)",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                    onClick={() => {
                      const next = !analyticsOpen;
                      setAnalyticsOpen(next);
                      localStorage.setItem('trackerr_analytics_open', String(next));
                    }}
                  >
                    <h2
                      id="analytics-heading"
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {analyticsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Analytics & Overview
                    </h2>
                    <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 500 }}>
                      {analyticsOpen ? "Hide" : "Show"}
                    </span>
                  </div>

                  {analyticsOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                      <StatsCards stats={stats} />
                      <FunnelChart
                        stats={{
                          applied: stats.byStatus.Applied,
                          interview: stats.byStatus.Interview,
                          offer: stats.byStatus.Offer,
                          rejected: stats.byStatus.Rejected,
                        }}
                      />
                       <VelocityChart applications={visibleApps} />
                    </div>
                  )}
                </section>
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
                      className="btn-secondary"
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
                    isDemo={isDemo}
                    onDemoStatusChange={handleDemoStatusChange}
                    onDelete={triggerDelete}
                  />
                ) : (
                   <KanbanBoard
                    applications={filteredApplications}
                    onRefresh={handleRefresh}
                    onEdit={(app) => {
                      setEditingApplication(app);
                      setSlideOverOpen(true);
                    }}
                    isDemo={isDemo}
                    onDemoStatusChange={handleDemoStatusChange}
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
        onClose={handleCloseSlideOver}
        title={editingApplication ? "Edit Internship" : "Add Internship"}
      >
         <ApplicationForm
          application={editingApplication}
          onCancel={handleCloseSlideOver}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onDelete={handleDeleteFromForm}
          onDirtyChange={setIsFormDirty}
          showToast={showToast}
          isDemo={isDemo}
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

