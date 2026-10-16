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
export type Groupe = { id: string; nom: string; formateur_id: string; code_invitation: string; archive_le: string | null; created_at: string };
export type TypeTentative = "qcm" | "exercice";
export type Tentative = {
  id: string;
  user_id: string;
  cours: string;
  type: TypeTentative;
  categorie: string | null;
  niveau: NiveauDb | null;
  score: number;
  total: number;
  created_at: string;
};
export type Reponse = { id: string; tentative_id: string; question_id: string; correcte: boolean; reponse_donnee: string | null; created_at: string };

/** Travail assigné à un groupe ; categorie / niveau à null = tous. date_limite au format AAAA-MM-JJ. */
export type Devoir = {
  id: string;
  groupe_id: string;
  titre: string;
  type: TypeTentative;
  categorie: string | null;
  niveau: NiveauDb | null;
  date_limite: string | null;
  created_at: string;
};

export type StatutSoumission = "soumis" | "corrige" | "a_refaire";
/** Copie d'un exercice à rendre ; note / commentaire / statut ne changent que via corriger_soumission. */
export type Soumission = {
  id: string;
  exercice_id: string;
  apprenant_id: string;
  groupe_id: string;
  contenu: string;
  statut: StatutSoumission;
  note: number | null;
  note_sur: number;
  commentaire: string | null;
  corrige_par: string | null;
  corrige_le: string | null;
  consulte_le: string | null;
  soumis_le: string;
  created_at: string;
  updated_at: string;
};

/** Tentative à enregistrer via la RPC enregistrer_tentatives. */
export type NouvelleTentative = {
  cours: string;
  type: TypeTentative;
  categorie: string | null;
  niveau: NiveauDb | null;
  score: number;
  total: number;
  created_at?: string;
  reponses: { question_id: string; correcte: boolean; reponse_donnee: string | null }[];
};

type FiltresGroupe = { p_groupe: string; p_debut?: string; p_niveau?: string };

// Types de la base (équivalent de `supabase gen types`, écrit à la main pour la migration
// supabase/migrations/20261015120000_espace_formateur.sql et suivantes).
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
        Update: { nom?: string; archive_le?: string | null };
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
      devoirs: {
        Row: Devoir;
        Insert: Omit<Devoir, "id" | "created_at">;
        Update: { titre?: string; date_limite?: string | null };
        Relationships: [
          { foreignKeyName: "devoirs_groupe_id_fkey"; columns: ["groupe_id"]; isOneToOne: false; referencedRelation: "groupes"; referencedColumns: ["id"] },
        ];
      };
      exercices_a_rendre: {
        Row: { id: string; note_sur: number };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      soumissions: {
        Row: Soumission;
        Insert: { exercice_id: string; groupe_id: string; contenu: string };
        Update: { contenu?: string };
        Relationships: [
          { foreignKeyName: "soumissions_apprenant_id_fkey"; columns: ["apprenant_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "soumissions_corrige_par_fkey"; columns: ["corrige_par"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "soumissions_groupe_id_fkey"; columns: ["groupe_id"]; isOneToOne: false; referencedRelation: "groupes"; referencedColumns: ["id"] },
          { foreignKeyName: "soumissions_exercice_id_fkey"; columns: ["exercice_id"]; isOneToOne: false; referencedRelation: "exercices_a_rendre"; referencedColumns: ["id"] },
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
      regenerer_code_invitation: { Args: { p_groupe: string }; Returns: string };
      suivi_devoirs: {
        Args: { p_groupe: string };
        Returns: {
          devoir_id: string;
          apprenant_id: string;
          nom_complet: string;
          nb_tentatives: number;
          nb_questions: number;
          score_moyen: number | null;
          derniere_tentative: string | null;
          fait: boolean;
        }[];
      };
      mes_devoirs: { Args: Record<string, never>; Returns: (Devoir & { groupe_nom: string; nb_questions: number; fait: boolean })[] };
      corriger_soumission: { Args: { p_id: string; p_note: number | null; p_commentaire: string; p_statut: "corrige" | "a_refaire" }; Returns: Soumission };
      marquer_copie_consultee: { Args: { p_id: string }; Returns: undefined };
      activite_membres: { Args: { p_groupe: string }; Returns: { apprenant_id: string; joined_at: string; derniere_activite: string | null }[] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
