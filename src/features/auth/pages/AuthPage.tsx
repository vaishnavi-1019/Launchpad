import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../useAuth";

type AuthMode = "login" | "signup" | "reset" | "update-password";

function isAuthMode(value: string | null): value is AuthMode {
  return value === "login" || value === "signup" || value === "reset" || value === "update-password";
}

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Authentication request failed.";
}

export function AuthPage() {
  const { configured, loading, user, signIn, signUp, requestPasswordReset, updatePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get("mode");
  const mode: AuthMode = isAuthMode(modeParam) ? modeParam : "login";
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return <div className="auth-route-loading"><LoaderCircle className="supabase-spinner" size={20} /> Checking your session…</div>;
  }
  if (configured && user && mode !== "update-password") return <Navigate replace to={returnTo} />;

  function setMode(nextMode: AuthMode) {
    const params = new URLSearchParams();
    if (nextMode !== "login") params.set("mode", nextMode);
    if (returnTo !== "/") params.set("returnTo", returnTo);
    navigate(`/auth${params.size ? `?${params}` : ""}`, { replace: true });
    setError(null);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!configured) {
      setError("Set the Supabase URL and public key in .env.local, then restart Vite.");
      return;
    }
    if ((mode === "signup" || mode === "update-password") && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        navigate(returnTo, { replace: true });
      } else if (mode === "signup") {
        const signedIn = await signUp(email, password);
        setMessage(signedIn
          ? "Your account is ready."
          : "Account created. Check your email to confirm it before signing in.");
      } else if (mode === "reset") {
        await requestPasswordReset(email);
        setMessage("If an account exists for that email, a password reset link has been sent.");
      } else {
        await updatePassword(password);
        setMessage("Password updated. You can continue to Launchpad.");
        window.setTimeout(() => navigate(returnTo, { replace: true }), 900);
      }
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setSubmitting(false);
    }
  }

  const headings: Record<AuthMode, { title: string; subtitle: string; action: string }> = {
    login: { title: "Welcome back", subtitle: "Sign in to your Launchpad workspace.", action: "Sign in" },
    signup: { title: "Create your account", subtitle: "Start organizing your job search in one place.", action: "Create account" },
    reset: { title: "Reset your password", subtitle: "We’ll email you a secure password reset link.", action: "Send reset link" },
    "update-password": { title: "Choose a new password", subtitle: "Set a new password for your Launchpad account.", action: "Update password" },
  };
  const heading = headings[mode];

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link aria-label="Launchpad home" className="auth-brand" to="/">
          <span><BriefcaseBusiness size={19} /></span> launchpad
        </Link>
        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR JOB SEARCH WORKSPACE</span>
          <h1>{heading.title}</h1>
          <p>{heading.subtitle}</p>
        </div>

        {!configured && (
          <div className="auth-not-configured" role="status">
            Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and a public Supabase key in <code>.env.local</code>, then restart the dev server.
          </div>
        )}
        {error && <div className="auth-feedback auth-feedback--error" role="alert"><AlertCircle size={15} />{error}</div>}
        {message && <div className="auth-feedback auth-feedback--success" role="status"><CheckCircle2 size={15} />{message}</div>}

        <form className="auth-form" onSubmit={submit}>
          {mode !== "update-password" && (
            <label>
              <span>Email address</span>
              <span className="auth-input-wrap"><Mail size={15} /><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></span>
            </label>
          )}
          {mode !== "reset" && (
            <label>
              <span>{mode === "update-password" ? "New password" : "Password"}</span>
              <span className="auth-input-wrap"><LockKeyhole size={15} /><input autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></span>
            </label>
          )}
          {(mode === "signup" || mode === "update-password") && (
            <label>
              <span>Confirm password</span>
              <span className="auth-input-wrap"><LockKeyhole size={15} /><input autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} /></span>
            </label>
          )}
          <button className="button button--primary auth-submit" disabled={!configured || submitting} type="submit">
            {submitting ? <LoaderCircle className="supabase-spinner" size={15} /> : null}
            {submitting ? "Please wait…" : heading.action}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="auth-links">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("reset")} type="button">Forgot password?</button>
              <span>New to Launchpad? <button onClick={() => setMode("signup")} type="button">Create account</button></span>
            </>
          )}
          {mode === "signup" && <span>Already have an account? <button onClick={() => setMode("login")} type="button">Sign in</button></span>}
          {mode === "reset" && <button className="auth-back-link" onClick={() => setMode("login")} type="button"><ArrowLeft size={13} /> Back to sign in</button>}
          {mode === "update-password" && <span>After updating, you’ll return to the app.</span>}
        </div>
        <p className="auth-security-note">Your account data is protected by Supabase authentication and row-level security.</p>
      </section>
    </main>
  );
}
