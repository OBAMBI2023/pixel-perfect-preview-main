import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSupabase,
  type Database,
  type ExerciceRecherche,
  type NiveauEtudes,
  type ProfilChercheur,
  type TravailRecherche,
} from "@/lib/supabase";

/**
 * Profil chercheur et exercices personnalisés (tables profils_chercheur et travaux_recherche).
 * Écriture réservée au participant ; lecture par lui et par le formateur de ses groupes (RLS, est_formateur_de).
 */

export const NIVEAUX_ETUDES: { id: NiveauEtudes; label: string }[] = [
  { id: "licence", label: "Licence" },
  { id: "master", label: "Master" },
  { id: "doctorat", label: "Doctorat" },
  { id: "postdoc", label: "Post-doctorat" },
  { id: "enseignant", label: "Enseignant-chercheur" },
  { id: "autre", label: "Autre" },
];
export const labelNiveauEtudes = (id: string | null | undefined) => NIVEAUX_ETUDES.find((n) => n.id === id)?.label ?? "—";

export const EXERCICES_RECHERCHE: { id: ExerciceRecherche; titre: string; description: string }[] = [
  { id: "prompt", titre: "Formuler un prompt", description: "Rédiger un prompt complet sur ton sujet, puis l'évaluer avec une grille." },
  { id: "mots-cles", titre: "Mots-clés français et anglais", description: "Découper ton sujet en concepts et trouver leurs équivalents en anglais." },
  { id: "equation", titre: "Équation de recherche", description: "Combiner tes mots-clés avec OR et AND pour interroger les bases scientifiques." },
  { id: "references", titre: "Vérifier des références", description: "Contrôler qu'une référence trouvée (ou proposée par une IA) existe vraiment." },
];

export type ProfilSaisi = Database["public"]["Tables"]["profils_chercheur"]["Insert"];

/* ───────── Contenus des exercices (colonne jsonb « contenu ») ───────── */

export type Concept = { fr: string; en: string; synonymes: string };
export type Reference = {
  titre: string;
  auteurs: string;
  annee: string;
  doi: string;
  criteres: string[];
  verification?: VerificationDoi | undefined;
};
export type VerificationDoi =
  | { statut: "trouve"; titre: string; annee: number | null; revue: string | null; le: string }
  | { statut: "introuvable" | "invalide"; le: string };

export type ContenuPrompt = { prompt: string; criteres: string[] };
export type ContenuMotsCles = { concepts: Concept[] };
export type ContenuEquation = { equation: string };
export type ContenuReferences = { references: Reference[] };

const texte = (v: unknown) => (typeof v === "string" ? v : "");
const textes = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const objets = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : []);

/** Lecture tolérante du jsonb : valeurs par défaut si le contenu est absent ou incomplet. */
export const lireContenu = {
  prompt: (c: Record<string, unknown> | undefined): ContenuPrompt => ({ prompt: texte(c?.["prompt"]), criteres: textes(c?.["criteres"]) }),
  motsCles: (c: Record<string, unknown> | undefined): ContenuMotsCles => ({
    concepts: objets(c?.["concepts"]).map((o) => ({ fr: texte(o["fr"]), en: texte(o["en"]), synonymes: texte(o["synonymes"]) })),
  }),
  equation: (c: Record<string, unknown> | undefined): ContenuEquation => ({ equation: texte(c?.["equation"]) }),
  references: (c: Record<string, unknown> | undefined): ContenuReferences => ({
    references: objets(c?.["references"]).map((o) => ({
      titre: texte(o["titre"]),
      auteurs: texte(o["auteurs"]),
      annee: texte(o["annee"]),
      doi: texte(o["doi"]),
      criteres: textes(o["criteres"]),
      ...(o["verification"] && typeof o["verification"] === "object" ? { verification: o["verification"] as VerificationDoi } : {}),
    })),
  }),
};

/* ───────── Outils appliqués au sujet ───────── */

const MOTS_VIDES = new Set(
  ("le la les l un une des du de d et ou en au aux a à sur sous dans pour par avec sans chez entre vers selon leur leurs son sa ses ce cet cette ces " +
    "qui que quoi dont où quel quelle quels quelles comment pourquoi est sont être faire plus moins très ainsi cas cadre étude analyse rôle impact effets effet " +
    "the of and or in on for to with by from at an as its their").split(" "),
);

/** Termes candidats tirés du sujet et de la problématique (mots-vides retirés, sans doublons). */
export function termesDuSujet(...sources: (string | null | undefined)[]): string[] {
  const vus = new Set<string>();
  const termes: string[] = [];
  for (const mot of sources.join(" ").split(/[^\p{L}\p{N}-]+/u)) {
    // « favorise-t-il » → « favorise » (inversion interrogative).
    const cle = mot.toLowerCase().replace(/-(t-)?(il|elle|on|ils|elles)$/, "").replace(/^-+|-+$/g, "");
    if (cle.length < 4 || MOTS_VIDES.has(cle) || vus.has(cle) || /^\d+$/.test(cle)) continue;
    vus.add(cle);
    termes.push(cle);
  }
  return termes.slice(0, 12);
}

const entreGuillemets = (t: string) => (/\s/.test(t) ? `"${t}"` : t);

/** Équation booléenne : synonymes d'un concept reliés par OR, concepts reliés par AND. */
export function construireEquation(concepts: Concept[]): string {
  return concepts
    .map((c) => {
      const termes = [c.fr, c.en, ...c.synonymes.split(/[,;]/)].map((t) => t.trim()).filter(Boolean);
      const uniques = termes.filter((t, i) => termes.findIndex((u) => u.toLowerCase() === t.toLowerCase()) === i).map(entreGuillemets);
      return uniques.length > 1 ? `(${uniques.join(" OR ")})` : (uniques[0] ?? "");
    })
    .filter(Boolean)
    .join(" AND ");
}

export const lienGoogleScholar = (requete: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(requete)}`;

/** « https://doi.org/10.1000/xyz », « doi:10.1000/xyz » → « 10.1000/xyz » ; null si ce n'est pas un DOI. */
export function normaliserDoi(saisie: string): string | null {
  const doi = saisie.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  return /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : null;
}

/** Interroge Crossref (registre officiel des DOI) : le DOI existe-t-il, et pour quel article ? */
export async function verifierDoi(saisie: string): Promise<VerificationDoi> {
  const le = new Date().toISOString();
  const doi = normaliserDoi(saisie);
  if (!doi) return { statut: "invalide", le };
  const rep = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (rep.status === 404) return { statut: "introuvable", le };
  if (!rep.ok) throw new Error("Le service Crossref ne répond pas. Réessaie dans quelques instants.");
  const { message } = (await rep.json()) as { message: { title?: string[]; issued?: { "date-parts"?: number[][] }; "container-title"?: string[] } };
  return {
    statut: "trouve",
    titre: message.title?.[0] ?? "(sans titre)",
    annee: message.issued?.["date-parts"]?.[0]?.[0] ?? null,
    revue: message["container-title"]?.[0] ?? null,
    le,
  };
}

/** Part des mots significatifs du titre saisi retrouvés dans le titre officiel (indice, pas une preuve). */
export function ressemblanceTitres(saisi: string, officiel: string): number {
  const a = termesDuSujet(saisi);
  if (a.length === 0) return 0;
  const b = new Set(termesDuSujet(officiel));
  return a.filter((m) => b.has(m)).length / a.length;
}

/* ───────── Accès aux données ───────── */

export function useProfilChercheur(userId: string | undefined) {
  return useQuery({
    queryKey: ["profil-chercheur", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("profils_chercheur").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data as ProfilChercheur | null;
    },
  });
}

/** Enregistre le profil ; user_id n'est jamais envoyé (valeur par défaut auth.uid() côté base). */
export function useEnregistrerProfil(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profil: ProfilSaisi) => {
      const { data, error } = await getSupabase()!.from("profils_chercheur").upsert(profil, { onConflict: "user_id" }).select().single();
      if (error) throw new Error("L'enregistrement a échoué. Vérifie les champs et ta connexion internet, puis réessaie.");
      return data;
    },
    onSuccess: (p) => qc.setQueryData(["profil-chercheur", userId], p),
  });
}

export function useTravauxRecherche(userId: string | undefined) {
  return useQuery({
    queryKey: ["travaux-recherche", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("travaux_recherche").select("*").eq("user_id", userId!);
      if (error) throw error;
      return new Map((data as TravailRecherche[]).map((t) => [t.exercice, t]));
    },
  });
}

export function useEnregistrerTravail(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (travail: { exercice: ExerciceRecherche; sujet: string; contenu: Record<string, unknown>; termine: boolean }) => {
      const { data, error } = await getSupabase()!.from("travaux_recherche").upsert(travail, { onConflict: "user_id,exercice" }).select().single();
      if (error) throw new Error("L'enregistrement a échoué. Vérifie ta connexion internet, puis réessaie.");
      return data as TravailRecherche;
    },
    onSuccess: (t) =>
      qc.setQueryData<Map<ExerciceRecherche, TravailRecherche>>(["travaux-recherche", userId], (m) => new Map(m ?? []).set(t.exercice, t)),
  });
}
