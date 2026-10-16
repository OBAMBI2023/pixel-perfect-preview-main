// Accès aux leçons interactives de « Comprendre l'IA » : données JSON validées, page 2.4 faite à la main,
// ordre de lecture, groupes par chapitre du manuel et identifiants de questions pour l'enregistrement.

import donnees from "@/data/chapitres-comprendre-ia.json";
import { validerChapitres, type CategorieChapitre, type ChapitreInteractif, type DonneesChapitres, type NiveauQuiz } from "@/data/chapitres.types";
import type { NiveauDb } from "@/lib/supabase";

export const COURS_CHAPITRES = "comprendre-ia";
export const PDF_CHAPITRES = "/pdfs/comprendre-ia.pdf";

const data = donnees as unknown as DonneesChapitres;

/** Pages faites à la main qui figurent dans `ordre` (titre, durée et catégorie pour les listes). */
export const PAGES_MANUELLES: Record<string, { numero: string; titre: string; dureeMin: number; categorie: CategorieChapitre }> = {
  "2-4": { numero: "2.4", titre: "Les branches de l'intelligence artificielle", dureeMin: 10, categorie: "fondements" },
};

if (import.meta.env.DEV) {
  const erreurs = validerChapitres(data, Object.keys(PAGES_MANUELLES));
  if (erreurs.length) console.error(`chapitres-comprendre-ia.json : ${erreurs.length} problème(s)\n- ${erreurs.join("\n- ")}`);
}

export const ordreChapitres = data.ordre;
export const chapitreInteractif = (id: string): ChapitreInteractif | undefined => data.chapitres.find((c) => c.id === id);

/** Entrée de liste : leçon du JSON ou page faite à la main. */
export type ResumeChapitre = { id: string; numero: string; titre: string; dureeMin: number; categorie: CategorieChapitre; groupe: string };

const groupeDe = (id: string) => id.split("-")[0]!;
export const resumesChapitres: ResumeChapitre[] = data.ordre.flatMap((id) => {
  const c = chapitreInteractif(id) ?? PAGES_MANUELLES[id];
  return c ? [{ id, numero: c.numero, titre: c.titre, dureeMin: c.dureeMin, categorie: c.categorie, groupe: groupeDe(id) }] : [];
});

/** Titres des chapitres du manuel, pour regrouper les leçons. */
export const TITRES_GROUPES: Record<string, string> = {
  "2": "Fondements de l'intelligence artificielle",
  "3": "L'intelligence artificielle générative",
  "4": "L'ingénierie des instructions",
  "5": "Limites, risques et éthique",
  "6": "La recherche documentaire scientifique",
  "7": "Sélection et lecture des sources",
  "8": "Évaluation de la qualité des sources",
  "9": "Organisation et exploitation de la documentation",
  "10": "Démarche intégrée : IA et recherche documentaire",
};

/** Précédent / suivant dans `ordre` (pages faites à la main comprises). */
export function voisins(id: string): { precedent: ResumeChapitre | undefined; suivant: ResumeChapitre | undefined } {
  const i = resumesChapitres.findIndex((r) => r.id === id);
  if (i < 0) return { precedent: undefined, suivant: undefined };
  return { precedent: resumesChapitres[i - 1], suivant: resumesChapitres[i + 1] };
}

/** Identifiant enregistré dans `reponses.question_id` : « <chapitre>:<question> ». */
export const idQuestion = (chapitreId: string, questionId: string) => `${chapitreId}:${questionId}`;

/** Niveaux du quiz → niveaux acceptés par la table `tentatives`. */
export const NIVEAU_DB: Record<NiveauQuiz, NiveauDb> = { facile: "debutant", moyen: "intermediaire", difficile: "avance" };
export const LIBELLE_NIVEAU: Record<NiveauQuiz, string> = { facile: "Facile", moyen: "Moyen", difficile: "Difficile" };

export const toutesLesLecons = data.chapitres;
