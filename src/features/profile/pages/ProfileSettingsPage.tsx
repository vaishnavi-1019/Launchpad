import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save, UserRound } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/features/auth/useAuth";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { loadProfile, saveProfile, type ProfileDraft } from "../services/profileService";

export function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    setError(null);
    void loadProfile(getSupabaseClient(), user.id).then((record) => {
      if (active) setProfile({
        display_name: record.display_name || user.user_metadata.display_name || "",
        target_role: record.target_role,
      });
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : "Could not load your profile.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  function updateField(key: keyof ProfileDraft, value: string) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
    setMessage(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await saveProfile(getSupabaseClient(), user.id, profile);
      setProfile({ display_name: saved.display_name, target_role: saved.target_role });
      setMessage("Profile settings saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-settings-page">
      <header className="profile-page-heading">
        <div>
          <div className="profile-page-eyebrow"><UserRound size={14} /> ACCOUNT SETTINGS</div>
          <h1>Your profile</h1>
          <p>Keep your Launchpad workspace details up to date.</p>
        </div>
      </header>

      {error && <div className="profile-feedback profile-feedback--error" role="alert"><AlertCircle size={15} />{error}</div>}
      {message && <div className="profile-feedback profile-feedback--success" role="status"><CheckCircle2 size={15} />{message}</div>}

      <section className="profile-settings-panel">
        <div className="profile-panel-heading">
          <span className="profile-panel-icon"><UserRound size={17} /></span>
          <div><h2>Personal information</h2><p>Your email is managed by Supabase Authentication.</p></div>
        </div>
        {loading ? (
          <LoadingSkeleton label="Loading your profile" rows={3} />
        ) : profile ? (
          <form className="profile-settings-form" onSubmit={submit}>
            <label>
              <span>Email address</span>
              <input disabled type="email" value={user?.email ?? ""} />
              <small>Email changes and verification are managed through Supabase Auth.</small>
            </label>
            <label>
              <span>Display name</span>
              <input autoComplete="name" maxLength={100} onChange={(event) => updateField("display_name", event.target.value)} required value={profile.display_name} />
            </label>
            <label>
              <span>Target job role <em>Optional</em></span>
              <input maxLength={120} onChange={(event) => updateField("target_role", event.target.value)} placeholder="e.g. Frontend Engineer" value={profile.target_role} />
            </label>
            <div className="profile-settings-actions">
              <span>Changes are private to your account.</span>
              <button className="button button--primary" disabled={saving || loading} type="submit">
                {saving ? <LoaderCircle className="supabase-spinner" size={14} /> : <Save size={14} />}
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>
        ) : (
          <p className="profile-load-help">Could not load a profile. Check the error above, then retry the page.</p>
        )}
      </section>
    </div>
  );
}
