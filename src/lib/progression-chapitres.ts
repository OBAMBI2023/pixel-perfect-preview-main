import { useEffect, useState } from "react";

/** Progression des leçons interactives, gardée sur l'appareil (avec ou sans compte). */
const CLE = "iar-chapitres";
/** Une leçon est « terminée » à partir de 3 bonnes réponses sur 4 (75 %). */
export const SEUIL_TERMINE = 0.75;

export type EtatChapitre = { meilleur: number; total: number; termine: boolean };
type Etats = Record<string, EtatChapitre>;

const abonnes = new Set<(e: Etats) => void>();

function lire(): Etats {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CLE) ?? "{}");
    return v && typeof v === "object" ? (v as Etats) : {};
  } catch {
    return {};
  }
}

/** Garde le meilleur score ; une leçon terminée le reste. */
export function enregistrerScoreChapitre(id: string, score: number, total: number) {
  const etats = lire();
  const avant = etats[id];
  const termine = (avant?.termine ?? false) || score / total >= SEUIL_TERMINE;
  etats[id] = { meilleur: Math.max(avant?.meilleur ?? 0, score), total, termine };
  try {
    localStorage.setItem(CLE, JSON.stringify(etats));
  } catch {
    /* stockage indisponible (navigation privée…) : la progression n'est pas gardée */
  }
  abonnes.forEach((f) => f(etats));
}

/** États de toutes les leçons, mis à jour dès qu'un quiz se termine. Vide pendant le rendu serveur. */
export function useProgressionChapitres(): Etats {
  const [etats, setEtats] = useState<Etats>({});
  useEffect(() => {
    setEtats(lire());
    abonnes.add(setEtats);
    return () => {
      abonnes.delete(setEtats);
    };
  }, []);
  return etats;
}
