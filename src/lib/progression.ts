import { CATEGORIES, NIVEAUX, questionsComprendreIA } from "@/lib/qcm-comprendre-ia";
import { exercicesComprendreIA, TYPES_EXERCICE } from "@/lib/exercices-comprendre-ia";
import { getSupabase, type NouvelleTentative } from "@/lib/supabase";

/** Clés localStorage utilisées par /exercices (progression sans compte). */
export const CLE_QCM = "iar-progress";
export const CLE_EXERCICES = "iar-exercices-pratiques";

/** Enregistre des tentatives si l'utilisateur est connecté ; sans compte, ne fait rien. */
export async function enregistrerTentatives(tentatives: NouvelleTentative[]): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || tentatives.length === 0) return false;
  const { data } = await sb.auth.getSession();
  if (!data.session) return false;
  const { error } = await sb.rpc("enregistrer_tentatives", { p_tentatives: tentatives });
  if (error) console.error("Enregistrement de la tentative impossible :", error.message);
  return !error;
}

function lireJson<T>(cle: string): T | null {
  try {
    const s = localStorage.getItem(cle);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

/**
 * À la première connexion, reprend les résultats stockés dans le navigateur.
 * « Première connexion » = aucune tentative en base pour ce compte ; un drapeau évite de recommencer.
 */
export async function importerProgressionLocale(userId: string) {
  const sb = getSupabase();
  const drapeau = `iar-import-${userId}`;
  try {
    if (!sb || localStorage.getItem(drapeau)) return;
  } catch {
    return;
  }
  const { count, error } = await sb.from("tentatives").select("id", { count: "exact", head: true });
  if (error) return;
  const marquer = () => {
    try { localStorage.setItem(drapeau, new Date().toISOString()); } catch { /* ignore */ }
  };
  if ((count ?? 0) > 0) return marquer();

  const qcm = lireJson<{ done: Record<string, boolean> }>(CLE_QCM)?.done ?? {};
  const exos = lireJson<Record<string, boolean>>(CLE_EXERCICES) ?? {};
  const tentatives: NouvelleTentative[] = [];

  for (const q of questionsComprendreIA) {
    if (!(q.id in qcm)) continue;
    const correcte = qcm[q.id] === true;
    tentatives.push({
      cours: q.cours, type: "qcm", categorie: q.categorie, niveau: q.niveau, score: correcte ? 1 : 0, total: 1,
      reponses: [{ question_id: q.id, correcte, reponse_donnee: null }],
    });
  }
  // Le navigateur ne garde que les exercices réussis.
  for (const e of exercicesComprendreIA) {
    if (!exos[e.id]) continue;
    tentatives.push({
      cours: e.cours, type: "exercice", categorie: e.categorie, niveau: e.niveau, score: 1, total: 1,
      reponses: [{ question_id: e.id, correcte: true, reponse_donnee: null }],
    });
  }
  if (tentatives.length === 0 || (await enregistrerTentatives(tentatives))) marquer();
}

/* ───────── Index des questions et exercices (pour l'affichage côté formateur et apprenant) ───────── */

export type InfoQuestion = {
  id: string;
  type: "qcm" | "exercice";
  genre: string; // « QCM » ou le type d'exercice
  enonce: string;
  categorie: string;
  niveau: string;
  chapitre: string;
  cours: string;
  /** Texte lisible d'une réponse enregistrée (index d'option pour un QCM). */
  lireReponse: (r: string | null) => string;
};

const index = new Map<string, InfoQuestion>();
for (const q of questionsComprendreIA) {
  index.set(q.id, {
    id: q.id, type: "qcm", genre: "QCM", enonce: q.question, categorie: q.categorie, niveau: q.niveau, chapitre: q.chapitre, cours: q.cours,
    lireReponse: (r) => (r === null ? "—" : q.options[Number(r)] ?? r),
  });
}
for (const e of exercicesComprendreIA) {
  index.set(e.id, {
    id: e.id, type: "exercice", genre: TYPES_EXERCICE.find((t) => t.id === e.type)?.label ?? "Exercice",
    enonce: e.type === "vrai-faux" ? `${e.titre} — « ${e.affirmation} »` : e.titre,
    categorie: e.categorie, niveau: e.niveau, chapitre: e.chapitre, cours: e.cours,
    lireReponse: (r) => r || "—",
  });
}

export const infoQuestion = (id: string) => index.get(id);
export const titreCategorie = (id: string | null) => (id ? CATEGORIES.find((c) => c.id === id)?.titre ?? id : "—");
export const labelNiveau = (id: string | null) => (id ? NIVEAUX.find((n) => n.id === id)?.label ?? id : "—");
