import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContext";

function errorFrom(value: unknown): Error {
  return value instanceof Error ? value : new Error("Supabase authentication failed.");
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [clientState] = useState(() => {
    try {
      return {
        client: isSupabaseConfigured ? getSupabaseClient() : null,
        error: null as Error | null,
      };
    } catch (error) {
      return { client: null, error: errorFrom(error) };
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(clientState.client));

  useEffect(() => {
    const client = clientState.client;
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Could not restore the Supabase session.", error);
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Could not restore the Supabase session.", error);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [clientState.client]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!clientState.client) throw clientState.error ?? new Error("Supabase is not configured.");
    const { error } = await clientState.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, [clientState]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!clientState.client) throw clientState.error ?? new Error("Supabase is not configured.");
    const { data, error } = await clientState.client.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    if (error) throw error;
    return Boolean(data.session);
  }, [clientState]);

  const signOut = useCallback(async () => {
    if (!clientState.client) throw clientState.error ?? new Error("Supabase is not configured.");
    const { error } = await clientState.client.auth.signOut();
    if (error) throw error;
  }, [clientState]);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!clientState.client) throw clientState.error ?? new Error("Supabase is not configured.");
    const { error } = await clientState.client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?mode=update-password`,
    });
    if (error) throw error;
  }, [clientState]);

  const updatePassword = useCallback(async (password: string) => {
    if (!clientState.client) throw clientState.error ?? new Error("Supabase is not configured.");
    const { error } = await clientState.client.auth.updateUser({ password });
    if (error) throw error;
  }, [clientState]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(clientState.client),
    loading,
    session,
    user: session?.user ?? null,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  }), [
    clientState.client,
    loading,
    requestPasswordReset,
    session,
    signIn,
    signOut,
    signUp,
    updatePassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
