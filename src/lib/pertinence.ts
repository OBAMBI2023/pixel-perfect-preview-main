import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CRITERES, type Appreciation, type ArticleExemple, type CritereId, type Pertinence } from "@/data/articles-pertinence";
import { getSupabase, type AnalysePertinence, type Database } from "@/lib/supabase";
import { termesDuSujet } from "@/lib/recherche";

/** Réponses du participant (colonne contenu de analyses_pertinence). */
export type ReponsesPertinence = {
  jugement: Pertinence | null;
  justification: string;
  criteres: Partial<Record<CritereId, Appreciation>>;
  aVerifier: string[];
  /** Étape 7 : comparaison avec l'analyse de l'IA. */
  comparaison: { oublis: string; nonJustifie: string; aVerifierTexte: string; decision: "retenir" | "examiner" | "ecarter" | ""; pourquoi: string };
};

export const REPONSES_VIDES: ReponsesPertinence = {
  jugement: null,
  justification: "",
  criteres: {},
  aVerifier: [],
  comparaison: { oublis: "", nonJustifie: "", aVerifierTexte: "", decision: "", pourquoi: "" },
};

export const DECISIONS = [
  { id: "retenir", label: "Retenir l'article" },
  { id: "examiner", label: "L'examiner davantage" },
  { id: "ecarter", label: "L'écarter provisoirement" },
] as const;

/* ───────── Barème sur 100 ───────── */

/** Points par critère : thématique + problématique = 30, concepts + méthode = 25, contexte + actualité = 15, fiabilité = 5 (+ 5 pour les points à vérifier). */
export const POINTS_CRITERE: Record<CritereId, number> = {
  thematique: 15,
  problematique: 15,
  concepts: 13,
  methode: 12,
  contexte: 8,
  actualite: 7,
  fiabilite: 5,
};

const RANG: Partial<Record<Appreciation, number>> = { oui: 0, partiel: 1, non: 2 };
const RANG_PERTINENCE: Record<Pertinence, number> = { tres: 0, partiel: 1, peu: 2 };

export type StatutReponse = "juste" | "proche" | "faux" | "absent";

export function noterCritere(reponse: Appreciation | undefined, a: ArticleExemple["criteres"][CritereId], max: number): { points: number; statut: StatutReponse } {
  if (!reponse) return { points: 0, statut: "absent" };
  if (reponse === a.attendu || a.acceptables?.includes(reponse)) return { points: max, statut: "juste" };
  const r = RANG[reponse];
  const attendu = RANG[a.attendu];
  if (r !== undefined && attendu !== undefined && Math.abs(r - attendu) === 1) return { points: max / 2, statut: "proche" };
  return { points: 0, statut: "faux" };
}

export function noterJugement(reponse: Pertinence | null, attendu: Pertinence): { points: number; statut: StatutReponse } {
  if (!reponse) return { points: 0, statut: "absent" };
  if (reponse === attendu) return { points: 8, statut: "juste" };
  return Math.abs(RANG_PERTINENCE[reponse] - RANG_PERTINENCE[attendu]) === 1 ? { points: 4, statut: "proche" } : { points: 0, statut: "faux" };
}

const normaliser = (t: string) => t.toLowerCase().normalize("NFC");
const MARQUEURS_LIMITE = /(vérifi|limit|manqu|insuffisan|texte intégral|échantillon|nuanc|cependant|toutefois|mais |prudence|à confirmer|ne permet pas|absence)/i;

/** Indices automatiques de qualité de la justification (sur 12) : longueur, éléments de l'article cités, limites évoquées. */
export function analyserJustification(texte: string, article: ArticleExemple) {
  const nbMots = (texte.trim().match(/\S+/g) ?? []).length;
  const t = normaliser(texte);
  const indicesTrouves = article.indices.filter((i) => t.includes(normaliser(i)));
  const limite = MARQUEURS_LIMITE.test(texte);
  return {
    nbMots,
    indicesTrouves,
    limite,
    points: (nbMots >= 25 ? 4 : nbMots >= 12 ? 2 : 0) + (indicesTrouves.length >= 2 ? 4 : indicesTrouves.length === 1 ? 2 : 0) + (limite ? 4 : 0),
  };
}

/** Points à vérifier (sur 5) : pénalise les oublis et les cases cochées à tort. */
export function noterAVerifier(coches: string[], attendus: string[]) {
  const manques = attendus.filter((a) => !coches.includes(a));
  const enTrop = coches.filter((c) => !attendus.includes(c));
  const points = Math.max(0, 5 * (1 - (manques.length + enTrop.length) / (attendus.length + 2)));
  return { points: Math.round(points * 2) / 2, manques, enTrop };
}

export type Section = { id: string; titre: string; points: number; max: number; conseil: string };

export function noterAnalyse(r: ReponsesPertinence, article: ArticleExemple) {
  const criteres = Object.fromEntries(
    CRITERES.map((c) => [c.id, noterCritere(r.criteres[c.id], article.criteres[c.id], POINTS_CRITERE[c.id])]),
  ) as Record<CritereId, { points: number; statut: StatutReponse }>;
  const jugement = noterJugement(r.jugement, article.pertinence);
  const justification = analyserJustification(r.justification, article);
  // Les points à vérifier ne comptent qu'avec le critère de fiabilité renseigné (sinon une analyse vide en gagnerait).
  const verifier = r.criteres.fiabilite ? noterAVerifier(r.aVerifier, article.aVerifier) : { points: 0, manques: article.aVerifier, enTrop: r.aVerifier };
  const pts = (...ids: CritereId[]) => ids.reduce((s, id) => s + criteres[id].points, 0);

  const sections: Section[] = [
    {
      id: "thematique",
      titre: "Correspondance thématique et avec la problématique",
      points: pts("thematique", "problematique"),
      max: 30,
      conseil: "Compare le titre et le résumé à ton sujet ET à ta question de recherche : un article peut partager un thème sans aider à répondre à la question.",
    },
    {
      id: "concepts",
      titre: "Analyse des concepts et de la méthode",
      points: pts("concepts", "methode"),
      max: 25,
      conseil: "Repère les variables réellement étudiées dans le résumé, et demande-toi si la méthode (enquête, entretiens, modèle…) peut éclairer ton propre travail.",
    },
    {
      id: "contexte",
      titre: "Analyse du contexte et de l'utilité scientifique",
      points: pts("contexte", "actualite"),
      max: 15,
      conseil: "Regarde le terrain (pays, secteur, population) et l'année, sans écarter un article seulement parce qu'il est ancien : demande-toi ce qu'il apporte.",
    },
    {
      id: "justification",
      titre: "Justification argumentée du jugement",
      points: jugement.points + justification.points,
      max: 20,
      conseil: "Appuie ton jugement sur des éléments précis du titre et du résumé, et signale ce qui reste à vérifier.",
    },
    {
      id: "source",
      titre: "Vérification de la source et identification des limites",
      points: criteres.fiabilite.points + verifier.points,
      max: 10,
      conseil: "Avant de citer un article, vérifie la revue, les auteurs et un DOI, et note ce que seul le texte intégral permettra de confirmer.",
    },
  ];
  const total = Math.round(sections.reduce((s, x) => s + x.points, 0));
  return { total, sections, criteres, jugement, justification, verifier };
}
export type ResultatAnalyse = ReturnType<typeof noterAnalyse>;

/** Mode « mon sujet » : termes du sujet retrouvés dans le titre, le résumé et les mots-clés (indice, pas un jugement). */
export function termesCommuns(sujet: string, texteArticle: string) {
  const termes = termesDuSujet(sujet);
  const t = normaliser(texteArticle);
  return { termes, trouves: termes.filter((x) => t.includes(x)) };
}

/* ───────── Prompt d'analyse par l'IA (étape 6) ───────── */

export type ArticleAffiche = { titre: string; auteurs: string; annee: string; revue: string; resume: string; motsCles: string[]; doi: string | null };

export function promptAnalyseIA(sujet: string, a: ArticleAffiche) {
  const infos = [
    `Titre : ${a.titre}`,
    a.auteurs && `Auteurs : ${a.auteurs}`,
    a.annee && `Année : ${a.annee}`,
    a.revue && `Source : ${a.revue}`,
    a.motsCles.length > 0 && `Mots-clés : ${a.motsCles.join(", ")}`,
    `Résumé : ${a.resume || "(résumé non disponible)"}`,
  ]
    .filter(Boolean)
    .join("\n");
  return `Agis comme un assistant méthodologique en recherche scientifique. Voici mon sujet de recherche : ${sujet}

Voici le titre et le résumé de l'article :
${infos}

Analyse la pertinence de cet article par rapport à mon sujet selon les critères suivants : correspondance thématique, problématique, concepts, méthode, contexte et utilité scientifique.

Pour chaque critère, indique les éléments précis du résumé qui justifient ton analyse. Distingue les informations établies, les interprétations et les informations manquantes.

Ne prétends pas avoir vérifié une information bibliographique si tu n'as pas accès à une source permettant de la confirmer. Termine par une recommandation argumentée : retenir, examiner davantage ou écarter provisoirement cet article.

Ne fabrique aucune référence et rappelle que la décision finale appartient au chercheur.`;
}

/* ───────── Recherche d'articles réels (Crossref) pour le mode « mon sujet » ───────── */

export type ArticleCrossref = ArticleAffiche & { doi: string };

const ENTITES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };
/** Texte brut : balises JATS retirées, entités HTML courantes décodées. */
const sansBalises = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (e) => ENTITES[e] ?? e).replace(/\s+/g, " ").trim();

/** Articles de revue indexés par Crossref pour une requête ; métadonnées telles que publiées (non triées par pertinence). */
export async function rechercherCrossref(requete: string): Promise<ArticleCrossref[]> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query.bibliographic", requete);
  url.searchParams.set("filter", "type:journal-article");
  url.searchParams.set("rows", "8");
  url.searchParams.set("select", "DOI,title,author,issued,container-title,abstract,subject");
  const rep = await fetch(url);
  if (!rep.ok) throw new Error("Le service Crossref ne répond pas. Réessaie dans quelques instants.");
  type Item = {
    DOI: string;
    title?: string[];
    author?: { given?: string; family?: string; name?: string }[];
    issued?: { "date-parts"?: (number | null)[][] };
    "container-title"?: string[];
    abstract?: string;
    subject?: string[];
  };
  const { message } = (await rep.json()) as { message: { items: Item[] } };
  return message.items
    .filter((i) => i.title?.[0])
    .map((i) => ({
      doi: i.DOI,
      titre: sansBalises(i.title![0]!),
      auteurs: sansBalises((i.author ?? []).slice(0, 6).map((a) => a.name ?? [a.given, a.family].filter(Boolean).join(" ")).join(", ")) + ((i.author?.length ?? 0) > 6 ? " et al." : ""),
      annee: String(i.issued?.["date-parts"]?.[0]?.[0] ?? ""),
      revue: sansBalises(i["container-title"]?.[0] ?? ""),
      resume: i.abstract ? sansBalises(i.abstract).replace(/^(abstract|résumé)\s*/i, "") : "",
      motsCles: i.subject ?? [],
    }));
}

/* ───────── Accès aux données ───────── */

export function useAnalysesPertinence(userId: string | undefined) {
  return useQuery({
    queryKey: ["analyses-pertinence", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("analyses_pertinence").select("*").eq("user_id", userId!).order("updated_at", { ascending: false });
      if (error) throw error;
      return data as AnalysePertinence[];
    },
  });
}

/** Enregistre l'analyse ; en mode corrigé, seule la première analyse d'un article crée une tentative. */
export function useEnregistrerAnalyse(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Database["public"]["Functions"]["enregistrer_analyse_pertinence"]["Args"]) => {
      const { data, error } = await getSupabase()!.rpc("enregistrer_analyse_pertinence", args);
      if (error) throw new Error("L'enregistrement a échoué. Vérifie ta connexion internet, puis réessaie : ton analyse est conservée sur cette page.");
      return data;
    },
    onSuccess: (ligne) => {
      qc.setQueryData<AnalysePertinence[]>(["analyses-pertinence", userId], (l) => [ligne, ...(l ?? []).filter((x) => x.article_id !== ligne.article_id)]);
      // La première analyse notée ajoute une tentative : les vues de progression doivent se recharger.
      for (const cle of ["progression", "historique", "nb-tentatives"]) void qc.invalidateQueries({ queryKey: [cle, userId] });
    },
  });
}
