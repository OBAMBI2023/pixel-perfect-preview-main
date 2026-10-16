// Présentation « L'IA et la recherche — l'essentiel » du module 1 (/formations/comprendre-ia).
// `chapitre` renvoie au support public/pdfs/comprendre-ia.pdf ; PAGES_PDF donne la page où il commence.

/** Visuel d'une diapositive : figure du cours (public/slides) ou schéma dessiné en code. */
export type VisuelSlide =
  | { type: "image"; src: string; alt: string; largeur: number; hauteur: number }
  | {
      type: "titre" | "principe" | "capacites" | "frise" | "chaine" | "prompt" | "alertes" | "declaration" | "equation" | "verifier" | "retenir";
      alt: string;
    };

export type Slide = {
  id: string;
  titre: string;
  points: string[]; // 3 à 4 au maximum
  visuel: VisuelSlide;
  explication: string;
  chapitre: string; // ex. « 2.1 », « 5.3–5.4 »
};

export const slidesComprendreIA: Slide[] = [
  {
    id: "s1",
    titre: "L'IA et la recherche",
    points: ["Comprendre, utiliser et évaluer l'IA pour la recherche", "Formateur : Bamba Mahama"],
    visuel: { type: "titre", alt: "Icônes d'un cerveau et d'une loupe : l'intelligence artificielle au service de la recherche." },
    explication: "Ce module donne les repères essentiels ; le support PDF approfondit chaque point.",
    chapitre: "1",
  },
  {
    id: "s2",
    titre: "Le principe du cours",
    points: [
      "L'IA accélère l'exploration",
      "Elle ne remplace ni la réflexion, ni la méthode, ni la responsabilité",
      "Toute information et toute référence se vérifient",
    ],
    visuel: { type: "principe", alt: "Trois étapes reliées par des flèches : l'IA propose, le chercheur vérifie, le chercheur décide." },
    explication: "C'est la règle qui guide tout le cours.",
    chapitre: "1",
  },
  {
    id: "s3",
    titre: "Qu'est-ce que l'IA ?",
    points: [
      "Des systèmes qui réalisent des tâches associées aux capacités humaines",
      "Ils apprennent à partir d'exemples, contrairement à un programme classique",
      "Exemples : reconnaissance faciale, GPS, recommandations",
    ],
    visuel: { type: "capacites", alt: "Quatre capacités de l'IA : apprendre, reconnaître, prédire, décider." },
    explication: "Définition de Russell et Norvig (2021).",
    chapitre: "2.1",
  },
  {
    id: "s4",
    titre: "Repères historiques",
    points: [
      "1950 : Turing pose la question des machines pensantes",
      "1956 : le terme « IA » naît à Dartmouth",
      "2017 : l'architecture Transformer ; depuis 2022 : les assistants grand public",
    ],
    visuel: {
      type: "frise",
      alt: "Frise chronologique : 1950 Turing, 1956 Dartmouth, 1970-1990 hivers de l'IA, 2010 apprentissage profond, 2017 Transformer, 2022 assistants grand public.",
    },
    explication: "L'IA a connu des phases d'enthousiasme et de désillusion (les « hivers de l'IA »).",
    chapitre: "2.2",
  },
  {
    id: "s5",
    titre: "Comment fonctionne un système d'IA",
    points: ["Des données pour apprendre", "Un modèle entraîné qui produit un résultat : prédiction, classement, contenu"],
    visuel: { type: "chaine", alt: "Quatre blocs reliés par des flèches : données, algorithmes, modèle, résultat." },
    explication: "Exemple de l'IA qui apprend à distinguer chats et chiens.",
    chapitre: "2.3",
  },
  {
    id: "s6",
    titre: "Les branches de l'IA",
    points: [
      "IA ⊃ apprentissage automatique ⊃ apprentissage profond ⊃ IA générative",
      "Autres branches : vision par ordinateur, traitement du langage",
    ],
    visuel: {
      type: "image",
      src: "/slides/emboitement-domaines-ia.webp",
      largeur: 1079,
      hauteur: 631,
      alt: "Figure du cours : quatre cadres emboîtés. L'intelligence artificielle contient l'apprentissage automatique, qui contient l'apprentissage profond, qui contient l'IA générative (textes, images, sons, code).",
    },
    explication: "L'IA générative est une petite partie d'un domaine beaucoup plus vaste.",
    chapitre: "2.4",
  },
  {
    id: "s7",
    titre: "L'IA générative",
    points: [
      "Elle crée des contenus : texte, image, son, code",
      "Apprentissage → entraînement → instruction (prompt) → génération",
      "Elle choisit les mots les plus probables : plausible ≠ vrai",
    ],
    visuel: {
      type: "image",
      src: "/slides/etapes-ia-generative.webp",
      largeur: 1113,
      hauteur: 309,
      alt: "Figure du cours : quatre étapes de l'IA générative. 1. Apprentissage sur des données massives, 2. entraînement qui identifie des régularités, 3. instruction par le prompt de l'utilisateur, 4. génération du contenu.",
    },
    explication: "C'est la clé pour comprendre les hallucinations.",
    chapitre: "3.2",
  },
  {
    id: "s8",
    titre: "Le prompt efficace",
    points: ["Rôle · Contexte · Objectif · Consignes · Format · Critères de qualité", "On l'améliore par itérations", "Jamais de données personnelles ou confidentielles"],
    visuel: { type: "prompt", alt: "Six cases numérotées : 1 rôle, 2 contexte, 3 objectif, 4 consignes, 5 format, 6 critères de qualité." },
    explication: "Montrer l'exemple « Parle-moi de l'IA dans l'éducation » avant et après amélioration.",
    chapitre: "4",
  },
  {
    id: "s9",
    titre: "Les limites et les risques",
    points: [
      "Hallucinations : références inventées mais crédibles",
      "Biais, connaissances incomplètes",
      "Dépendance et perte d'esprit critique ; confidentialité",
    ],
    visuel: { type: "alertes", alt: "Quatre alertes : hallucinations, biais, dépendance, confidentialité." },
    explication: "Des études ont relevé des références fabriquées dans des bibliographies générées par IA (Walters et Wilder, 2023).",
    chapitre: "5",
  },
  {
    id: "s10",
    titre: "Éthique et transparence",
    points: [
      "Le chercheur reste seul responsable : l'IA n'est jamais auteur",
      "On déclare l'usage : outil, date, tâche, contrôle exercé",
      "Une réponse d'IA n'est pas une source citable",
    ],
    visuel: { type: "declaration", alt: "Un document validé par une coche : la déclaration d'usage de l'IA (outil, date, tâche, contrôle)." },
    explication: "Recommandations du COPE (2023) et de l'UNESCO (2021).",
    chapitre: "5.3–5.4",
  },
  {
    id: "s11",
    titre: "Chercher efficacement",
    points: [
      "Concepts → mots-clés en français et en anglais",
      "OR entre synonymes, AND entre concepts, \"guillemets\" pour une expression exacte",
      "Bases : Google Scholar, Semantic Scholar, PubMed, CORE",
    ],
    visuel: {
      type: "equation",
      alt: "Exemple d'équation de recherche : (\"Artificial Intelligence\" OR \"Generative AI\") AND (\"Higher Education\" OR University).",
    },
    explication: "(\"Artificial Intelligence\" OR \"Generative AI\") AND (\"Higher Education\" OR University).",
    chapitre: "6",
  },
  {
    id: "s12",
    titre: "Sélectionner et évaluer",
    points: [
      "Critères d'inclusion et d'exclusion explicites",
      "Lecture progressive : titre → résumé → méthode → résultats",
      "6 questions : qui, où, quand, comment, résultats justifiés, pertinence",
    ],
    visuel: {
      type: "image",
      src: "/slides/entonnoir-selection.webp",
      largeur: 1079,
      hauteur: 581,
      alt: "Figure du cours : entonnoir de sélection. Identification des résultats bruts des bases, tri sur le titre et le résumé, lecture complète et évaluation critique, corpus retenu saisi dans la matrice.",
    },
    explication: "L'évaluation par les pairs aide, mais ne garantit rien. Attention aux revues prédatrices.",
    chapitre: "7–8",
  },
  {
    id: "s13",
    titre: "Vérifier et organiser",
    points: [
      "Vérifier titre, auteurs, revue et DOI (Crossref, Retraction Watch)",
      "Gérer ses références avec Zotero ou Mendeley",
      "La matrice de lecture prépare la revue de littérature",
    ],
    visuel: { type: "verifier", alt: "Trois étapes : vérifier le DOI, gérer ses références dans Zotero, remplir la matrice de lecture." },
    explication: "La revue de littérature s'organise par thèmes, pas par auteur.",
    chapitre: "8.4–9",
  },
  {
    id: "s14",
    titre: "À retenir",
    points: [
      "Formuler des demandes précises et contextualisées",
      "Vérifier systématiquement chaque information et chaque référence",
      "Assumer et déclarer son usage de l'IA",
    ],
    visuel: { type: "retenir", alt: "Trois cartes numérotées résumant le cours." },
    explication: "L'IA propose, le chercheur vérifie et décide.",
    chapitre: "12",
  },
];

/** Page du PDF où commence chaque chapitre cité (première partie pour « 5.3–5.4 », « 7–8 »…). */
export const PAGES_PDF: Record<string, number> = {
  "1": 4,
  "2.1": 5,
  "2.2": 5,
  "2.3": 6,
  "2.4": 6,
  "3.2": 8,
  "4": 10,
  "5": 12,
  "5.3–5.4": 12,
  "6": 14,
  "7–8": 18,
  "8.4–9": 21,
  "12": 26,
};
