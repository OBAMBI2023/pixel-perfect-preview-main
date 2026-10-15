// Rubrique « Exercices pratiques » du cours « Comprendre l'IA »
// Source : support « L'intelligence artificielle et la recherche » (Bamba Mahama, octobre 2026).
// Niveaux et catégories : les mêmes que dans qcm-comprendre-ia.ts (NIVEAUX, CATEGORIES).

import type { Niveau } from "./qcm-comprendre-ia";

type Base = {
  id: string;
  cours: string;
  categorie: string; // id d'une catégorie de CATEGORIES (qcm-comprendre-ia.ts)
  niveau: Niveau;
  titre: string;
  consigne: string;
  chapitre: string;
  explication: string; // affichée après correction
};

export type ExoVraiFaux = Base & {
  type: "vrai-faux";
  affirmation: string;
  reponse: boolean;
  justifications: string[]; // l'apprenant choisit aussi la bonne justification
  justificationCorrecte: number;
};

export type ExoAssociation = Base & {
  type: "association";
  paires: { gauche: string; droite: string }[]; // ordre correct ; mélanger la colonne de droite à l'affichage
};

export type ExoOrdre = Base & {
  type: "ordre";
  elements: string[]; // dans le bon ordre ; mélanger à l'affichage
};

export type ElementPrompt = "role" | "contexte" | "objectif" | "consignes" | "format" | "criteres" | "a-exclure";

export const ELEMENTS_PROMPT: { id: ElementPrompt; label: string }[] = [
  { id: "role", label: "1. Rôle" },
  { id: "contexte", label: "2. Contexte" },
  { id: "objectif", label: "3. Objectif" },
  { id: "consignes", label: "4. Consignes" },
  { id: "format", label: "5. Format" },
  { id: "criteres", label: "6. Critères de qualité" },
  { id: "a-exclure", label: "À ne pas mettre dans un prompt" },
];

export type ExoPrompt = Base & {
  type: "construire-prompt";
  promptVague: string;
  morceaux: { texte: string; element: ElementPrompt }[]; // mélanger à l'affichage
};

export type ExoEquation = Base & {
  type: "equation";
  sujet: string;
  gabarit: string; // {0}, {1}… = trous à compléter
  trous: { options: string[]; reponse: number }[];
};

export type ExoEtudeCas = Base & {
  type: "etude-cas";
  contexte: string;
  references: { texte: string; fiable: boolean; analyse: string }[];
};

export type Exercice = ExoVraiFaux | ExoAssociation | ExoOrdre | ExoPrompt | ExoEquation | ExoEtudeCas;

export const TYPES_EXERCICE: { id: Exercice["type"]; label: string; description: string }[] = [
  { id: "vrai-faux", label: "Vrai ou faux justifié", description: "Juger une affirmation et choisir la bonne justification" },
  { id: "association", label: "Associer", description: "Relier chaque élément à sa définition ou à son usage" },
  { id: "ordre", label: "Remettre dans l'ordre", description: "Classer les étapes par glisser-déposer" },
  { id: "construire-prompt", label: "Construire un prompt", description: "Ranger chaque morceau dans le bon élément du prompt" },
  { id: "equation", label: "Équation de recherche", description: "Compléter avec les opérateurs booléens" },
  { id: "etude-cas", label: "Étude de cas : vérifier les références", description: "Repérer les références fiables et les références inventées" },
];

const C = "comprendre-ia";

export const exercicesComprendreIA: Exercice[] = [
  // ───────────── VRAI OU FAUX JUSTIFIÉ ─────────────
  {
    id: "vf1", type: "vrai-faux", cours: C, categorie: "fondements", niveau: "debutant", chapitre: "2.1",
    titre: "IA et apprentissage", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Certains systèmes d'IA apprennent à partir d'exemples et améliorent leurs performances au fil de leur entraînement.",
    reponse: true,
    justifications: [
      "Contrairement à un programme classique, qui exécute uniquement des instructions prédéfinies",
      "Parce qu'ils sont connectés à Internet en permanence",
      "Parce qu'un humain réécrit leur code chaque jour",
    ],
    justificationCorrecte: 0,
    explication: "C'est ce qui distingue certains systèmes d'IA d'un programme classique.",
  },
  {
    id: "vf2", type: "vrai-faux", cours: C, categorie: "ia-generative", niveau: "debutant", chapitre: "3.5",
    titre: "IA et IA générative", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "L'IA générative est une catégorie particulière de l'intelligence artificielle.",
    reponse: true,
    justifications: [
      "C'est un domaine totalement indépendant de l'IA",
      "Elle est spécialisée dans la création de contenus, au sein du domaine global de l'IA",
      "Elle est apparue avant l'IA",
    ],
    justificationCorrecte: 1,
    explication: "L'IA est le domaine global (analyser, reconnaître, prédire, classer) ; l'IA générative en est une catégorie qui crée des contenus.",
  },
  {
    id: "vf3", type: "vrai-faux", cours: C, categorie: "recherche-documentaire", niveau: "debutant", chapitre: "6.3",
    titre: "Google Scholar et qualité", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Un document présent dans Google Scholar a forcément été évalué par les pairs.",
    reponse: false,
    justifications: [
      "Google Scholar n'indexe que des revues payantes",
      "Google Scholar vérifie chaque article avant de l'indexer",
      "Un moteur académique indexe des documents de nature variée, évalués ou non par les pairs",
    ],
    justificationCorrecte: 2,
    explication: "La présence dans un moteur académique n'est pas un label de qualité.",
  },
  {
    id: "vf4", type: "vrai-faux", cours: C, categorie: "prompts", niveau: "intermediaire", chapitre: "4.4",
    titre: "Longueur d'un prompt", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Plus un prompt est long, meilleure est la réponse.",
    reponse: false,
    justifications: [
      "Un bon prompt se mesure à la pertinence des informations fournies, pas à sa longueur",
      "Les IA ignorent les prompts longs",
      "Un prompt doit toujours tenir en une ligne",
    ],
    justificationCorrecte: 0,
    explication: "Ce qui compte : rôle, contexte, objectif, consignes, format et critères de qualité, puis des itérations.",
  },
  {
    id: "vf5", type: "vrai-faux", cours: C, categorie: "ethique", niveau: "intermediaire", chapitre: "5.1",
    titre: "Référence avec DOI", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Si une IA fournit une référence avec un DOI, on peut la reprendre sans la vérifier.",
    reponse: false,
    justifications: [
      "Un DOI prouve toujours que l'article existe",
      "Une IA peut inventer des références d'apparence crédible : chaque référence se vérifie à la source",
      "Les DOI ne concernent que les livres",
    ],
    justificationCorrecte: 1,
    explication: "Des études ont relevé des références fabriquées ou erronées dans des bibliographies générées par IA (Walters et Wilder, 2023).",
  },
  {
    id: "vf6", type: "vrai-faux", cours: C, categorie: "selection-evaluation", niveau: "intermediaire", chapitre: "7.2",
    titre: "Documents anciens", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Un document ancien doit être exclu automatiquement d'une revue de littérature.",
    reponse: false,
    justifications: [
      "Les documents anciens ne sont plus indexés",
      "Seules les publications de moins de 5 ans sont scientifiques",
      "Certains travaux fondateurs restent indispensables pour comprendre les théories et concepts",
    ],
    justificationCorrecte: 2,
    explication: "L'exclusion pour cause de période n'est valable que si la limite est justifiée.",
  },
  {
    id: "vf7", type: "vrai-faux", cours: C, categorie: "selection-evaluation", niveau: "avance", chapitre: "8.2",
    titre: "Évaluation par les pairs", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "Une publication évaluée par les pairs n'a pas besoin d'être lue de façon critique.",
    reponse: false,
    justifications: [
      "L'évaluation par les pairs améliore le contrôle scientifique, mais ne garantit pas l'absence d'erreurs",
      "Les évaluateurs sont toujours unanimes",
      "Ce processus est réservé aux revues prédatrices",
    ],
    justificationCorrecte: 0,
    explication: "Ses limites sont documentées (Tennant et Ross-Hellauer, 2020) : la lecture critique reste nécessaire.",
  },
  {
    id: "vf8", type: "vrai-faux", cours: C, categorie: "ethique", niveau: "avance", chapitre: "5.4",
    titre: "Citer une réponse d'IA", consigne: "Vrai ou faux ? Choisis ensuite la bonne justification.",
    affirmation: "On peut citer une réponse d'IA à la place des publications qu'elle évoque.",
    reponse: false,
    justifications: [
      "C'est possible uniquement en style Chicago",
      "Une réponse d'IA n'est jamais une source scientifique : les publications se consultent directement",
      "C'est possible si l'outil est récent",
    ],
    justificationCorrecte: 1,
    explication: "On déclare l'usage de l'IA, mais on cite les publications elles-mêmes, après les avoir lues.",
  },

  // ───────────── ASSOCIER ─────────────
  {
    id: "as1", type: "association", cours: C, categorie: "fondements", niveau: "debutant", chapitre: "2.4",
    titre: "Les branches de l'IA", consigne: "Relie chaque branche de l'IA à sa description.",
    paires: [
      { gauche: "Apprentissage automatique", droite: "Apprendre à partir de données pour prédire ou classer" },
      { gauche: "Apprentissage profond", droite: "Réseaux de neurones artificiels à plusieurs couches" },
      { gauche: "IA générative", droite: "Créer des textes, images, sons, vidéos ou du code" },
      { gauche: "Vision par ordinateur", droite: "Analyser et interpréter des images et des vidéos" },
      { gauche: "Traitement du langage naturel", droite: "Traiter, analyser et générer le langage humain" },
    ],
    explication: "Voir le tableau 4 du cours.",
  },
  {
    id: "as2", type: "association", cours: C, categorie: "recherche-documentaire", niveau: "debutant", chapitre: "6.2",
    titre: "Types de sources", consigne: "Relie chaque type de document à son utilisation principale.",
    paires: [
      { gauche: "Article scientifique", droite: "Résultats et connaissances scientifiques" },
      { gauche: "Revue systématique", droite: "État des connaissances" },
      { gauche: "Ouvrage académique", droite: "Théories et concepts" },
      { gauche: "Thèse de doctorat", droite: "Méthodologie et résultats" },
      { gauche: "Rapport institutionnel", droite: "Statistiques et données institutionnelles" },
    ],
    explication: "Voir le tableau 10 du cours.",
  },
  {
    id: "as3", type: "association", cours: C, categorie: "recherche-documentaire", niveau: "intermediaire", chapitre: "6.3",
    titre: "Outils de recherche", consigne: "Relie chaque outil à sa spécialité.",
    paires: [
      { gauche: "Google Scholar", droite: "Articles, thèses, ouvrages et citations" },
      { gauche: "PubMed", droite: "Médecine, biologie et sciences biomédicales" },
      { gauche: "CORE", droite: "Publications scientifiques en accès ouvert" },
      { gauche: "Crossref", droite: "Vérification des métadonnées et des DOI" },
      { gauche: "Semantic Scholar", droite: "Exploration des publications et des travaux associés" },
    ],
    explication: "Voir le tableau 11 du cours.",
  },
  {
    id: "as4", type: "association", cours: C, categorie: "ethique", niveau: "intermediaire", chapitre: "5.3",
    titre: "Risques et précautions", consigne: "Relie chaque risque à la mesure de précaution adaptée.",
    paires: [
      { gauche: "Références inventées", droite: "Vérifier chaque référence dans Crossref, chez l'éditeur ou dans la base d'origine" },
      { gauche: "Biais", droite: "Croiser plusieurs sources et examiner les réponses de façon critique" },
      { gauche: "Dépendance", droite: "Réserver à l'humain l'analyse, l'interprétation et la décision" },
      { gauche: "Confidentialité", droite: "Ne pas saisir de données personnelles ou confidentielles" },
      { gauche: "Atteinte à l'intégrité", droite: "Déclarer l'usage de l'IA et citer les sources" },
    ],
    explication: "Voir le tableau 9 du cours.",
  },
  {
    id: "as5", type: "association", cours: C, categorie: "recherche-documentaire", niveau: "avance", chapitre: "6.6",
    titre: "Outils d'IA pour la recherche", consigne: "Relie chaque outil d'IA à son usage principal.",
    paires: [
      { gauche: "Elicit", droite: "Rechercher des articles et en extraire des informations" },
      { gauche: "Consensus", droite: "Obtenir des éléments de réponse à partir d'études publiées" },
      { gauche: "Scite", droite: "Voir si un article est cité en soutien ou en contraste" },
      { gauche: "ResearchRabbit", droite: "Cartographier les publications liées par les citations" },
      { gauche: "NotebookLM", droite: "Interroger ses propres documents" },
    ],
    explication: "Quel que soit l'outil, aucune référence n'est retenue sans vérification à la source (tableau 13).",
  },

  // ───────────── REMETTRE DANS L'ORDRE ─────────────
  {
    id: "or1", type: "ordre", cours: C, categorie: "fondements", niveau: "debutant", chapitre: "2.2",
    titre: "Chronologie de l'IA", consigne: "Classe ces événements du plus ancien au plus récent.",
    elements: [
      "Article de Turing sur les machines et l'intelligence (1950)",
      "Atelier de Dartmouth : naissance du terme « IA » (1956)",
      "Les « hivers de l'IA » (années 1970–1990)",
      "Essor de l'apprentissage profond (années 2010)",
      "Architecture Transformer (2017)",
      "Assistants conversationnels grand public (depuis 2022)",
    ],
    explication: "Voir le tableau 2 du cours.",
  },
  {
    id: "or2", type: "ordre", cours: C, categorie: "ia-generative", niveau: "debutant", chapitre: "3.2",
    titre: "Fonctionnement de l'IA générative", consigne: "Remets les quatre étapes dans l'ordre.",
    elements: ["Apprentissage", "Entraînement", "Instruction (prompt)", "Génération"],
    explication: "Le modèle est exposé aux données, en tire des régularités, reçoit une demande, puis produit un contenu.",
  },
  {
    id: "or3", type: "ordre", cours: C, categorie: "recherche-documentaire", niveau: "intermediaire", chapitre: "6.4",
    titre: "Stratégie de recherche", consigne: "Remets les étapes de la stratégie de recherche dans l'ordre.",
    elements: [
      "Définir les concepts clés et leurs mots-clés",
      "Combiner les termes avec les opérateurs booléens",
      "Affiner avec les filtres (année, type, langue…)",
      "Enregistrer les références dès leur découverte",
    ],
    explication: "Une recherche efficace suit une stratégie structurée en quatre étapes.",
  },
  {
    id: "or4", type: "ordre", cours: C, categorie: "selection-evaluation", niveau: "intermediaire", chapitre: "7.3",
    titre: "Lecture progressive d'un article", consigne: "Dans quel ordre lire un article pour juger rapidement de sa pertinence ?",
    elements: ["Titre", "Résumé", "Mots-clés", "Introduction", "Méthodologie", "Résultats", "Discussion", "Conclusion"],
    explication: "La lecture progressive suit la structure usuelle d'un article (Keshav, 2007).",
  },
  {
    id: "or5", type: "ordre", cours: C, categorie: "selection-evaluation", niveau: "avance", chapitre: "8.4",
    titre: "Vérifier une référence", consigne: "Remets dans l'ordre la procédure de vérification d'une référence.",
    elements: [
      "Rechercher le titre exact de l'article",
      "Vérifier le nom des auteurs",
      "Contrôler l'année de publication",
      "Vérifier le nom de la revue",
      "Comparer le DOI avec les métadonnées",
      "Consulter la page officielle de l'éditeur",
      "Vérifier s'il y a eu une correction ou une rétractation",
    ],
    explication: "Outils utiles : Crossref Search, Retraction Watch, Google Scholar.",
  },
  {
    id: "or6", type: "ordre", cours: C, categorie: "organisation", niveau: "avance", chapitre: "10",
    titre: "Démarche intégrée IA–recherche", consigne: "Remets dans l'ordre les sept étapes de la démarche intégrée.",
    elements: ["Cadrer", "Préparer", "Chercher", "Sélectionner", "Évaluer", "Organiser", "Synthétiser"],
    explication: "À chaque étape, l'IA peut assister, mais le contrôle reste humain (tableau 19).",
  },

  // ───────────── CONSTRUIRE UN PROMPT ─────────────
  {
    id: "cp1", type: "construire-prompt", cours: C, categorie: "prompts", niveau: "debutant", chapitre: "4.2",
    titre: "Prompt pour un mémoire", consigne: "Place chaque morceau dans le bon élément du prompt.",
    promptVague: "Parle-moi du chômage des jeunes.",
    morceaux: [
      { texte: "Agis comme un chercheur spécialisé en sociologie.", element: "role" },
      { texte: "Je prépare un mémoire sur le chômage des jeunes en Côte d'Ivoire.", element: "contexte" },
      { texte: "Propose cinq problématiques de recherche pertinentes.", element: "objectif" },
      { texte: "Évite les sujets trop généraux et privilégie une approche empirique.", element: "consignes" },
      { texte: "Présente les propositions dans un tableau avec les objectifs associés.", element: "format" },
      { texte: "Signale les limites, distingue les faits des hypothèses et n'invente aucune référence.", element: "criteres" },
    ],
    explication: "Cet exemple est celui du tableau 8 du cours.",
  },
  {
    id: "cp2", type: "construire-prompt", cours: C, categorie: "prompts", niveau: "intermediaire", chapitre: "4.3",
    titre: "Améliorer un prompt imprécis", consigne: "Place chaque morceau dans le bon élément du prompt.",
    promptVague: "Parle-moi de l'intelligence artificielle dans l'éducation.",
    morceaux: [
      { texte: "Agis comme un spécialiste en sciences de l'éducation.", element: "role" },
      { texte: "Je travaille sur l'enseignement supérieur en Afrique de l'Ouest.", element: "contexte" },
      { texte: "Analyse les effets de l'IA générative sur les pratiques pédagogiques.", element: "objectif" },
      { texte: "Présente les opportunités, les limites et les enjeux éthiques.", element: "consignes" },
      { texte: "Structure ta réponse en trois parties et adopte un langage académique.", element: "format" },
      { texte: "Distingue les faits des hypothèses et n'invente aucune référence.", element: "criteres" },
    ],
    explication: "La version améliorée précise le rôle, le sujet, le contexte géographique, l'objectif et la structure.",
  },
  {
    id: "cp3", type: "construire-prompt", cours: C, categorie: "prompts", niveau: "avance", chapitre: "4.4 / 6.5",
    titre: "Prompt de recherche documentaire (avec piège)", consigne: "Place chaque morceau dans le bon élément. Attention : un morceau ne doit pas figurer dans un prompt.",
    promptVague: "Trouve-moi des articles sur l'IA à l'université.",
    morceaux: [
      { texte: "Agis comme un spécialiste de la recherche documentaire scientifique.", element: "role" },
      { texte: "Mon sujet : l'influence de l'IA sur les pratiques pédagogiques dans les universités ivoiriennes.", element: "contexte" },
      { texte: "Identifie les concepts clés, les mots-clés en français et en anglais, et leurs synonymes.", element: "objectif" },
      { texte: "Propose des équations de recherche adaptées à Google Scholar et Semantic Scholar.", element: "consignes" },
      { texte: "Présente les mots-clés dans un tableau à deux colonnes (français / anglais).", element: "format" },
      { texte: "Ne fabrique aucune référence et distingue les suggestions des publications vérifiées.", element: "criteres" },
      { texte: "Voici la liste de mes étudiants avec leurs notes, pour personnaliser la réponse.", element: "a-exclure" },
    ],
    explication: "On ne transmet jamais de données personnelles ou confidentielles dans un prompt (chapitres 4.4 et 5.3).",
  },

  // ───────────── ÉQUATION DE RECHERCHE ─────────────
  {
    id: "eq1", type: "equation", cours: C, categorie: "recherche-documentaire", niveau: "debutant", chapitre: "6.4",
    titre: "Associer deux concepts", consigne: "Complète l'équation.",
    sujet: "Trouver des articles qui traitent à la fois de l'IA et de l'enseignement supérieur.",
    gabarit: "\"Artificial Intelligence\" {0} \"Higher Education\"",
    trous: [{ options: ["AND", "OR", "NOT"], reponse: 0 }],
    explication: "AND associe deux concepts et réduit généralement les résultats.",
  },
  {
    id: "eq2", type: "equation", cours: C, categorie: "recherche-documentaire", niveau: "debutant", chapitre: "6.4",
    titre: "Expression exacte", consigne: "Choisis la bonne écriture.",
    sujet: "Rechercher l'IA associée à l'expression exacte « Ivory Coast ».",
    gabarit: "\"Artificial Intelligence\" AND {0}",
    trous: [{ options: ["Ivory OR Coast", "\"Ivory Coast\"", "Ivory NOT Coast"], reponse: 1 }],
    explication: "Les guillemets recherchent une expression exacte.",
  },
  {
    id: "eq3", type: "equation", cours: C, categorie: "recherche-documentaire", niveau: "intermediaire", chapitre: "6.4",
    titre: "Synonymes et concepts", consigne: "Complète l'équation avec les bons opérateurs.",
    sujet: "IA ou IA générative, appliquée aux pratiques pédagogiques (teaching practices ou pedagogy).",
    gabarit: "(\"Artificial Intelligence\" {0} \"Generative AI\") {1} (\"Teaching Practices\" {2} Pedagogy)",
    trous: [
      { options: ["AND", "OR", "NOT"], reponse: 1 },
      { options: ["AND", "OR", "NOT"], reponse: 0 },
      { options: ["AND", "OR", "NOT"], reponse: 1 },
    ],
    explication: "OR regroupe les synonymes à l'intérieur d'un concept ; AND relie les concepts entre eux.",
  },
  {
    id: "eq4", type: "equation", cours: C, categorie: "recherche-documentaire", niveau: "avance", chapitre: "6.4",
    titre: "Exclure un terme", consigne: "Complète l'équation avec les bons opérateurs.",
    sujet: "IA ou IA générative dans l'enseignement supérieur (higher education ou university), en excluant l'école primaire.",
    gabarit: "(\"Artificial Intelligence\" {0} \"Generative AI\") {1} (\"Higher Education\" {2} University) {3} \"Primary School\"",
    trous: [
      { options: ["AND", "OR", "NOT"], reponse: 1 },
      { options: ["AND", "OR", "NOT"], reponse: 0 },
      { options: ["AND", "OR", "NOT"], reponse: 1 },
      { options: ["AND", "OR", "NOT"], reponse: 2 },
    ],
    explication: "NOT exclut un terme, mais il s'utilise avec prudence : il peut écarter des articles pertinents qui comparent les deux niveaux.",
  },

  // ───────────── ÉTUDE DE CAS ─────────────
  // Les références marquées fiable: false sont FICTIVES, créées pour l'exercice.
  {
    id: "ec1", type: "etude-cas", cours: C, categorie: "ethique", niveau: "intermediaire", chapitre: "5.1 / 8.4",
    titre: "La bibliographie proposée par l'IA", consigne: "Pour chaque référence, choisis « Garder » ou « Rejeter ». L'analyse s'affiche après validation.",
    contexte: "Un étudiant a demandé à une IA quatre références sur les erreurs des IA génératives et la revue de littérature. Il doit décider lesquelles garder avant de les vérifier en détail.",
    references: [
      {
        texte: "Walters, W. H., & Wilder, E. I. (2023). Fabrication and errors in the bibliographic citations generated by ChatGPT. Scientific Reports, 13, article 14045.",
        fiable: true,
        analyse: "Référence cohérente : auteurs, revue, volume et numéro d'article concordent. Elle figure dans la bibliographie du cours.",
      },
      {
        texte: "Kouassi, A., & Martin, L. (2024). L'IA générative dans les universités ivoiriennes. Journal of African Digital Learning, 12(3), 45–67. https://doi.org/10.9999/jadl.2024.123",
        fiable: false,
        analyse: "Référence fictive : la revue est introuvable et le DOI ne renvoie à rien dans Crossref. Un sujet « sur mesure » est un signal d'alerte.",
      },
      {
        texte: "Page, M. J., McKenzie, J. E., Bossuyt, P. M., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. BMJ, 372, n71. https://doi.org/10.1136/bmj.n71",
        fiable: true,
        analyse: "Référence cohérente : le DOI correspond au titre, à la revue et à l'année.",
      },
      {
        texte: "Turing, A. M. (1950). Deep learning for higher education. Nature, 521, 436–444.",
        fiable: false,
        analyse: "Référence incohérente : le deep learning n'existait pas en 1950. Le volume et les pages sont ceux de LeCun et al. (2015). C'est un mélange typique d'hallucination.",
      },
    ],
    explication: "Toute référence proposée par une IA se retrouve et se vérifie à la source avant d'être citée.",
  },
  {
    id: "ec2", type: "etude-cas", cours: C, categorie: "selection-evaluation", niveau: "avance", chapitre: "8.3 / 8.4",
    titre: "Sources fiables ou douteuses ?", consigne: "Pour chaque référence, choisis « Garder » ou « Rejeter ». L'analyse s'affiche après validation.",
    contexte: "Pour sa revue de littérature, une chercheuse a réuni quatre références trouvées en ligne et via une IA.",
    references: [
      {
        texte: "Keshav, S. (2007). How to read a paper. ACM SIGCOMM Computer Communication Review, 37(3), 83–84.",
        fiable: true,
        analyse: "Référence cohérente, citée dans le cours pour la lecture progressive.",
      },
      {
        texte: "Diallo, M. (2025). ChatGPT et la revue de littérature : guide complet. Revue internationale d'IA appliquée (« publication garantie sous 72 h »).",
        fiable: false,
        analyse: "Référence fictive. Une publication garantie en quelques jours est un signal de revue prédatrice. Pas de volume, de pages ni de DOI.",
      },
      {
        texte: "Ji, Z., Lee, N., Frieske, R., et al. (2023). Survey of hallucination in natural language generation. ACM Computing Surveys, 55(12), article 248.",
        fiable: true,
        analyse: "Référence cohérente, citée dans le cours à propos des hallucinations.",
      },
      {
        texte: "Bender, E. M., Gebru, T., et al. (2021). On the dangers of stochastic parrots. Nature, 590, 12–15.",
        fiable: false,
        analyse: "Le titre existe, mais la source est fausse : c'est une communication de la conférence FAccT '21 (pages 610–623), pas un article de Nature. Il faut vérifier chaque métadonnée, pas seulement le titre.",
      },
    ],
    explication: "Aucun indicateur isolé ne suffit : on vérifie auteurs, revue, année, pages et DOI.",
  },
];

export function filtrerExercices(opts: { type?: Exercice["type"]; categorie?: string; niveau?: Niveau } = {}): Exercice[] {
  return exercicesComprendreIA.filter(
    (e) =>
      (!opts.type || e.type === opts.type) &&
      (!opts.categorie || e.categorie === opts.categorie) &&
      (!opts.niveau || e.niveau === opts.niveau),
  );
}
