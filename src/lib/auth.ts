import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useSyncExternalStore } from "react";
import { getSupabase, supabaseConfigured, type Profile } from "@/lib/supabase";
import { importerProgressionLocale } from "@/lib/progression";

export type AuthState = {
  status: "loading" | "ready";
  configured: boolean;
  user: User | null;
  profile: Profile | null;
};

const serverState: AuthState = { status: "loading", configured: supabaseConfigured, user: null, profile: null };
let state: AuthState = serverState;
const listeners = new Set<() => void>();
let initialised = false;

function setState(patch: Partial<AuthState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getAuthState() {
  return state;
}

async function chargerProfil(session: Session | null) {
  const sb = getSupabase();
  const user = session?.user ?? null;
  if (!sb || !user) {
    setState({ status: "ready", user: null, profile: null });
    return;
  }
  const { data } = await sb.from("profiles").select("id, nom_complet, role, created_at").eq("id", user.id).maybeSingle();
  setState({ status: "ready", user, profile: data ?? null });
  void importerProgressionLocale(user.id);
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  const sb = getSupabase();
  if (!sb) {
    setState({ status: "ready" });
    return;
  }
  sb.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" && state.user?.id === session?.user.id) return;
    // Pas d'appel Supabase directement dans ce callback (risque de blocage) : on le diffère.
    setTimeout(() => void chargerProfil(session), 0);
  });
}

export function useAuth(): AuthState {
  useEffect(init, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverState,
  );
}

const messagesErreur: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou mot de passe incorrect."],
  [/email not confirmed/i, "Confirme d'abord ton adresse e-mail grâce au lien reçu par courriel."],
  [/user already registered/i, "Un compte existe déjà avec cette adresse e-mail."],
  [/password should be at least/i, "Le mot de passe est trop court."],
  [/rate limit|too many requests/i, "Trop de tentatives. Réessaie dans quelques minutes."],
  [/unable to validate email|invalid email/i, "Adresse e-mail invalide."],
];

export function traduireErreur(message: string): string {
  return messagesErreur.find(([re]) => re.test(message))?.[1] ?? "Une erreur est survenue. Réessaie.";
}

const NON_CONFIGURE = "La connexion n'est pas encore configurée sur ce site.";

export async function seConnecter(email: string, motDePasse: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return NON_CONFIGURE;
  const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
  return error ? traduireErreur(error.message) : null;
}

/** Renvoie { erreur } ou { confirmation: true } si l'e-mail doit être confirmé avant la connexion. */
export async function sInscrire(nomComplet: string, email: string, motDePasse: string): Promise<{ erreur?: string; confirmation?: boolean }> {
  const sb = getSupabase();
  if (!sb) return { erreur: NON_CONFIGURE };
  const { data, error } = await sb.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { nom_complet: nomComplet }, emailRedirectTo: `${window.location.origin}/connexion` },
  });
  if (error) return { erreur: traduireErreur(error.message) };
  return data.session ? {} : { confirmation: true };
}

export async function seDeconnecter() {
  await getSupabase()?.auth.signOut();
}
