// Exercices à rendre du cours « Comprendre l'IA » : réponse courte rédigée par l'apprenant (10 à 15 min),
// corrigée par le formateur avec le barème. `attendu` guide la correction et s'affiche après correction.
// Les identifiants et `noteSur` doivent rester identiques à la table public.exercices_a_rendre
// (supabase/migrations/20261017090000_exercices_a_rendre.sql).

import type { Niveau } from "@/lib/qcm-comprendre-ia";

export type CritereBareme = { critere: string; points: number };

export type ExerciceARendre = {
  id: string;
  titre: string;
  categorie: string; // id d'une catégorie de CATEGORIES (qcm-comprendre-ia.ts)
  niveau: Niveau;
  chapitre: string;
  consigne: string;
  attendu: string;
  bareme: CritereBareme[];
  noteSur: number;
  minMots: number;
  maxMots: number;
};

export const exercicesARendre: ExerciceARendre[] = [
  {
    id: "ar1",
    titre: "Construire un prompt",
    categorie: "prompts",
    niveau: "intermediaire",
    chapitre: "4",
    consigne:
      "Rédige un prompt pour obtenir 5 problématiques de recherche sur le sujet de ton mémoire. Il doit contenir les 6 éléments : rôle, contexte, objectif, consignes, format, critères de qualité.",
    attendu:
      "Les 6 éléments sont identifiables : un rôle (ex. « Tu es un chercheur en… »), le contexte du mémoire (discipline, terrain, niveau), l'objectif (5 problématiques), des consignes, un format de réponse (liste numérotée, une phrase par problématique…) et des critères de qualité. Le sujet est précis et le prompt interdit d'inventer des références.",
    bareme: [
      { critere: "Les 6 éléments du prompt sont présents", points: 6 },
      { critere: "Sujet précis et contextualisé", points: 2 },
      { critere: "Interdiction d'inventer des références", points: 2 },
    ],
    noteSur: 10,
    minMots: 40,
    maxMots: 200,
  },
  {
    id: "ar2",
    titre: "Équation de recherche",
    categorie: "recherche-documentaire",
    niveau: "intermediaire",
    chapitre: "6.4",
    consigne:
      "Pour ton sujet : liste 3 concepts clés avec leurs mots-clés en français et en anglais, puis écris une équation de recherche avec AND, OR et des guillemets.",
    attendu:
      "3 concepts qui couvrent le sujet, chacun avec des synonymes en français et en anglais. L'équation regroupe les synonymes d'un même concept avec OR entre parenthèses, relie les concepts avec AND et met les expressions entre guillemets. Ex. : (\"intelligence artificielle\" OR \"artificial intelligence\") AND (\"recherche documentaire\" OR \"literature search\") AND (étudiant* OR student*).",
    bareme: [
      { critere: "3 concepts pertinents", points: 3 },
      { critere: "Mots-clés en français et en anglais", points: 3 },
      { critere: "Équation correcte (OR entre synonymes, AND entre concepts)", points: 4 },
    ],
    noteSur: 10,
    minMots: 20,
    maxMots: 150,
  },
  {
    id: "ar3",
    titre: "Déclarer l'usage de l'IA",
    categorie: "ethique",
    niveau: "debutant",
    chapitre: "5.4",
    consigne:
      "Rédige la déclaration d'usage de l'IA à placer dans ton mémoire : outil, version ou date, tâche réalisée, contrôle que tu as exercé.",
    attendu:
      "Le nom de l'outil avec sa version ou la date d'utilisation, la tâche précise confiée à l'IA (reformulation, plan, recherche de mots-clés…), puis le contrôle exercé : vérification des sources et des contenus, réécriture, et la mention que l'auteur reste responsable du texte.",
    bareme: [
      { critere: "Outil et date (ou version)", points: 1 },
      { critere: "Tâche précise", points: 2 },
      { critere: "Contrôle exercé et responsabilité assumée", points: 2 },
    ],
    noteSur: 5,
    minMots: 30,
    maxMots: 120,
  },
  {
    id: "ar4",
    titre: "Évaluer une source",
    categorie: "selection-evaluation",
    niveau: "intermediaire",
    chapitre: "8.1",
    consigne:
      "Choisis un article lié à ton sujet. Donne sa référence complète avec DOI, puis réponds aux 6 questions d'évaluation : auteur, lieu de publication, date, méthode, résultats justifiés, pertinence.",
    attendu:
      "Une référence complète (auteurs, année, titre, revue, volume, pages) avec un DOI qui fonctionne. Les 6 questions reçoivent chacune une réponse justifiée : qualification des auteurs, revue à comité de lecture, actualité de la date, méthode décrite, résultats appuyés sur des données, pertinence pour le sujet. Un avis final argumenté sur la fiabilité.",
    bareme: [
      { critere: "Référence complète et DOI vérifiable", points: 2 },
      { critere: "Les 6 questions traitées (1 point chacune)", points: 6 },
      { critere: "Jugement argumenté", points: 4 },
    ],
    noteSur: 12,
    minMots: 80,
    maxMots: 300,
  },
  {
    id: "ar5",
    titre: "Repérer une hallucination",
    categorie: "ethique",
    niveau: "avance",
    chapitre: "5.1",
    consigne:
      "Demande à une IA 3 références sur ton sujet. Vérifie-les dans Google Scholar ou Crossref. Indique pour chacune : existe / n'existe pas / erreurs (auteur, année, revue, DOI), et ce que tu en conclus.",
    attendu:
      "Les 3 références de l'IA, chacune vérifiée dans Google Scholar ou Crossref avec un verdict clair : existe, n'existe pas, ou existe avec des erreurs précises (auteur, année, revue, DOI). La conclusion explique qu'une référence produite par l'IA doit toujours être vérifiée à la source avant d'être citée.",
    bareme: [
      { critere: "3 références vérifiées", points: 3 },
      { critere: "Erreurs précisément identifiées", points: 3 },
      { critere: "Conclusion sur l'usage de l'IA", points: 2 },
    ],
    noteSur: 8,
    minMots: 60,
    maxMots: 250,
  },
  {
    id: "ar6",
    titre: "Paragraphe de synthèse",
    categorie: "organisation",
    niveau: "avance",
    chapitre: "9.4",
    consigne:
      "À partir de 3 publications lues, rédige un paragraphe de synthèse qui fait apparaître une convergence, une divergence et une limite. Cite les auteurs.",
    attendu:
      "Un seul paragraphe organisé par idées et non auteur par auteur : un point sur lequel les publications s'accordent, un point sur lequel elles divergent, une limite (méthode, échantillon, contexte). Les auteurs sont cités dans le texte au format (Auteur, année).",
    bareme: [
      { critere: "Convergence", points: 3 },
      { critere: "Divergence", points: 3 },
      { critere: "Limite", points: 3 },
      { critere: "Organisation par thème et non par auteur", points: 3 },
      { critere: "Citations correctes", points: 3 },
    ],
    noteSur: 15,
    minMots: 150,
    maxMots: 200,
  },
];

export const exerciceARendre = (id: string) => exercicesARendre.find((e) => e.id === id);
