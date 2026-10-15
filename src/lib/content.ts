export const levels = [
  { name: "Débutant", courses: ["Introduction à l'intelligence artificielle", "Comprendre les modèles génératifs", "Découvrir ChatGPT et les assistants IA", "Les limites et les risques de l'IA"] },
  { name: "Intermédiaire", courses: ["Maîtriser l'art du Prompt Engineering", "Recherche bibliographique assistée par IA", "Synthèse et analyse documentaire", "Organisation des références scientifiques"] },
  { name: "Avancé", courses: ["Analyse de données avec l'IA", "Méthodologie de recherche assistée", "Automatisation des tâches scientifiques", "Rédaction et valorisation des résultats"] },
];

export const courseFeatures = ["Vidéos pédagogiques", "Supports PDF", "Leçons structurées", "Exemples concrets", "Exercices associés", "Suivi de progression"];

export type Question = {
  id: string;
  category: string;
  type: "QCM" | "Vrai ou Faux";
  level: "Débutant" | "Intermédiaire" | "Avancé";
  question: string;
  options: string[];
  answer: number;
  hint: string;
  explanation: string;
  commonError: string;
  resource: string;
};

export const questions: Question[] = [
  { id: "q1", category: "Fondamentaux de l'IA", type: "QCM", level: "Débutant", question: "Qu'est-ce qu'un modèle de langage (LLM) ?", options: ["Une base de données de faits vérifiés", "Un modèle qui prédit la suite la plus probable d'un texte", "Un moteur de recherche classique", "Un logiciel de statistiques"], answer: 1, hint: "Pensez à la façon dont il génère ses réponses, mot après mot.", explanation: "Un LLM est entraîné sur de grands corpus de textes pour prédire le mot (token) suivant le plus probable. Il ne consulte pas une base de faits vérifiés.", commonError: "Croire qu'un LLM « sait » ou vérifie ce qu'il affirme.", resource: "Module « Comprendre les modèles génératifs »" },
  { id: "q2", category: "Éthique et vérification", type: "Vrai ou Faux", level: "Débutant", question: "Les références bibliographiques proposées par une IA générative sont toujours réelles.", options: ["Vrai", "Faux"], answer: 1, hint: "Avez-vous entendu parler des « hallucinations » ?", explanation: "Les IA génératives peuvent inventer des références plausibles mais fictives (hallucinations). Chaque référence doit être vérifiée dans une base comme Google Scholar ou Crossref.", commonError: "Copier une référence sans vérifier son DOI ou son existence.", resource: "Défi « Détecter les hallucinations »" },
  { id: "q3", category: "Prompt Engineering", type: "QCM", level: "Intermédiaire", question: "Quel élément améliore le plus la qualité d'un prompt de recherche ?", options: ["Écrire en majuscules", "Donner un rôle, un contexte et un format de réponse attendu", "Poser la question la plus courte possible", "Répéter la question plusieurs fois"], answer: 1, hint: "Un bon prompt ressemble à une consigne claire donnée à un assistant.", explanation: "Préciser le rôle (« Tu es un méthodologue »), le contexte (discipline, niveau) et le format (liste, tableau) rend la réponse plus pertinente.", commonError: "Rédiger des prompts vagues sans contexte disciplinaire.", resource: "Module « Maîtriser l'art du Prompt Engineering »" },
  { id: "q4", category: "Recherche documentaire", type: "QCM", level: "Intermédiaire", question: "Quel outil est le plus adapté pour retrouver des articles scientifiques évalués par les pairs ?", options: ["Un réseau social", "Google Scholar ou Semantic Scholar", "Un générateur d'images", "Un traitement de texte"], answer: 1, hint: "Cherchez un outil spécialisé dans la littérature académique.", explanation: "Google Scholar et Semantic Scholar indexent la littérature académique et permettent de suivre les citations.", commonError: "Se limiter à une IA conversationnelle pour la recherche bibliographique.", resource: "Page Outils IA — Recherche documentaire" },
  { id: "q5", category: "Analyse de données", type: "Vrai ou Faux", level: "Avancé", question: "On peut transmettre des données personnelles sensibles de participants à n'importe quel outil d'IA en ligne.", options: ["Vrai", "Faux"], answer: 1, hint: "Pensez au RGPD et au consentement des participants.", explanation: "Les données sensibles doivent être anonymisées et traitées avec des outils conformes aux règles de protection des données et au protocole éthique.", commonError: "Oublier que les données saisies peuvent être conservées par le fournisseur.", resource: "Module « Les limites et les risques de l'IA »" },
  { id: "q6", category: "Rédaction scientifique", type: "QCM", level: "Avancé", question: "Quelle utilisation de l'IA en rédaction est la plus appropriée ?", options: ["Générer l'article entier et le soumettre", "Reformuler et améliorer la clarté d'un texte que l'on a rédigé, en le déclarant", "Inventer des résultats manquants", "Masquer le plagiat"], answer: 1, hint: "L'auteur reste responsable du contenu.", explanation: "L'IA peut aider à la reformulation et à la clarté, mais l'auteur reste responsable et doit déclarer son usage selon les règles de la revue.", commonError: "Ne pas déclarer l'usage de l'IA à l'éditeur.", resource: "Module « Rédaction et valorisation des résultats »" },
];

export const challenges = [
  { title: "Créer son premier prompt", task: "Rédiger un prompt permettant de demander à une IA de proposer un sujet de mémoire en sciences économiques.", evaluation: "Précision, contexte, rôle et qualité des consignes." },
  { title: "Analyser un article scientifique", task: "À partir d'un texte fourni, identifier la problématique, les objectifs, la méthodologie et les résultats.", evaluation: "Pertinence des éléments extraits." },
  { title: "Détecter les hallucinations", task: "Analyser une réponse générée par IA contenant des références scientifiques fictives.", evaluation: "Identifier les informations douteuses et expliquer comment les vérifier." },
  { title: "Construire une revue de littérature", task: "Organiser plusieurs résumés d'articles autour d'une problématique commune.", evaluation: "Cohérence, synthèse et qualité de l'organisation." },
];

export const tools = [
  { name: "Semantic Scholar", category: "Recherche documentaire", description: "Moteur de recherche académique enrichi par l'IA.", use: "Trouver des articles et suivre les citations.", pros: "Gratuit, résumés automatiques (TLDR).", cons: "Couverture inégale selon les disciplines.", url: "https://www.semanticscholar.org" },
  { name: "Elicit", category: "Analyse scientifique", description: "Assistant de recherche qui extrait les données d'articles.", use: "Accélérer les revues de littérature.", pros: "Tableaux d'extraction structurés.", cons: "Résultats à vérifier systématiquement.", url: "https://elicit.com" },
  { name: "Zotero", category: "Gestion bibliographique", description: "Gestionnaire de références libre et open source.", use: "Collecter, organiser et citer ses sources.", pros: "Gratuit, intégrations Word et navigateur.", cons: "Stockage cloud gratuit limité.", url: "https://www.zotero.org" },
  { name: "DeepL Write", category: "Rédaction et reformulation", description: "Outil d'amélioration de la rédaction.", use: "Améliorer la clarté de ses textes.", pros: "Très bonne qualité en français et en anglais.", cons: "Peut lisser le style de l'auteur.", url: "https://www.deepl.com/write" },
  { name: "JASP", category: "Analyse statistique", description: "Logiciel libre d'analyse statistique.", use: "Réaliser des tests statistiques sans coder.", pros: "Interface simple, gratuit.", cons: "Moins flexible que R ou Python.", url: "https://jasp-stats.org" },
  { name: "Gamma", category: "Création de présentations", description: "Génération de présentations assistée par IA.", use: "Préparer rapidement une soutenance.", pros: "Mise en page automatique soignée.", cons: "Contenu à relire et sourcer.", url: "https://gamma.app" },
];

export const resources = [
  { title: "Guide : bien rédiger un prompt de recherche", kind: "Guide", text: "Structure rôle – contexte – tâche – format, avec exemples par discipline." },
  { title: "Vérifier une référence générée par IA", kind: "Tutoriel", text: "Retrouver un DOI, consulter Crossref et Google Scholar, repérer les citations fictives." },
  { title: "Bibliothèque de prompts", kind: "Prompts", text: "« Agis comme un méthodologue en [discipline]. Propose 3 problématiques de recherche sur [sujet], avec pour chacune une question et une hypothèse. »" },
  { title: "Charte d'usage responsable de l'IA", kind: "Article", text: "Transparence, vérification, confidentialité des données et responsabilité de l'auteur." },
  { title: "Organiser sa revue de littérature", kind: "Guide", text: "Grille de lecture, tableau de synthèse et regroupement thématique des sources." },
  { title: "Anonymiser ses données avant analyse", kind: "Tutoriel", text: "Étapes pour retirer les identifiants directs et indirects d'un jeu de données." },
];

export const news = [
  { title: "Les revues scientifiques précisent leurs règles sur l'IA", text: "De nombreux éditeurs demandent désormais de déclarer l'usage des outils d'IA dans la section méthodes ou remerciements.", tag: "Éthique" },
  { title: "L'IA accélère les revues systématiques", text: "Les assistants de lecture permettent de trier des milliers de résumés, sous contrôle humain.", tag: "Méthodes" },
  { title: "Science ouverte et IA", text: "Les données ouvertes et les modèles open source favorisent une recherche plus reproductible.", tag: "Science ouverte" },
];
