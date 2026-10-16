// Types des leçons interactives (src/data/chapitres-comprendre-ia.json) et validateur de cohérence.

export const CATEGORIES_CHAPITRE = [
  "fondements",
  "ia-generative",
  "prompts",
  "ethique",
  "recherche-documentaire",
  "selection-evaluation",
  "organisation",
] as const;
export type CategorieChapitre = (typeof CATEGORIES_CHAPITRE)[number];

export const NIVEAUX_QUIZ = ["facile", "moyen", "difficile"] as const;
export type NiveauQuiz = (typeof NIVEAUX_QUIZ)[number];

/** Élément d'infographie (frise, étapes, grille, couples, entonnoir). */
export type ElementInfographie = { id: string; label: string; detail: string; exemple?: string };
/** Ligne d'un tableau : `cellules` suit `colonnes` à partir de la 2e colonne. */
export type LigneMatrice = { id: string; label: string; cellules: string[] };
/** Étape du « trio » : rôle du chercheur, apport possible de l'IA, contrôle humain. */
export type EtapeTrio = { id: string; label: string; chercheur: string; ia: string; controle: string };

type BaseInfographie = { titre: string; legende: string };
export type Infographie =
  | (BaseInfographie & { type: "timeline" | "flow" | "grid" | "pairs" | "funnel"; items: ElementInfographie[] })
  | (BaseInfographie & { type: "matrix"; colonnes: string[]; lignes: LigneMatrice[]; donneesFictives?: boolean })
  | (BaseInfographie & { type: "trio"; items: EtapeTrio[] });
export const TYPES_INFOGRAPHIE = ["timeline", "flow", "grid", "pairs", "funnel", "matrix", "trio"] as const;

export type QuestionQuiz = { id: string; niveau: NiveauQuiz; question: string; options: string[]; bonne: number; explication: string };

export type ChapitreInteractif = {
  id: string; // « 2-3 », « 5-1 », « 10 »
  numero: string;
  titre: string;
  categorie: CategorieChapitre;
  dureeMin: number;
  objectifs: string[];
  enBref: string;
  infographie: Infographie;
  explications: { titre: string; texte: string; attention?: string }[];
  exemples: { titre: string; contexte: string; texte: string }[];
  quiz: QuestionQuiz[];
  aRetenir: string[];
};

export type DonneesChapitres = { ordre: string[]; chapitres: ChapitreInteractif[] };

/**
 * Vérifie la cohérence des données ; renvoie la liste des problèmes (vide si tout va bien).
 * `pagesManuelles` : identifiants de `ordre` qui ont une page faite à la main (ex. « 2-4 »).
 */
export function validerChapitres(d: DonneesChapitres, pagesManuelles: string[] = []): string[] {
  const erreurs: string[] = [];
  const doublons = (liste: string[]) => liste.filter((x, i) => liste.indexOf(x) !== i);
  if (!Array.isArray(d.ordre) || d.ordre.length === 0) erreurs.push("`ordre` est absent ou vide.");
  for (const id of doublons(d.ordre ?? [])) erreurs.push(`« ${id} » apparaît deux fois dans \`ordre\`.`);
  const ids = d.chapitres.map((c) => c.id);
  for (const id of doublons(ids)) erreurs.push(`Chapitre « ${id} » en double.`);
  for (const id of ids) if (!d.ordre.includes(id)) erreurs.push(`Chapitre « ${id} » absent de \`ordre\`.`);
  for (const id of d.ordre) if (!ids.includes(id) && !pagesManuelles.includes(id)) erreurs.push(`« ${id} » de \`ordre\` n'a ni données ni page.`);

  for (const c of d.chapitres) {
    const ici = `Chapitre ${c.id}`;
    if (!CATEGORIES_CHAPITRE.includes(c.categorie)) erreurs.push(`${ici} : catégorie inconnue « ${c.categorie} ».`);
    if (!TYPES_INFOGRAPHIE.includes(c.infographie.type)) erreurs.push(`${ici} : type d'infographie inconnu « ${c.infographie.type} ».`);
    const inf = c.infographie;
    if (inf.type === "matrix") {
      for (const l of inf.lignes) if (l.cellules.length !== inf.colonnes.length - 1) erreurs.push(`${ici} : ligne « ${l.id} » de la matrice incomplète.`);
    } else if (inf.items.length === 0) erreurs.push(`${ici} : infographie sans élément.`);
    if (c.aRetenir.length < 3 || c.aRetenir.length > 4) erreurs.push(`${ici} : « À retenir » doit compter 3 ou 4 puces.`);
    if (c.quiz.length !== 4) erreurs.push(`${ici} : le quiz doit compter 4 questions.`);
    for (const id of doublons(c.quiz.map((q) => q.id))) erreurs.push(`${ici} : question « ${id} » en double.`);
    for (const q of c.quiz) {
      if (!Number.isInteger(q.bonne) || q.bonne < 0 || q.bonne >= q.options.length) erreurs.push(`${ici}, ${q.id} : \`bonne\` (${q.bonne}) n'est pas un index valide.`);
      if (!NIVEAUX_QUIZ.includes(q.niveau)) erreurs.push(`${ici}, ${q.id} : niveau inconnu « ${q.niveau} ».`);
    }
  }
  return erreurs;
}
