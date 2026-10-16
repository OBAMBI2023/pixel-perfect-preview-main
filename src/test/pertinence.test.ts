import { describe, expect, it } from "vitest";
import { ARTICLES, CRITERES, POINTS_A_VERIFIER, SCENARIOS, type ArticleExemple, type CritereId } from "@/data/articles-pertinence";
import { noterAnalyse, noterAVerifier, noterCritere, POINTS_CRITERE, promptAnalyseIA, REPONSES_VIDES, type ReponsesPertinence } from "@/lib/pertinence";
import { infoQuestion } from "@/lib/progression";

/** Réponses idéales pour un article (attendus, justification argumentée). */
function reponsesParfaites(a: ArticleExemple): ReponsesPertinence {
  return {
    ...REPONSES_VIDES,
    jugement: a.pertinence,
    criteres: Object.fromEntries(CRITERES.map((c) => [c.id, a.criteres[c.id].attendu])) as Record<CritereId, ArticleExemple["criteres"][CritereId]["attendu"]>,
    aVerifier: a.aVerifier,
    justification: `Le résumé évoque ${a.indices.slice(0, 3).join(", ")} : ces éléments montrent le lien avec le sujet, mais il faudra vérifier la source et lire le texte intégral avant de conclure définitivement sur cet article.`,
  };
}

describe("articles d'exemple", () => {
  it("chaque scénario propose un article très, partiellement et peu pertinent", () => {
    for (const s of SCENARIOS) {
      const niveaux = new Set(ARTICLES.filter((a) => a.scenario === s.id).map((a) => a.pertinence));
      expect([...niveaux].sort()).toEqual(["partiel", "peu", "tres"]);
    }
  });

  it("les extraits sont recopiés mot pour mot du titre ou du résumé", () => {
    for (const a of ARTICLES) for (const e of a.extraits) expect(`${a.titre} ${a.resume}`, `${a.id} : ${e.texte}`).toContain(e.texte);
  });

  it("aucun article fictif ne porte de DOI ni de lien présenté comme authentique", () => {
    for (const a of ARTICLES) {
      expect(JSON.stringify(a)).not.toMatch(/10\.\d{4,9}\/|https?:\/\//);
    }
  });

  it("chaque article annote les 7 critères et des points à vérifier connus", () => {
    const ids = POINTS_A_VERIFIER.map((p) => p.id);
    for (const a of ARTICLES) {
      expect(Object.keys(a.criteres).sort()).toEqual(CRITERES.map((c) => c.id).sort());
      for (const v of a.aVerifier) expect(ids).toContain(v);
    }
  });

  it("chaque article est lisible dans l'historique (index des questions)", () => {
    for (const a of ARTICLES) expect(infoQuestion(`pertinence:${a.id}`)?.categorie).toBe("selection-evaluation");
  });
});

describe("barème", () => {
  it("totalise 100 points", () => {
    expect(Object.values(POINTS_CRITERE).reduce((s, n) => s + n, 0) + 5 + 20).toBe(100);
  });

  it("donne 100 à une analyse parfaite et 0 à une analyse vide", () => {
    for (const a of ARTICLES) {
      expect(noterAnalyse(reponsesParfaites(a), a).total, a.id).toBe(100);
      expect(noterAnalyse(REPONSES_VIDES, a).total, a.id).toBe(0);
    }
  });

  it("accorde la moitié des points à une appréciation voisine, rien à une réponse opposée", () => {
    const annotation = { attendu: "oui" as const, explication: "" };
    expect(noterCritere("oui", annotation, 15)).toEqual({ points: 15, statut: "juste" });
    expect(noterCritere("partiel", annotation, 15)).toEqual({ points: 7.5, statut: "proche" });
    expect(noterCritere("non", annotation, 15)).toEqual({ points: 0, statut: "faux" });
    expect(noterCritere("insuffisant", annotation, 15)).toEqual({ points: 0, statut: "faux" });
    expect(noterCritere("partiel", { ...annotation, acceptables: ["partiel"] }, 15).statut).toBe("juste");
  });

  it("évalue le raisonnement, pas seulement le choix final", () => {
    const a = ARTICLES.find((x) => x.id === "banque-ci")!;
    const seulementLeBonChoix = { ...REPONSES_VIDES, jugement: a.pertinence };
    expect(noterAnalyse(seulementLeBonChoix, a).total).toBeLessThanOrEqual(10);
  });

  it("pénalise les points à vérifier oubliés ou cochés à tort", () => {
    expect(noterAVerifier(["a", "b"], ["a", "b"]).points).toBe(5);
    expect(noterAVerifier([], []).points).toBe(5);
    expect(noterAVerifier(["a"], []).points).toBe(2.5);
    expect(noterAVerifier(["a"], ["a", "b"]).points).toBe(4); // 3,75 arrondi au demi-point
  });
});

describe("prompt d'analyse par l'IA", () => {
  it("reprend le sujet et l'article, et interdit de fabriquer des références", () => {
    const p = promptAnalyseIA("Mon sujet de test", { titre: "Titre X", auteurs: "", annee: "", revue: "", resume: "Résumé Y", motsCles: [], doi: null });
    expect(p).toContain("Voici mon sujet de recherche : Mon sujet de test");
    expect(p).toContain("Titre : Titre X");
    expect(p).toContain("Résumé : Résumé Y");
    expect(p).toContain("Ne fabrique aucune référence");
    expect(p).not.toContain("Auteurs :");
  });
});
