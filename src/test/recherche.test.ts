import { describe, expect, it } from "vitest";
import { construireEquation, lireContenu, normaliserDoi, ressemblanceTitres, termesDuSujet } from "@/lib/recherche";

describe("termesDuSujet", () => {
  it("garde les mots significatifs du sujet, sans mots-vides ni doublons", () => {
    expect(termesDuSujet("L'effet du microcrédit sur l'emploi des femmes au Sénégal", "Le microcrédit favorise-t-il l'emploi ?")).toEqual([
      "microcrédit",
      "emploi",
      "femmes",
      "sénégal",
      "favorise",
    ]);
  });
  it("renvoie une liste vide pour un texte vide", () => {
    expect(termesDuSujet("", null, undefined)).toEqual([]);
  });
});

describe("construireEquation", () => {
  it("relie les synonymes par OR et les concepts par AND, avec guillemets pour les expressions", () => {
    expect(
      construireEquation([
        { fr: "microcrédit", en: "microcredit", synonymes: "microfinance, micro-prêt" },
        { fr: "emploi des femmes", en: "women's employment", synonymes: "" },
        { fr: "Sénégal", en: "Senegal", synonymes: "sénégal" },
      ]),
    ).toBe('(microcrédit OR microcredit OR microfinance OR micro-prêt) AND ("emploi des femmes" OR "women\'s employment") AND (Sénégal OR Senegal)');
  });
  it("ignore les concepts vides", () => {
    expect(construireEquation([{ fr: "", en: "", synonymes: "" }, { fr: "IA", en: "", synonymes: "" }])).toBe("IA");
  });
});

describe("normaliserDoi", () => {
  it("accepte les formes courantes d'un DOI", () => {
    expect(normaliserDoi("https://doi.org/10.1038/nature14539")).toBe("10.1038/nature14539");
    expect(normaliserDoi("doi: 10.1038/nature14539")).toBe("10.1038/nature14539");
    expect(normaliserDoi(" 10.1038/nature14539 ")).toBe("10.1038/nature14539");
  });
  it("refuse ce qui n'est pas un DOI", () => {
    expect(normaliserDoi("nature14539")).toBeNull();
    expect(normaliserDoi("10.12/x")).toBeNull();
  });
});

describe("ressemblanceTitres", () => {
  it("mesure la part des mots du titre saisi présents dans le titre officiel", () => {
    expect(ressemblanceTitres("Deep learning", "Deep learning")).toBe(1);
    expect(ressemblanceTitres("Microcredit and women employment", "Deep learning")).toBe(0);
  });
});

describe("lireContenu", () => {
  it("tolère un contenu absent ou mal formé", () => {
    expect(lireContenu.motsCles(undefined)).toEqual({ concepts: [] });
    expect(lireContenu.prompt({ prompt: 3, criteres: ["role", 4] })).toEqual({ prompt: "", criteres: ["role"] });
  });
});
