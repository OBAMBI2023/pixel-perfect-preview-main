import { describe, expect, it } from "vitest";
import { exercicesARendre } from "@/data/exercices-a-rendre";
import { debutSemaine, progressionLecons, QUESTIONS_LECONS, serieHebdomadaire, tauxReussite, travauxApprenant } from "@/lib/suivi";
import type { AnalysePertinence, RetourFormateur, Soumission, TravailRecherche } from "@/lib/supabase";

const A = "apprenant-a";
const vide = { soumissions: [] as Soumission[], travaux: [] as TravailRecherche[], analyses: [] as AnalysePertinence[], retours: [] as RetourFormateur[] };

const soumission = (p: Partial<Soumission>): Soumission => ({
  id: "s1", exercice_id: exercicesARendre[0]!.id, apprenant_id: A, groupe_id: "g", contenu: "texte", statut: "soumis", note: null, note_sur: 10,
  commentaire: null, points_acquis: null, points_a_ameliorer: null, corrige_par: null, corrige_le: null, consulte_le: null,
  soumis_le: "2026-10-10T10:00:00Z", created_at: "2026-10-10T10:00:00Z", updated_at: "2026-10-10T10:00:00Z", ...p,
});
const travail = (p: Partial<TravailRecherche>): TravailRecherche => ({
  user_id: A, exercice: "prompt", sujet: "s", contenu: {}, termine: true, termine_le: "2026-10-10T10:00:00Z", created_at: "2026-10-10T10:00:00Z", updated_at: "2026-10-10T10:00:00Z", ...p,
});
const retour = (p: Partial<RetourFormateur>): RetourFormateur => ({
  id: "r1", apprenant_id: A, formateur_id: "f", objet: "travail_recherche", objet_id: "prompt", statut: "corrige", note: null, note_sur: null,
  appreciation: "ok", points_acquis: null, points_a_ameliorer: null, consulte_le: null, created_at: "2026-10-11T10:00:00Z", updated_at: "2026-10-11T10:00:00Z", ...p,
});
const trouver = (l: ReturnType<typeof travauxApprenant>, cle: string) => l.find((t) => t.cle === cle)!;

describe("statuts des travaux", () => {
  it("liste les exercices non commencés sans inventer de note", () => {
    const l = travauxApprenant(A, vide);
    expect(l.filter((t) => t.statut === "non_commence")).toHaveLength(exercicesARendre.length + 4);
    expect(l.every((t) => t.evaluation === "—")).toBe(true);
  });

  it("traduit le statut des copies et n'affiche une note que si elle existe", () => {
    const cle = `a_rendre:${exercicesARendre[0]!.id}`;
    expect(trouver(travauxApprenant(A, { ...vide, soumissions: [soumission({})] }), cle)).toMatchObject({ statut: "a_corriger", evaluation: "À évaluer" });
    expect(trouver(travauxApprenant(A, { ...vide, soumissions: [soumission({ statut: "corrige", note: 7.5 })] }), cle)).toMatchObject({ statut: "corrige", evaluation: "7,5 / 10" });
    expect(trouver(travauxApprenant(A, { ...vide, soumissions: [soumission({ statut: "a_refaire" })] }), cle).statut).toBe("a_refaire");
  });

  it("un exercice personnalisé terminé est « à corriger » tant qu'aucun retour postérieur n'existe", () => {
    expect(trouver(travauxApprenant(A, { ...vide, travaux: [travail({ termine: false, termine_le: null })] }), "personnalise:prompt").statut).toBe("en_cours");
    expect(trouver(travauxApprenant(A, { ...vide, travaux: [travail({})] }), "personnalise:prompt")).toMatchObject({ statut: "a_corriger", evaluation: "À évaluer" });
    const corrige = travauxApprenant(A, { ...vide, travaux: [travail({})], retours: [retour({ note: 16, note_sur: 20 })] });
    expect(trouver(corrige, "personnalise:prompt")).toMatchObject({ statut: "corrige", evaluation: "16 / 20" });
    // Travail modifié après le retour : il repart en correction.
    const modifie = travauxApprenant(A, { ...vide, travaux: [travail({ updated_at: "2026-10-12T10:00:00Z" })], retours: [retour({ statut: "a_refaire" })] });
    expect(trouver(modifie, "personnalise:prompt").statut).toBe("a_corriger");
  });

  it("ignore les données des autres apprenants", () => {
    const l = travauxApprenant(A, { ...vide, soumissions: [soumission({ apprenant_id: "autre" })], travaux: [travail({ user_id: "autre" })] });
    expect(l.every((t) => t.statut === "non_commence")).toBe(true);
  });
});

describe("leçons réussies", () => {
  it("compte une leçon réussie à partir de 75 % de ses questions réussies", () => {
    const lecon = QUESTIONS_LECONS.find((l) => l.questions.length === 4)!;
    const [q1, q2, q3, q4] = lecon.questions as [string, string, string, string];
    expect(progressionLecons([q1, q2].map((q) => ({ question_id: q, correcte: true }))).reussies).toBe(0);
    const r = progressionLecons([q1, q2, q3].map((q) => ({ question_id: q, correcte: true })).concat([{ question_id: q4, correcte: false }]));
    expect(r).toMatchObject({ reussies: 1, commencees: 1, total: 28 });
  });
  it("connaît les questions des 28 leçons, y compris la leçon 2.4", () => {
    expect(QUESTIONS_LECONS).toHaveLength(28);
    expect(QUESTIONS_LECONS.every((l) => l.questions.length > 0)).toBe(true);
  });
});

describe("résultats datés", () => {
  it("regroupe par semaine (lundi) et calcule le taux sur les points", () => {
    expect(debutSemaine("2026-10-14T12:00:00")).toBe("2026-10-12");
    expect(serieHebdomadaire([
      { score: 1, total: 1, created_at: "2026-10-05T12:00:00" },
      { score: 0, total: 1, created_at: "2026-10-06T12:00:00" },
      { score: 3, total: 4, created_at: "2026-10-13T12:00:00" },
    ])).toEqual([{ semaine: "2026-10-05", taux: 50, nb: 2 }, { semaine: "2026-10-12", taux: 75, nb: 1 }]);
  });
  it("ne calcule pas de taux sans données", () => {
    expect(tauxReussite([])).toBeNull();
  });
});
