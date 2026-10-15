import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase (navigateur uniquement). Variables dans `.env` :
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   (ou la clé « anon » historique)
 * Jamais de clé service_role ici : tout passe par la RLS.
 */
const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

export const supabaseConfigured = Boolean(url && key);

let client: SupabaseClient<Database> | null = null;

/** Renvoie le client, ou null côté serveur (SSR) ou si Supabase n'est pas configuré. */
export function getSupabase(): SupabaseClient<Database> | null {
  if (typeof window === "undefined" || !url || !key) return null;
  client ??= createClient<Database>(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

export type Role = "apprenant" | "formateur";
export type NiveauDb = "debutant" | "intermediaire" | "avance";

export type Profile = { id: string; nom_complet: string; role: Role; created_at: string };
export type Groupe = { id: string; nom: string; formateur_id: string; code_invitation: string; created_at: string };
export type Tentative = {
  id: string;
  user_id: string;
  cours: string;
  type: "qcm" | "exercice";
  categorie: string | null;
  niveau: NiveauDb | null;
  score: number;
  total: number;
  created_at: string;
};
export type Reponse = { id: string; tentative_id: string; question_id: string; correcte: boolean; reponse_donnee: string | null; created_at: string };

/** Tentative à enregistrer via la RPC enregistrer_tentatives. */
export type NouvelleTentative = {
  cours: string;
  type: "qcm" | "exercice";
  categorie: string | null;
  niveau: NiveauDb | null;
  score: number;
  total: number;
  created_at?: string;
  reponses: { question_id: string; correcte: boolean; reponse_donnee: string | null }[];
};

type FiltresGroupe = { p_groupe: string; p_debut?: string; p_niveau?: string };

// Types de la base (équivalent de `supabase gen types`, écrit à la main pour la migration
// supabase/migrations/20261015120000_espace_formateur.sql).
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: never;
        Update: { nom_complet?: string };
        Relationships: [];
      };
      groupes: {
        Row: Groupe;
        Insert: { nom: string };
        Update: { nom?: string };
        Relationships: [
          { foreignKeyName: "groupes_formateur_id_fkey"; columns: ["formateur_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      membres_groupe: {
        Row: { groupe_id: string; apprenant_id: string; joined_at: string };
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "membres_groupe_groupe_id_fkey"; columns: ["groupe_id"]; isOneToOne: false; referencedRelation: "groupes"; referencedColumns: ["id"] },
          { foreignKeyName: "membres_groupe_apprenant_id_fkey"; columns: ["apprenant_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      tentatives: {
        Row: Tentative;
        Insert: Omit<Tentative, "id" | "user_id" | "created_at"> & { id?: string; user_id?: string; created_at?: string };
        Update: never;
        Relationships: [
          { foreignKeyName: "tentatives_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      reponses: {
        Row: Reponse;
        Insert: Omit<Reponse, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [
          { foreignKeyName: "reponses_tentative_id_fkey"; columns: ["tentative_id"]; isOneToOne: false; referencedRelation: "tentatives"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      rejoindre_groupe: { Args: { p_code: string }; Returns: { id: string; nom: string }[] };
      enregistrer_tentatives: { Args: { p_tentatives: NouvelleTentative[] }; Returns: number };
      progression_apprenant: {
        Args: { p_apprenant?: string };
        Returns: { dimension: "categorie" | "niveau"; cle: string; nb_tentatives: number; taux_reussite: number }[];
      };
      stats_groupe: { Args: FiltresGroupe; Returns: { nb_membres: number; nb_actifs: number; nb_tentatives: number; score_moyen: number | null }[] };
      reussite_par_categorie: { Args: FiltresGroupe; Returns: { categorie: string; nb_tentatives: number; taux_reussite: number }[] };
      resultats_apprenants: {
        Args: FiltresGroupe;
        Returns: {
          apprenant_id: string;
          nom_complet: string;
          nb_tentatives: number;
          score_moyen: number | null;
          derniere_activite: string | null;
          categorie_faible: string | null;
        }[];
      };
      questions_ratees: {
        Args: FiltresGroupe & { p_min_reponses?: number };
        Returns: { question_id: string; nb_reponses: number; nb_echecs: number; taux_echec: number; reponse_frequente: string | null }[];
      };
      tentatives_groupe: {
        Args: FiltresGroupe;
        Returns: { nom_complet: string; created_at: string; type: string; categorie: string | null; niveau: string | null; score: number; total: number }[];
      };
      est_formateur: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
