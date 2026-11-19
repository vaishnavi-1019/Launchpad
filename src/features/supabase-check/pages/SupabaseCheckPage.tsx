import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  createCrudCheckApplication,
  deleteCrudCheckApplication,
  listCrudCheckApplications,
  updateCrudCheckApplication,
  type CrudCheckApplication,
} from "../services/applicationCrudCheckService";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "The Supabase request failed.";
}

export function SupabaseCheckPage() {
  const [clientState] = useState(() => {
    try {
      return {
        client: isSupabaseConfigured ? getSupabaseClient() : null,
        error: null as string | null,
      };
    } catch (caught) {
      return { client: null, error: errorText(caught) };
    }
  });
  const { client } = clientState;
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(client));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [applications, setApplications] = useState<CrudCheckApplication[]>([]);
  const [error, setError] = useState<string | null>(clientState.error);
  const [message, setMessage] = useState<string | null>(null);

  const refreshApplications = useCallback(async () => {
    if (!client) return;
    setRecordLoading(true);
    setError(null);
    try {
      const records = await listCrudCheckApplications(client);
      setApplications(records);
      setMessage(`Read succeeded: ${records.length} test ${records.length === 1 ? "record" : "records"} found.`);
    } catch (caught) {
      setMessage(null);
      setError(errorText(caught));
    } finally {
      setRecordLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionLoading(false);
      setError(null);
      setMessage(null);
      if (!nextSession) setApplications([]);
    });

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setSessionLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (client && session) void refreshApplications();
  }, [client, refreshApplications, session]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      setMessage("Signed in. Reading your test applications…");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setAuthLoading(false);
    }
  }

  async function signUp() {
    if (!client) return;
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: authError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/supabase-check`,
        },
      });
      if (authError) throw authError;
      setMessage(data.session
        ? "Account created and signed in."
        : "Account created. Confirm your email, then sign in here.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    if (!client) return;
    setAuthLoading(true);
    setError(null);
    try {
      const { error: authError } = await client.auth.signOut();
      if (authError) throw authError;
      setMessage("Signed out.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setAuthLoading(false);
    }
  }

  async function createRecord() {
    if (!client) return;
    setRecordLoading(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createCrudCheckApplication(client);
      setApplications((current) => [created, ...current]);
      setMessage(`Insert succeeded: ${created.company}`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setRecordLoading(false);
    }
  }

  async function updateRecord(application: CrudCheckApplication) {
    if (!client) return;
    setRecordLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateCrudCheckApplication(client, application.id);
      setApplications((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Update succeeded: ${updated.company} is now "${updated.role}".`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setRecordLoading(false);
    }
  }

  async function deleteRecord(application: CrudCheckApplication) {
    if (!client || !window.confirm(`Delete the test record for ${application.company}?`)) return;
    setRecordLoading(true);
    setError(null);
    setMessage(null);
    try {
      await deleteCrudCheckApplication(client, application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setMessage(`Delete succeeded: ${application.company} was removed.`);
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setRecordLoading(false);
    }
  }

  return (
    <div className="supabase-check-page">
      <header className="supabase-check-heading">
        <div>
          <div className="supabase-check-eyebrow"><Database size={14} /> SUPABASE INTEGRATION · TEST MODE</div>
          <h1>Verify your backend connection.</h1>
          <p>Sign in, then exercise owner-protected application reads and CRUD without changing Launchpad’s existing local-data screens.</p>
        </div>
        <span className="supabase-security-mark"><ShieldCheck size={18} /> RLS enabled</span>
      </header>

      {!client ? (
        <section className="supabase-check-panel">
          <div className="supabase-check-panel-heading"><AlertCircle size={17} /><h2>{clientState.error ? "Could not initialize Supabase" : "Supabase environment variables are missing"}</h2></div>
          <p>{clientState.error ?? <>Copy <code>.env.example</code> to <code>.env.local</code>, set the project URL and public publishable key, then restart the Vite server.</>}</p>
          <p className="supabase-key-warning">Use only the Supabase publishable/anon key in the browser. Never put a secret or service-role key in a <code>VITE_</code> variable.</p>
        </section>
      ) : sessionLoading ? (
        <div className="supabase-check-panel supabase-check-loading"><LoaderCircle className="supabase-spinner" size={18} /> Checking Supabase session…</div>
      ) : (
        <>
          {error && <div className="supabase-check-alert supabase-check-alert--error" role="alert"><AlertCircle size={15} />{error}</div>}
          {message && <div className="supabase-check-alert supabase-check-alert--success" role="status"><CheckCircle2 size={15} />{message}</div>}

          {!session ? (
            <section className="supabase-check-panel">
              <div className="supabase-check-panel-heading"><ShieldCheck size={17} /><h2>Authenticate to test row-level security</h2></div>
              <p>Use an existing Supabase account or create a test account. Signup may require email confirmation, depending on your Supabase Auth settings.</p>
              <form className="supabase-auth-form" onSubmit={signIn}>
                <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
                <label>Password<input autoComplete="current-password" minLength={6} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
                <div className="supabase-auth-actions">
                  <button className="button button--primary" disabled={authLoading} type="submit">{authLoading ? "Please wait…" : "Sign in and test"}</button>
                  <button className="button button--secondary" disabled={authLoading} onClick={(event) => {
                    if (event.currentTarget.form?.reportValidity()) void signUp();
                  }} type="button">Create test account</button>
                </div>
              </form>
            </section>
          ) : (
            <section className="supabase-check-panel">
              <div className="supabase-check-user">
                <div>
                  <span className="supabase-check-label">SIGNED IN AS</span>
                  <strong>{session.user.email ?? session.user.id}</strong>
                  <small>Database queries use this user session and are restricted by RLS.</small>
                </div>
                <button className="button button--secondary" disabled={authLoading} onClick={() => void signOut()} type="button"><LogOut size={14} /> Sign out</button>
              </div>
              <div className="supabase-crud-heading">
                <div><h2>Applications CRUD test</h2><p>Only records with the dedicated test prefix are listed or changed here.</p></div>
                <div className="supabase-crud-actions">
                  <button className="button button--secondary" disabled={recordLoading} onClick={() => void refreshApplications()} type="button"><RefreshCw size={13} /> Read</button>
                  <button className="button button--primary" disabled={recordLoading} onClick={() => void createRecord()} type="button"><Plus size={14} /> Insert test record</button>
                </div>
              </div>
              {recordLoading && <div className="supabase-inline-loading"><LoaderCircle className="supabase-spinner" size={14} /> Request in progress…</div>}
              {applications.length === 0 ? (
                <div className="supabase-crud-empty"><Database size={18} /><strong>No test records yet</strong><span>Insert one to verify create, then update and delete it.</span></div>
              ) : (
                <div className="supabase-test-record-list">
                  {applications.map((application) => (
                    <article className="supabase-test-record" key={application.id}>
                      <div><strong>{application.company}</strong><span>{application.role} · {application.status}</span><small>{new Date(application.created_at).toLocaleString()}</small></div>
                      <div className="supabase-test-record-actions">
                        <button className="button button--secondary" disabled={recordLoading || application.role === "Connection verified"} onClick={() => void updateRecord(application)} type="button">{application.role === "Connection verified" ? "Updated" : "Update"}</button>
                        <button aria-label={`Delete ${application.company}`} className="supabase-delete-button" disabled={recordLoading} onClick={() => void deleteRecord(application)} type="button"><Trash2 size={14} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
