// Outils de recherche documentaire présentés sur /outils-ia.
// Fiches complètes : Google Scholar, PubMed, NotebookLM. Fiches courtes : usage + 2 avantages + 2 limites.
// Les fonctions et conditions d'accès évoluent : vérifiées en octobre 2026.

export type TypeOutil = "moteur" | "base" | "ia";

export type OutilRecherche = {
  id: string;
  nom: string;
  type: TypeOutil;
  editeur: string;
  url: string;
  usage: string;
  avantages: string[];
  limites: string[];
  bonUsage: string;
  chapitre: string; // chapitre du support « L'intelligence artificielle et la recherche »
};

export const TYPES_OUTIL: { id: TypeOutil; label: string; badge: string }[] = [
  { id: "moteur", label: "Moteurs académiques", badge: "Moteur académique" },
  { id: "base", label: "Bases spécialisées", badge: "Base spécialisée" },
  { id: "ia", label: "Outils d'IA", badge: "Outil d'IA" },
];

export const outilsRecherche: OutilRecherche[] = [
  {
    id: "google-scholar",
    nom: "Google Scholar",
    type: "moteur",
    editeur: "Google",
    url: "https://scholar.google.com",
    usage: "Rechercher des articles, thèses, ouvrages et actes de conférence, toutes disciplines.",
    avantages: [
      "Gratuit, couverture très large et multidisciplinaire (articles, thèses, livres, prépublications)",
      "« Cité par » et « Articles connexes » pour remonter et descendre dans la littérature",
      "Liens vers des versions PDF en accès libre quand elles existent",
      "Export des références vers Zotero, Mendeley ou BibTeX, et alertes par e-mail",
    ],
    limites: [
      "Aucun contrôle de qualité : on y trouve des documents non évalués par les pairs et des revues douteuses",
      "Classement peu transparent, qui favorise les documents déjà très cités",
      "Filtres limités (pas de filtre par type de document ni par discipline)",
      "Métadonnées parfois erronées et doublons ; recherche peu reproductible pour une revue systématique",
    ],
    bonUsage: "Point de départ pour explorer un sujet, puis vérifier chaque source (revue, DOI) et compléter par une base spécialisée.",
    chapitre: "6.3",
  },
  {
    id: "pubmed",
    nom: "PubMed",
    type: "base",
    editeur: "National Library of Medicine (NIH, États-Unis)",
    url: "https://pubmed.ncbi.nlm.nih.gov",
    usage: "Recherche en médecine, biologie, santé publique et sciences biomédicales.",
    avantages: [
      "Gratuit, produit par une institution publique de référence",
      "Vocabulaire contrôlé MeSH : retrouve les articles même s'ils utilisent d'autres termes",
      "Filtres puissants : type d'étude (essai clinique, revue systématique…), date, langue, texte intégral gratuit",
      "Historique et requêtes reproductibles, liens vers le texte intégral gratuit sur PubMed Central",
    ],
    limites: [
      "Limité au biomédical et aux sciences de la vie : inadapté aux sciences humaines, à l'éducation ou au droit",
      "Donne surtout des résumés ; le texte intégral n'est pas toujours accessible",
      "Interface en anglais ; le vocabulaire MeSH demande un apprentissage",
      "Couverture plus faible des revues africaines et francophones",
    ],
    bonUsage: "Base de référence en santé ; combiner mots-clés et termes MeSH, et utiliser les filtres de type d'étude.",
    chapitre: "6.3",
  },
  {
    id: "notebooklm",
    nom: "NotebookLM",
    type: "ia",
    editeur: "Google",
    url: "https://notebooklm.google.com",
    usage: "Interroger, résumer et comparer ses propres documents (PDF, Google Docs, pages web, vidéos).",
    avantages: [
      "Répond uniquement à partir des documents fournis par l'utilisateur",
      "Chaque réponse renvoie au passage exact de la source, ce qui facilite la vérification",
      "Génère résumés, FAQ, guides d'étude et aperçus audio pour réviser",
      "Moins d'inventions qu'un assistant généraliste, car ancré dans les sources",
    ],
    limites: [
      "Ne cherche pas de nouvelles publications : il ne vaut que ce qu'on lui donne",
      "Peut mal interpréter ou trop généraliser un passage : relire l'extrait cité",
      "Documents envoyés sur les serveurs de Google : ne pas y déposer de données personnelles ou de travaux confidentiels",
      "Compte Google et connexion Internet requis ; nombre et taille des sources limités selon l'offre",
    ],
    bonUsage: "Après la sélection des sources, pour comparer plusieurs articles déjà vérifiés et préparer la matrice de lecture.",
    chapitre: "6.6",
  },
  // ───── Fiches courtes ─────
  {
    id: "semantic-scholar",
    nom: "Semantic Scholar",
    type: "moteur",
    editeur: "Allen Institute for AI (Ai2)",
    url: "https://www.semanticscholar.org",
    usage: "Trouver des articles et suivre les citations.",
    avantages: ["Gratuit", "Recommandations et graphe de citations", "Résumés courts générés par IA"],
    limites: ["Couverture inégale selon les disciplines", "Résumés IA à vérifier"],
    bonUsage: "Compléter Google Scholar pour suivre les citations et découvrir des articles proches ; vérifier les résumés IA dans l'article.",
    chapitre: "6.3",
  },
  {
    id: "crossref",
    nom: "Crossref",
    type: "base",
    editeur: "Crossref (organisation à but non lucratif)",
    url: "https://search.crossref.org",
    usage: "Vérifier les métadonnées et les DOI d'une publication.",
    avantages: ["Vérification fiable des DOI et métadonnées", "Gratuit"],
    limites: ["Ne donne pas le texte intégral", "Pas un outil de recherche thématique"],
    bonUsage: "Vérifier qu'un DOI existe et correspond au bon titre, aux bons auteurs et à la bonne revue avant de citer une référence.",
    chapitre: "6.3",
  },
  {
    id: "elicit",
    nom: "Elicit",
    type: "ia",
    editeur: "Elicit",
    url: "https://elicit.com",
    usage: "Rechercher des articles et en extraire des informations, pour accélérer les revues de littérature.",
    avantages: ["Extraction de données dans les articles", "Tableaux comparatifs"],
    limites: ["Extractions à contrôler dans l'article source", "Fonctions avancées payantes"],
    bonUsage: "Préparer un tableau comparatif d'articles déjà sélectionnés, puis contrôler chaque donnée extraite dans l'article source.",
    chapitre: "6.6",
  },
  {
    id: "consensus",
    nom: "Consensus",
    type: "ia",
    editeur: "Consensus",
    url: "https://consensus.app",
    usage: "Obtenir des éléments de réponse à partir d'études publiées.",
    avantages: ["Synthèse rapide à partir d'études publiées", "Cite les études utilisées"],
    limites: ["Synthèse simplifiée", "Lire les études citées avant de conclure"],
    bonUsage: "Obtenir une première vue d'ensemble d'une question, puis lire les études citées avant toute conclusion.",
    chapitre: "6.6",
  },
  {
    id: "scite",
    nom: "Scite",
    type: "ia",
    editeur: "Scite",
    url: "https://scite.ai",
    usage: "Voir si un article est cité en soutien ou en contraste.",
    avantages: ["Montre si un article est cité en soutien ou en contraste", "Repère les articles contestés"],
    limites: ["Classement automatique imparfait", "En grande partie payant"],
    bonUsage: "Repérer si un article est contesté ou confirmé, en lisant la phrase de citation dans son contexte.",
    chapitre: "6.6",
  },
  {
    id: "researchrabbit",
    nom: "ResearchRabbit",
    type: "ia",
    editeur: "ResearchRabbit",
    url: "https://www.researchrabbit.ai",
    usage: "Cartographier les publications liées par les citations.",
    avantages: ["Cartographie visuelle des publications liées", "Suivi de nouveaux articles"],
    limites: ["Dépend des citations", "Ne remplace pas une recherche systématique"],
    bonUsage: "Découvrir des travaux liés à un article clé, puis compléter par une recherche par mots-clés dans les bases.",
    chapitre: "6.6",
  },
];

/** Colonnes du tableau comparatif non couvertes par les fiches. */
export const comparatif: Record<string, { acces: string; discipline: string }> = {
  "google-scholar": { acces: "Gratuit", discipline: "Toutes disciplines" },
  pubmed: { acces: "Gratuit", discipline: "Médecine, biologie, santé" },
  notebooklm: { acces: "Gratuit avec compte Google (limites selon l'offre)", discipline: "Selon vos documents" },
  "semantic-scholar": { acces: "Gratuit", discipline: "Toutes (couverture inégale)" },
  crossref: { acces: "Gratuit", discipline: "Toutes (métadonnées)" },
  elicit: { acces: "Gratuit, fonctions avancées payantes", discipline: "Toutes disciplines" },
  consensus: { acces: "Gratuit (limité) + offre payante", discipline: "Toutes disciplines" },
  scite: { acces: "En grande partie payant", discipline: "Toutes disciplines" },
  researchrabbit: { acces: "Gratuit (limité) + offre payante", discipline: "Toutes disciplines" },
};

/** Outils déjà présents sur la page, hors des trois types ci-dessus : conservés tels quels. */
export const autresOutils = [
  { name: "Zotero", category: "Gestion bibliographique", description: "Gestionnaire de références libre et open source.", use: "Collecter, organiser et citer ses sources.", pros: "Gratuit, intégrations Word et navigateur.", cons: "Stockage cloud gratuit limité.", url: "https://www.zotero.org" },
  { name: "DeepL Write", category: "Rédaction et reformulation", description: "Outil d'amélioration de la rédaction.", use: "Améliorer la clarté de ses textes.", pros: "Très bonne qualité en français et en anglais.", cons: "Peut lisser le style de l'auteur.", url: "https://www.deepl.com/write" },
  { name: "JASP", category: "Analyse statistique", description: "Logiciel libre d'analyse statistique.", use: "Réaliser des tests statistiques sans coder.", pros: "Interface simple, gratuit.", cons: "Moins flexible que R ou Python.", url: "https://jasp-stats.org" },
  { name: "Gamma", category: "Création de présentations", description: "Génération de présentations assistée par IA.", use: "Préparer rapidement une soutenance.", pros: "Mise en page automatique soignée.", cons: "Contenu à relire et sourcer.", url: "https://gamma.app" },
];
