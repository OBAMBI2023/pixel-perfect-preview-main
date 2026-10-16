import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { articlePertinence } from "@/data/articles-pertinence";
import { chapitreComprendreIA } from "@/data/chapitre-2-4";
import { idQuestion, resumesChapitres, toutesLesLecons } from "@/data/chapitres";
import { exercicesARendre } from "@/data/exercices-a-rendre";
import { SEUIL_TERMINE } from "@/lib/progression-chapitres";
import { EXERCICES_RECHERCHE } from "@/lib/recherche";
import {
  getSupabase,
  type AnalysePertinence,
  type Database,
  type Groupe,
  type ProfilChercheur,
  type RetourFormateur,
  type Soumission,
  type TravailRecherche,
} from "@/lib/supabase";

/**
 * Suivi des apprenants par le formateur : uniquement les données réellement enregistrées.
 * Toutes les lectures passent par la RLS (membres des groupes du formateur connecté).
 */

/* ───────── Statuts des travaux ───────── */

export type StatutTravail = "non_commence" | "en_cours" | "a_corriger" | "a_refaire" | "corrige";

export const STATUTS_TRAVAIL: { id: StatutTravail; label: string; classe: string }[] = [
  { id: "a_corriger", label: "Soumis · à corriger", classe: "bg-tint-amber text-tint-amber-fg" },
  { id: "a_refaire", label: "Nouvelle soumission demandée", classe: "bg-tint-rose text-tint-rose-fg" },
  { id: "corrige", label: "Corrigé", classe: "bg-tint-green text-tint-green-fg" },
  { id: "en_cours", label: "En cours", classe: "bg-secondary text-secondary-foreground" },
  { id: "non_commence", label: "Non commencé", classe: "bg-muted text-muted-foreground" },
];
export const statutTravail = (id: StatutTravail) => STATUTS_TRAVAIL.find((s) => s.id === id)!;

export type TypeTravail = "a_rendre" | "personnalise" | "pertinence";
export const TYPES_TRAVAIL: { id: TypeTravail; label: string }[] = [
  { id: "a_rendre", label: "Exercices à rendre" },
  { id: "personnalise", label: "Exercices personnalisés" },
  { id: "pertinence", label: "Analyses d'articles" },
];

export type TravailSuivi = {
  cle: string;
  type: TypeTravail;
  apprenantId: string;
  titre: string;
  statut: StatutTravail;
  /** Dernière activité de l'apprenant sur ce travail (null si non commencé). */
  date: string | null;
  /** Note ou état de l'évaluation, tel qu'enregistré (jamais calculé à la place du formateur). */
  evaluation: string;
  soumission?: Soumission;
  travail?: TravailRecherche;
  analyse?: AnalysePertinence;
  retour?: RetourFormateur;
};

const fmtNote = (n: number) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/** Statut d'un travail évalué par un retour : le retour compte s'il est postérieur à la dernière modification. */
function statutAvecRetour(miseAJour: string, retour: RetourFormateur | undefined, sansRetour: StatutTravail): StatutTravail {
  if (retour && retour.updated_at >= miseAJour) return retour.statut;
  return sansRetour;
}

const evaluationRetour = (r: RetourFormateur | undefined, defaut: string) =>
  r ? (r.note !== null && r.note_sur !== null ? `${fmtNote(r.note)} / ${fmtNote(r.note_sur)}` : r.statut === "corrige" ? "Corrigé sans note" : "À reprendre") : defaut;

/** Tous les travaux d'un apprenant (y compris non commencés pour les exercices proposés à tous). */
export function travauxApprenant(
  apprenantId: string,
  d: { soumissions: Soumission[]; travaux: TravailRecherche[]; analyses: AnalysePertinence[]; retours: RetourFormateur[] },
): TravailSuivi[] {
  const retour = (objet: RetourFormateur["objet"], id: string) => d.retours.find((r) => r.apprenant_id === apprenantId && r.objet === objet && r.objet_id === id);
  const liste: TravailSuivi[] = [];

  for (const exo of exercicesARendre) {
    // Une copie par groupe : on garde la plus récente.
    const s = d.soumissions
      .filter((x) => x.apprenant_id === apprenantId && x.exercice_id === exo.id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    liste.push({
      cle: `a_rendre:${exo.id}`,
      type: "a_rendre",
      apprenantId,
      titre: exo.titre,
      statut: !s ? "non_commence" : s.statut === "soumis" ? "a_corriger" : s.statut === "a_refaire" ? "a_refaire" : "corrige",
      date: s?.soumis_le ?? null,
      evaluation: !s ? "—" : s.statut === "corrige" && s.note !== null ? `${fmtNote(s.note)} / ${fmtNote(s.note_sur)}` : s.statut === "soumis" ? "À évaluer" : "À reprendre",
      ...(s && { soumission: s }),
    });
  }

  for (const exo of EXERCICES_RECHERCHE) {
    const t = d.travaux.find((x) => x.user_id === apprenantId && x.exercice === exo.id);
    const r = retour("travail_recherche", exo.id);
    liste.push({
      cle: `personnalise:${exo.id}`,
      type: "personnalise",
      apprenantId,
      titre: exo.titre,
      statut: !t ? "non_commence" : statutAvecRetour(t.updated_at, r, t.termine ? "a_corriger" : "en_cours"),
      date: t?.updated_at ?? null,
      evaluation: !t ? "—" : evaluationRetour(r && r.updated_at >= t.updated_at ? r : undefined, "À évaluer"),
      ...(t && { travail: t }),
      ...(r && { retour: r }),
    });
  }

  for (const a of d.analyses.filter((x) => x.user_id === apprenantId)) {
    const r = retour("analyse_pertinence", a.article_id);
    const titre = a.mode === "corrige" ? articlePertinence(a.article_id)?.titre : (a.article?.["titre"] as string | undefined);
    const auto = a.mode === "corrige" && a.premier_score !== null ? `Score automatique ${a.premier_score}/100 (indicatif)` : "À évaluer";
    liste.push({
      cle: `pertinence:${a.article_id}`,
      type: "pertinence",
      apprenantId,
      titre: `Pertinence : « ${titre ?? a.article_id} »`,
      statut: statutAvecRetour(a.updated_at, r, "a_corriger"),
      date: a.updated_at,
      evaluation: evaluationRetour(r && r.updated_at >= a.updated_at ? r : undefined, auto),
      analyse: a,
      ...(r && { retour: r }),
    });
  }
  return liste;
}

/* ───────── Leçons interactives ───────── */

/** Questions du quiz de chaque leçon, telles qu'enregistrées dans reponses.question_id. */
export const QUESTIONS_LECONS: { id: string; questions: string[] }[] = resumesChapitres.map((r) => {
  const lecon = toutesLesLecons.find((c) => c.id === r.id);
  return { id: r.id, questions: lecon ? lecon.quiz.map((q) => idQuestion(lecon.id, q.id)) : (chapitreComprendreIA(r.id)?.quiz ?? []) };
});

/**
 * Leçons réussies d'après les réponses enregistrées dans le compte : au moins 75 % des questions
 * du quiz réussies au moins une fois. Les leçons faites sans être connecté ne sont pas connues.
 */
export function progressionLecons(reponses: { question_id: string; correcte: boolean }[]) {
  const justes = new Set(reponses.filter((r) => r.correcte).map((r) => r.question_id));
  const vues = new Set(reponses.map((r) => r.question_id));
  let reussies = 0;
  let commencees = 0;
  for (const l of QUESTIONS_LECONS) {
    if (l.questions.length === 0) continue;
    if (l.questions.some((q) => vues.has(q))) commencees++;
    if (l.questions.filter((q) => justes.has(q)).length >= Math.ceil(SEUIL_TERMINE * l.questions.length)) reussies++;
  }
  return { reussies, commencees, total: QUESTIONS_LECONS.length };
}

/* ───────── Résultats datés ───────── */

export type TentativeSuivi = {
  id: string;
  user_id: string;
  type: string;
  categorie: string | null;
  niveau: string | null;
  score: number;
  total: number;
  created_at: string;
  reponses: { question_id: string; correcte: boolean; reponse_donnee: string | null }[];
};

/** Lundi (AAAA-MM-JJ, heure locale) de la semaine d'une date. */
export function debutSemaine(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Taux de réussite par semaine (points obtenus / points possibles), à partir des seules tentatives enregistrées. */
export function serieHebdomadaire(tentatives: Pick<TentativeSuivi, "score" | "total" | "created_at">[]) {
  const m = new Map<string, { score: number; total: number; nb: number }>();
  for (const t of tentatives) {
    const k = debutSemaine(t.created_at);
    const v = m.get(k) ?? { score: 0, total: 0, nb: 0 };
    m.set(k, { score: v.score + t.score, total: v.total + t.total, nb: v.nb + 1 });
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semaine, v]) => ({ semaine, taux: Math.round((1000 * v.score) / v.total) / 10, nb: v.nb }));
}

export const tauxReussite = (t: Pick<TentativeSuivi, "score" | "total">[]) => {
  const total = t.reduce((s, x) => s + x.total, 0);
  return total ? Math.round((1000 * t.reduce((s, x) => s + x.score, 0)) / total) / 10 : null;
};

/* ───────── Chargement ───────── */

export type MembreSuivi = { id: string; nom: string; groupes: { id: string; nom: string }[]; depuis: string };

export type DonneesSuivi = {
  membres: MembreSuivi[];
  tentatives: TentativeSuivi[];
  soumissions: Soumission[];
  travaux: TravailRecherche[];
  analyses: AnalysePertinence[];
  retours: RetourFormateur[];
  profils: ProfilChercheur[];
};

/** Données de suivi des membres des groupes (actifs) du formateur. */
export function useDonneesSuivi(formateurId: string, groupes: Groupe[]) {
  const ids = groupes.map((g) => g.id).sort();
  return useQuery({
    queryKey: ["suivi-apprenants", formateurId, ids],
    enabled: ids.length > 0,
    queryFn: async (): Promise<DonneesSuivi> => {
      const sb = getSupabase()!;
      const m = await sb.from("membres_groupe").select("apprenant_id, groupe_id, joined_at, profil:profiles(nom_complet)").in("groupe_id", ids);
      if (m.error) throw m.error;
      const parId = new Map<string, MembreSuivi>();
      for (const r of m.data) {
        if (r.apprenant_id === formateurId) continue;
        const g = groupes.find((x) => x.id === r.groupe_id)!;
        const e = parId.get(r.apprenant_id) ?? { id: r.apprenant_id, nom: r.profil?.nom_complet || "Sans nom", groupes: [], depuis: r.joined_at };
        e.groupes.push({ id: g.id, nom: g.nom });
        if (r.joined_at < e.depuis) e.depuis = r.joined_at;
        parId.set(r.apprenant_id, e);
      }
      const membres = [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      const uids = membres.map((x) => x.id);
      if (uids.length === 0) return { membres, tentatives: [], soumissions: [], travaux: [], analyses: [], retours: [], profils: [] };

      const [t, s, tr, an, re, pr] = await Promise.all([
        sb.from("tentatives").select("id, user_id, type, categorie, niveau, score, total, created_at, reponses(question_id, correcte, reponse_donnee)").in("user_id", uids).order("created_at", { ascending: false }).limit(10000),
        sb.from("soumissions").select("*").in("groupe_id", ids).in("apprenant_id", uids),
        sb.from("travaux_recherche").select("*").in("user_id", uids),
        sb.from("analyses_pertinence").select("*").in("user_id", uids),
        sb.from("retours_formateur").select("*").in("apprenant_id", uids),
        sb.from("profils_chercheur").select("*").in("user_id", uids),
      ]);
      const erreur = t.error ?? s.error ?? tr.error ?? an.error ?? re.error ?? pr.error;
      if (erreur) throw erreur;
      return {
        membres,
        tentatives: t.data as TentativeSuivi[],
        soumissions: s.data ?? [],
        travaux: tr.data as TravailRecherche[],
        analyses: an.data as AnalysePertinence[],
        retours: re.data ?? [],
        profils: pr.data as ProfilChercheur[],
      };
    },
  });
}

/** Enregistre un retour du formateur puis recharge le suivi. */
export function useEnregistrerRetour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Database["public"]["Functions"]["enregistrer_retour"]["Args"]) => {
      const { data, error } = await getSupabase()!.rpc("enregistrer_retour", args);
      if (error) throw new Error(error.message === "Note invalide" ? "La note doit être comprise entre 0 et le barème choisi." : error.message.includes("reprendre") ? "Explique ce qu'il faut reprendre." : "L'enregistrement a échoué. Vérifie ta connexion, puis réessaie.");
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["suivi-apprenants"] }),
  });
}

/* ───────── Côté apprenant : retours reçus ───────── */

export function useMesRetours(userId: string | undefined) {
  return useQuery({
    queryKey: ["mes-retours", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("retours_formateur").select("*").eq("apprenant_id", userId!).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarquerRetourConsulte(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase()!.rpc("marquer_retour_consulte", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["mes-retours", userId] }),
  });
}
