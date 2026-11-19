import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { ApplicationFormModal } from "../components/ApplicationFormModal";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useAuth } from "@/features/auth/useAuth";
import { getSupabaseClient } from "@/lib/supabase";
import {
  createApplicationInSupabase,
  deleteApplicationFromSupabase,
  importLocalApplicationsToSupabase,
  listApplicationsFromSupabase,
  moveApplicationInSupabase,
  updateApplicationInSupabase,
} from "../services/supabaseApplicationsService";
import { useApplications } from "../hooks/useApplications";
import {
  APPLICATION_STATUSES,
  type ApplicationDraft,
  type ApplicationStatus,
  type JobApplication,
} from "../types";

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "The Supabase application request failed.";
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SupabaseApplicationsPage() {
  const { user } = useAuth();
  const { applications: localApplications } = useApplications();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<JobApplication | null>(null);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const records = await listApplicationsFromSupabase(getSupabaseClient(), user.id);
      setApplications(records);
      setMessage(`Loaded ${records.length} Supabase ${records.length === 1 ? "application" : "applications"}.`);
    } catch (caught) {
      setMessage(null);
      setError(errorText(caught));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const sortedApplications = useMemo(
    () => [...applications].sort((first, second) =>
      Date.parse(second.createdAt) - Date.parse(first.createdAt)),
    [applications],
  );

  async function saveApplication(draft: ApplicationDraft) {
    if (!user) return false;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editing) {
        const updated = await updateApplicationInSupabase(
          getSupabaseClient(),
          user.id,
          editing,
          draft,
        );
        setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
        setEditing(null);
        setMessage(`${updated.company} updated in Supabase.`);
      } else {
        const created = await createApplicationInSupabase(getSupabaseClient(), user.id, draft);
        setApplications((current) => [created, ...current]);
        setIsAdding(false);
        setMessage(`${created.company} saved to Supabase.`);
      }
      return true;
    } catch (caught) {
      setError(errorText(caught));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(application: JobApplication, status: ApplicationStatus) {
    if (!user || application.status === status) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await moveApplicationInSupabase(
        getSupabaseClient(),
        user.id,
        application,
        status,
      );
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${application.company} moved to ${APPLICATION_STATUSES.find((item) => item.value === status)?.label ?? status}.`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication(application: JobApplication) {
    if (!user || !window.confirm(`Permanently delete the Supabase application for ${application.company}?`)) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await deleteApplicationFromSupabase(getSupabaseClient(), user.id, application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setMessage(`${application.company} deleted from Supabase.`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  async function importLocalApplications() {
    if (!user || localApplications.length === 0 || saving) return;
    const confirmed = window.confirm(
      `Copy ${localApplications.length} local applications to Supabase? Your local records will not be changed or deleted.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await importLocalApplicationsToSupabase(
        getSupabaseClient(),
        user.id,
        localApplications,
      );
      const refreshed = await listApplicationsFromSupabase(getSupabaseClient(), user.id);
      setApplications(refreshed);
      setMessage(
        `Imported ${result.imported} local ${result.imported === 1 ? "application" : "applications"}; skipped ${result.skipped} already in Supabase. Your local records are unchanged.`,
      );
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="supabase-applications-page">
      <header className="supabase-applications-heading">
        <div>
          <div className="supabase-check-eyebrow"><BriefcaseBusiness size={14} /> SUPABASE DATA · YOUR ACCOUNT</div>
          <h1>Applications, connected.</h1>
          <p>This staged tracker reads and writes your authenticated Supabase records. Existing local applications are unchanged.</p>
        </div>
        <div className="supabase-applications-actions">
          <button className="button button--secondary" disabled={loading || saving} onClick={() => void loadApplications()} type="button">
            <RefreshCw size={14} /> Refresh
          </button>
          {localApplications.length > 0 && (
            <button className="button button--secondary" disabled={loading || saving} onClick={() => void importLocalApplications()} type="button">
              Import local ({localApplications.length})
            </button>
          )}
          <button className="button button--primary" disabled={saving} onClick={() => setIsAdding(true)} type="button">
            <Plus size={16} /> Add application
          </button>
        </div>
      </header>

      {error && <div className="supabase-check-alert supabase-check-alert--error" role="alert"><AlertCircle size={15} />{error}<button aria-label="Dismiss error" onClick={() => setError(null)} type="button"><X size={13} /></button></div>}
      {message && !error && <div className="supabase-check-alert supabase-check-alert--success" role="status"><CheckCircle2 size={15} />{message}<button aria-label="Dismiss message" onClick={() => setMessage(null)} type="button"><X size={13} /></button></div>}

      <section className="supabase-applications-panel">
        <div className="supabase-applications-panel-heading">
          <div><h2>Your Supabase applications</h2><p>{applications.length} records · scoped to {user?.email}</p></div>
          {saving && <span className="supabase-inline-loading"><LoaderCircle className="supabase-spinner" size={14} /> Saving…</span>}
        </div>
        {loading ? (
          <LoadingSkeleton label="Loading your applications" rows={4} />
        ) : applications.length === 0 ? (
          <div className="supabase-applications-empty">
            <BriefcaseBusiness size={21} />
            <strong>No Supabase applications yet</strong>
            <span>Add an application here, or copy your local collection to Supabase. Importing leaves your browser records unchanged.</span>
            <button className="button button--primary" onClick={() => setIsAdding(true)} type="button"><Plus size={14} /> Add first application</button>
          </div>
        ) : (
          <div className="supabase-applications-table-wrap">
            <table className="supabase-applications-table">
              <thead><tr><th>Company &amp; role</th><th>Date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {sortedApplications.map((application) => {
                  return (
                    <tr key={application.id}>
                      <td><span className="supabase-app-company"><i>{application.company.slice(0, 1).toLocaleUpperCase()}</i><span><strong>{application.company}</strong><small>{application.role}</small></span></span></td>
                      <td>{formatDate(application.applicationDate ?? application.createdAt)}</td>
                      <td>
                        <label className="supabase-status-select">
                          <span className="sr-only">Status for {application.company}</span>
                          <select disabled={saving} onChange={(event) => {
                            const next = APPLICATION_STATUSES.find((item) => item.value === event.target.value);
                            if (next) void changeStatus(application, next.value);
                          }} value={application.status}>
                            {APPLICATION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </select>
                        </label>
                      </td>
                      <td>
                        <div className="supabase-app-row-actions">
                          <button className="button button--secondary" disabled={saving} onClick={() => setEditing(application)} type="button">Edit</button>
                          <button aria-label={`Delete ${application.company}`} className="supabase-delete-button" disabled={saving} onClick={() => void deleteApplication(application)} type="button"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(isAdding || editing) && (
        <ApplicationFormModal
          application={editing ?? undefined}
          onClose={() => {
            if (saving) return;
            setIsAdding(false);
            setEditing(null);
          }}
          onSave={saveApplication}
        />
      )}
    </div>
  );
}
