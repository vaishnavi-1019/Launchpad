import { LogOut, Search, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";

export function Topbar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [authError, setAuthError] = useState("");
  const currentPage = pathname.startsWith("/applications")
    ? pathname.startsWith("/supabase-applications")
      ? "Supabase applications"
      : "Applications"
    : pathname.startsWith("/interview-prep")
      ? "Interview prep"
      : pathname.startsWith("/skill-gap")
        ? "Skill roadmap"
        : pathname.startsWith("/supabase-check")
          ? "Supabase connection test"
              : pathname.startsWith("/settings/profile")
                ? "Profile settings"
              : pathname.startsWith("/job-discovery")
            ? "Discover jobs"
            : pathname.startsWith("/match-analyzer")
              ? "Match analyzer"
              : "Overview";

  return (
    <header className="app-topbar">
      <div className="topbar-context"><span>Workspace</span><span className="topbar-divider">/</span><strong>{currentPage}</strong></div>
      <div className="topbar-actions">
        <Link className="topbar-search" to="/applications?focusSearch=1" aria-label="Search applications">
          <Search size={16} /><span>Search applications</span><kbd>⌘ K</kbd>
        </Link>
        {user ? (
          <>
            <Link aria-label="Profile settings" className="icon-button" title="Profile settings" to="/settings/profile">
              <Settings size={16} />
            </Link>
            <span className="avatar avatar--small" aria-label={user.email ?? "Signed-in user"}>
              {(user.email?.[0] ?? "U").toLocaleUpperCase()}
            </span>
            <button
              aria-label="Sign out"
              className="icon-button"
              onClick={() => {
                setAuthError("");
                void signOut().catch((error: unknown) => {
                  setAuthError(error instanceof Error ? error.message : "Could not sign out.");
                });
              }}
              title={authError || "Sign out"}
              type="button"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <Link className="button button--secondary topbar-auth-link" to="/auth">Sign in</Link>
        )}
      </div>
      {authError && <span className="topbar-auth-error" role="alert">{authError}</span>}
    </header>
  );
}
