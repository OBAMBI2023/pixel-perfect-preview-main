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
  points_acquis: string | null;
  points_a_ameliorer: string | null;
  corrige_par: string | null;
  corrige_le: string | null;
  consulte_le: string | null;
  soumis_le: string;
  created_at: string;
  updated_at: string;
};

/** Séance en direct : le formateur fait défiler la présentation, les membres du groupe suivent. */
export type SeanceDirect = {
  id: string;
  groupe_id: string;
  formateur_id: string;
  presentation: string;
  diapo_courante: number; // index à partir de 0
  diapo_depuis: string;
  question_diapo: number | null;
  question_texte: string | null;
  analogie_visible: boolean; // analogie de la cuisine affichée (diapositive à cartes)
  statut: "en_cours" | "terminee";
  debut_le: string;
  fin_le: string | null;
};
export type TypeReaction = "pas_compris" | "question" | "reponse";
export type ReactionSeance = {
  id: string;
  seance_id: string;
  apprenant_id: string;
  diapo: number;
  type: TypeReaction;
  texte: string | null;
  created_at: string;
};

export type ModeParticipation = "presentiel" | "distance";
/** Parcours d'accueil d'un participant ; écrit uniquement via la RPC enregistrer_accueil. */
export type AccueilParticipant = {
  user_id: string;
  etapes: string[];
  mode_participation: ModeParticipation | null;
  accueil_vu_le: string | null;
  termine_le: string | null;
  created_at: string;
  updated_at: string;
};

export type NiveauEtudes = "licence" | "master" | "doctorat" | "postdoc" | "enseignant" | "autre";
/** Profil chercheur : modifié par son seul propriétaire, lu aussi par le formateur de ses groupes (RLS). */
export type ProfilChercheur = {
  user_id: string;
  discipline: string;
  niveau_etudes: NiveauEtudes;
  etablissement: string | null;
  sujet: string;
  problematique: string | null;
  objectif: string;
  created_at: string;
  updated_at: string;
};
export type ExerciceRecherche = "prompt" | "mots-cles" | "equation" | "references";
/** Travail d'un exercice personnalisé ; contenu propre à chaque exercice (voir src/lib/recherche.ts). */
export type TravailRecherche = {
  user_id: string;
  exercice: ExerciceRecherche;
  sujet: string;
  contenu: Record<string, unknown>;
  termine: boolean;
  termine_le: string | null;
  created_at: string;
  updated_at: string;
};

/** Analyse d'un article (exercice de pertinence) ; écrite uniquement via enregistrer_analyse_pertinence. */
export type AnalysePertinence = {
  user_id: string;
  article_id: string;
  mode: "corrige" | "mon-sujet";
  sujet: string;
  article: Record<string, unknown> | null;
  contenu: Record<string, unknown>;
  score: number | null;
  premier_score: number | null;
  tentative_id: string | null;
  nb_analyses: number;
  created_at: string;
  updated_at: string;
};

/** Retour du formateur sur un exercice personnalisé ou une analyse d'article ; écrit via enregistrer_retour. */
export type ObjetRetour = "travail_recherche" | "analyse_pertinence";
export type RetourFormateur = {
  id: string;
  apprenant_id: string;
  formateur_id: string;
  objet: ObjetRetour;
  objet_id: string;
  statut: "corrige" | "a_refaire";
  note: number | null;
  note_sur: number | null;
  appreciation: string | null;
  points_acquis: string | null;
  points_a_ameliorer: string | null;
  consulte_le: string | null;
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
      seances_direct: {
        Row: SeanceDirect;
        Insert: { groupe_id: string; presentation?: string };
        Update: { diapo_courante?: number; question_diapo?: number | null; question_texte?: string | null; analogie_visible?: boolean; statut?: "terminee" };
        Relationships: [
          { foreignKeyName: "seances_direct_groupe_id_fkey"; columns: ["groupe_id"]; isOneToOne: false; referencedRelation: "groupes"; referencedColumns: ["id"] },
          { foreignKeyName: "seances_direct_formateur_id_fkey"; columns: ["formateur_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      reactions_seance: {
        Row: ReactionSeance;
        Insert: { seance_id: string; diapo: number; type: TypeReaction; texte?: string | null };
        Update: never;
        Relationships: [
          { foreignKeyName: "reactions_seance_seance_id_fkey"; columns: ["seance_id"]; isOneToOne: false; referencedRelation: "seances_direct"; referencedColumns: ["id"] },
          { foreignKeyName: "reactions_seance_apprenant_id_fkey"; columns: ["apprenant_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      accueil_participant: {
        Row: AccueilParticipant;
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "accueil_participant_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profils_chercheur: {
        Row: ProfilChercheur;
        Insert: Pick<ProfilChercheur, "discipline" | "niveau_etudes" | "etablissement" | "sujet" | "problematique" | "objectif">;
        Update: Partial<Pick<ProfilChercheur, "discipline" | "niveau_etudes" | "etablissement" | "sujet" | "problematique" | "objectif">>;
        Relationships: [
          { foreignKeyName: "profils_chercheur_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      travaux_recherche: {
        Row: TravailRecherche;
        Insert: Pick<TravailRecherche, "exercice" | "sujet" | "contenu" | "termine">;
        Update: Partial<Pick<TravailRecherche, "exercice" | "sujet" | "contenu" | "termine">>;
        Relationships: [
          { foreignKeyName: "travaux_recherche_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      analyses_pertinence: {
        Row: AnalysePertinence;
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "analyses_pertinence_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      retours_formateur: {
        Row: RetourFormateur;
        Insert: never;
        Update: never;
        Relationships: [
          { foreignKeyName: "retours_formateur_apprenant_id_fkey"; columns: ["apprenant_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "retours_formateur_formateur_id_fkey"; columns: ["formateur_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
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
      enregistrer_accueil: {
        Args: { p_etape?: string; p_fait?: boolean; p_mode?: ModeParticipation; p_vu?: boolean };
        Returns: AccueilParticipant;
      };
      enregistrer_analyse_pertinence: {
        Args: { p_article: string; p_mode: "corrige" | "mon-sujet"; p_sujet: string; p_article_info: Record<string, unknown> | null; p_analyse: Record<string, unknown>; p_score: number | null };
        Returns: AnalysePertinence;
      };
      corriger_soumission_detaillee: {
        Args: { p_id: string; p_note: number | null; p_commentaire: string; p_statut: "corrige" | "a_refaire"; p_points_acquis: string; p_points_a_ameliorer: string };
        Returns: Soumission;
      };
      enregistrer_retour: {
        Args: {
          p_apprenant: string;
          p_objet: ObjetRetour;
          p_objet_id: string;
          p_note: number | null;
          p_note_sur: number | null;
          p_appreciation: string;
          p_points_acquis: string;
          p_points_a_ameliorer: string;
          p_statut: "corrige" | "a_refaire";
        };
        Returns: RetourFormateur;
      };
      marquer_retour_consulte: { Args: { p_id: string }; Returns: undefined };
      activite_membres: { Args: { p_groupe: string }; Returns: { apprenant_id: string; joined_at: string; derniere_activite: string | null }[] };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
