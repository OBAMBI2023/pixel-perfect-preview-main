/**
 * Exercice « Évaluer la pertinence d'un article » : scénarios et articles annotés.
 *
 * TOUS LES ARTICLES SONT DES EXEMPLES FICTIFS écrits pour l'exercice : titres, auteurs, revues et
 * résumés sont inventés, et aucun n'a de DOI. L'interface affiche toujours la mention « Exemple fictif ».
 * Les extraits (`extraits[].texte`) doivent être recopiés mot pour mot du titre ou du résumé
 * (vérifié par src/test/pertinence.test.ts).
 */

export type Appreciation = "oui" | "partiel" | "non" | "insuffisant";
export type Pertinence = "tres" | "partiel" | "peu";
export type CritereId = "thematique" | "problematique" | "concepts" | "methode" | "contexte" | "actualite" | "fiabilite";

export type AnnotationCritere = { attendu: Appreciation; acceptables?: Appreciation[]; explication: string };

export type ArticleExemple = {
  id: string;
  scenario: string;
  titre: string;
  auteurs: string;
  annee: number;
  revue: string;
  resume: string;
  motsCles: string[];
  pertinence: Pertinence;
  explicationGlobale: string;
  criteres: Record<CritereId, AnnotationCritere>;
  /** Passages du titre ou du résumé qui justifient l'appréciation. */
  extraits: { texte: string; commentaire: string }[];
  /** Points à vérifier attendus (identifiants de POINTS_A_VERIFIER). */
  aVerifier: string[];
  /** Ce qui manque pour décider de façon fiable. */
  manquantes: string[];
  /** Mots qu'une justification argumentée a des chances de mobiliser (indice automatique). */
  indices: string[];
};

export type Scenario = { id: string; libelle: string; sujet: string; problematique: string; concepts: string[] };

export const SCENARIOS: Scenario[] = [
  {
    id: "logistique-ci",
    libelle: "Logistique (Côte d'Ivoire)",
    sujet: "Influence de la digitalisation des processus logistiques sur la performance des entreprises de distribution en Côte d'Ivoire",
    problematique:
      "Dans quelle mesure la digitalisation des processus logistiques (gestion des stocks, des commandes et des livraisons) améliore-t-elle la performance des entreprises de distribution ivoiriennes ?",
    concepts: ["digitalisation des processus logistiques", "performance (coûts, délais, ruptures de stock)", "entreprises de distribution", "Côte d'Ivoire"],
  },
  {
    id: "ia-memoire-sn",
    libelle: "IA et mémoire (Sénégal)",
    sujet: "Usage de l'intelligence artificielle générative par les étudiants de master pour la rédaction du mémoire au Sénégal",
    problematique:
      "Comment les étudiants de master au Sénégal utilisent-ils l'IA générative pour rédiger leur mémoire, et quels effets perçoivent-ils sur la qualité de leur travail ?",
    concepts: ["IA générative", "usages des étudiants", "rédaction du mémoire de master", "Sénégal"],
  },
];

export const CRITERES: { id: CritereId; titre: string; question: string }[] = [
  { id: "thematique", titre: "Correspondance thématique", question: "L'article traite-t-il du sujet ou d'une question proche ?" },
  { id: "problematique", titre: "Correspondance avec la problématique", question: "Contribue-t-il à répondre à la question de recherche ?" },
  { id: "concepts", titre: "Correspondance conceptuelle", question: "Étudie-t-il les concepts ou les variables importants ?" },
  { id: "methode", titre: "Pertinence méthodologique", question: "Sa méthode peut-elle éclairer ton travail ?" },
  { id: "contexte", titre: "Contexte de l'étude", question: "Le terrain géographique, institutionnel ou sectoriel est-il comparable ?" },
  { id: "actualite", titre: "Actualité et utilité scientifique", question: "L'année et la contribution de l'article sont-elles adaptées à ton besoin ?" },
  { id: "fiabilite", titre: "Fiabilité de la source", question: "Les auteurs, la publication et les informations bibliographiques peuvent-ils être vérifiés ?" },
];

export const APPRECIATIONS: { id: Appreciation; label: string }[] = [
  { id: "oui", label: "Oui" },
  { id: "partiel", label: "Partiellement" },
  { id: "non", label: "Non" },
  { id: "insuffisant", label: "Information insuffisante" },
];

export const PERTINENCES: { id: Pertinence; label: string }[] = [
  { id: "tres", label: "Très pertinent" },
  { id: "partiel", label: "Partiellement pertinent" },
  { id: "peu", label: "Peu pertinent" },
];

export const POINTS_A_VERIFIER: { id: string; label: string }[] = [
  { id: "texte-integral", label: "Lire le texte intégral (méthode détaillée, résultats complets)" },
  { id: "echantillon", label: "Vérifier la taille et la composition de l'échantillon" },
  { id: "auteurs", label: "Vérifier l'existence et le profil des auteurs" },
  { id: "revue", label: "Vérifier la revue : comité de lecture, éditeur, indexation" },
  { id: "doi", label: "Retrouver un DOI ou un lien vers la publication" },
  { id: "definitions", label: "Vérifier comment les concepts et les variables sont définis" },
];

const FIABILITE_REVUE: AnnotationCritere = {
  attendu: "partiel",
  acceptables: ["insuffisant"],
  explication:
    "Une revue et des auteurs sont indiqués, mais il n'y a ni DOI ni lien : avant de citer l'article, il faut vérifier que la revue existe, qu'elle pratique l'évaluation par les pairs et que les auteurs sont identifiables.",
};

export const ARTICLES: ArticleExemple[] = [
  /* ───────── Scénario 1 : logistique en Côte d'Ivoire ───────── */
  {
    id: "logi-abidjan",
    scenario: "logistique-ci",
    titre: "Digitalisation des processus logistiques et performance opérationnelle des entreprises de distribution : une enquête auprès de distributeurs d'Abidjan",
    auteurs: "K. A. Yao, M. Diabaté",
    annee: 2022,
    revue: "Revue ivoirienne de sciences de gestion",
    resume:
      "Cet article analyse l'effet de la digitalisation des processus logistiques sur la performance opérationnelle des entreprises de distribution. Une enquête par questionnaire a été menée auprès de 184 entreprises de distribution installées à Abidjan. La digitalisation est mesurée par l'usage d'un logiciel de gestion d'entrepôt, la traçabilité des commandes et la planification numérique des livraisons. La performance est mesurée par les délais de livraison, le taux de ruptures de stock et les coûts logistiques. Les résultats d'une régression multiple montrent que la traçabilité des commandes et la planification numérique des livraisons réduisent significativement les délais et les ruptures de stock. L'effet sur les coûts logistiques n'est pas significatif. Les auteurs soulignent que l'échantillon se limite à Abidjan.",
    motsCles: ["digitalisation", "logistique", "performance opérationnelle", "distribution", "Côte d'Ivoire"],
    pertinence: "tres",
    explicationGlobale:
      "L'article étudie exactement la relation entre digitalisation logistique et performance, dans le même secteur et le même pays. C'est une source centrale, à lire en entier.",
    criteres: {
      thematique: { attendu: "oui", explication: "Même thème : digitalisation logistique et performance des distributeurs." },
      problematique: { attendu: "oui", explication: "Il mesure directement l'effet de la digitalisation sur la performance, ce qui répond à la question de recherche." },
      concepts: { attendu: "oui", explication: "Les deux variables clés sont définies et mesurées : digitalisation (logiciel d'entrepôt, traçabilité, planification) et performance (délais, ruptures, coûts)." },
      methode: { attendu: "oui", explication: "Une enquête par questionnaire avec régression est transposable ; ses indicateurs peuvent inspirer ton propre questionnaire." },
      contexte: { attendu: "oui", acceptables: ["partiel"], explication: "Même pays et même secteur. Nuance : l'échantillon se limite à Abidjan, il faut être prudent pour généraliser au reste du pays." },
      actualite: { attendu: "oui", explication: "Publication récente (2022) qui apporte des résultats empiriques directement utiles." },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "184 entreprises de distribution installées à Abidjan", commentaire: "Même secteur et même pays que ton sujet." },
      { texte: "La performance est mesurée par les délais de livraison, le taux de ruptures de stock et les coûts logistiques", commentaire: "La variable « performance » est rendue mesurable." },
      { texte: "réduisent significativement les délais et les ruptures de stock", commentaire: "Résultat qui répond directement à la problématique." },
      { texte: "L'effet sur les coûts logistiques n'est pas significatif", commentaire: "Nuance à retenir : tous les effets ne sont pas confirmés." },
      { texte: "l'échantillon se limite à Abidjan", commentaire: "Limite déclarée par les auteurs." },
    ],
    aVerifier: ["texte-integral", "echantillon", "revue"],
    manquantes: [
      "Le détail du questionnaire et la façon dont les entreprises ont été choisies.",
      "Les résultats chiffrés complets (taille des effets, variables de contrôle).",
      "Le statut de la revue (évaluation par les pairs) et l'absence de DOI.",
    ],
    indices: ["abidjan", "distribution", "délais", "ruptures", "enquête", "questionnaire", "régression", "traçabilité", "coûts", "échantillon"],
  },
  {
    id: "pme-ghana",
    scenario: "logistique-ci",
    titre: "Adoption des technologies numériques par les PME manufacturières au Ghana : déterminants et freins",
    auteurs: "A. Mensah, R. Boateng",
    annee: 2019,
    revue: "Cahiers d'économie et de gestion d'Afrique de l'Ouest",
    resume:
      "Cette étude identifie les facteurs qui favorisent ou freinent l'adoption des technologies numériques dans les petites et moyennes entreprises manufacturières au Ghana. Trente entretiens semi-directifs ont été conduits avec des dirigeants de PME. Les principaux déterminants de l'adoption sont la formation des employés, le coût des équipements et la qualité de la connexion internet. L'étude ne mesure pas les effets de l'adoption sur la performance des entreprises. Elle recommande des politiques publiques d'accompagnement numérique des PME.",
    motsCles: ["technologies numériques", "adoption", "PME", "industrie manufacturière", "Ghana"],
    pertinence: "partiel",
    explicationGlobale:
      "L'article parle de numérique en entreprise, mais il étudie l'adoption (pourquoi on adopte) et non l'effet sur la performance, dans un autre secteur et un autre pays. Il peut nourrir la discussion sur les freins, pas répondre à la problématique.",
    criteres: {
      thematique: { attendu: "partiel", explication: "Thème voisin (numérique en entreprise) mais centré sur l'adoption, pas sur les processus logistiques." },
      problematique: { attendu: "non", acceptables: ["partiel"], explication: "Le résumé précise que l'étude ne mesure pas les effets sur la performance : elle ne répond pas à ta question." },
      concepts: { attendu: "partiel", explication: "La digitalisation est présente (technologies numériques), la performance est absente." },
      methode: { attendu: "partiel", explication: "Des entretiens qualitatifs aident à comprendre les freins, mais ne permettent pas de mesurer un effet." },
      contexte: { attendu: "partiel", explication: "Pays voisin d'Afrique de l'Ouest, mais secteur manufacturier et non distribution." },
      actualite: { attendu: "oui", acceptables: ["partiel"], explication: "2019 reste assez récent pour un sujet sur le numérique ; l'apport porte sur les freins à l'adoption." },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "petites et moyennes entreprises manufacturières au Ghana", commentaire: "Autre secteur (industrie) et autre pays." },
      { texte: "Trente entretiens semi-directifs", commentaire: "Méthode qualitative : utile pour comprendre, pas pour mesurer." },
      { texte: "L'étude ne mesure pas les effets de l'adoption sur la performance des entreprises", commentaire: "Le point décisif : la performance n'est pas étudiée." },
      { texte: "la formation des employés, le coût des équipements et la qualité de la connexion internet", commentaire: "Freins utilisables dans ta discussion ou comme variables de contrôle." },
    ],
    aVerifier: ["texte-integral", "revue", "definitions"],
    manquantes: [
      "Ce que recouvrent exactement les « technologies numériques » (logistique ou non).",
      "Le profil des dirigeants interrogés.",
      "Le statut de la revue et l'absence de DOI.",
    ],
    indices: ["adoption", "ghana", "manufacturières", "pme", "entretiens", "freins", "performance", "qualitative", "secteur"],
  },
  {
    id: "banque-ci",
    scenario: "logistique-ci",
    titre: "Digitalisation des services bancaires et inclusion financière en Côte d'Ivoire",
    auteurs: "S. Koné, F. Ouattara",
    annee: 2021,
    revue: "Revue d'économie financière africaine",
    resume:
      "Cet article étudie l'effet de la digitalisation des services bancaires, notamment le mobile money et la banque en ligne, sur l'inclusion financière des ménages en Côte d'Ivoire. À partir des données d'une enquête nationale auprès de 2 400 ménages, un modèle économétrique montre que l'usage du mobile money augmente la probabilité de détenir une épargne formelle. Les effets sont plus marqués en milieu urbain.",
    motsCles: ["digitalisation", "mobile money", "inclusion financière", "ménages", "Côte d'Ivoire"],
    pertinence: "peu",
    explicationGlobale:
      "Piège classique : le mot « digitalisation » et le pays sont les mêmes, mais l'objet est différent (services bancaires et ménages, pas logistique et entreprises). Une correspondance de mots-clés ne suffit pas à rendre un article pertinent.",
    criteres: {
      thematique: { attendu: "non", explication: "Le thème est la finance des ménages, pas la logistique des entreprises." },
      problematique: { attendu: "non", explication: "Aucun lien avec la performance des entreprises de distribution." },
      concepts: { attendu: "non", acceptables: ["partiel"], explication: "« Digitalisation » apparaît, mais appliquée aux services bancaires ; la performance logistique est absente." },
      methode: { attendu: "partiel", explication: "Un modèle économétrique sur données d'enquête est une méthode transposable, mais cela ne suffit pas à rendre l'article utile." },
      contexte: { attendu: "partiel", explication: "Même pays, mais autre secteur et autre population (ménages)." },
      actualite: { attendu: "oui", explication: "La date (2021) n'est pas en cause : c'est le thème qui écarte l'article." },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "digitalisation des services bancaires, notamment le mobile money et la banque en ligne", commentaire: "La digitalisation porte sur la banque, pas sur la logistique." },
      { texte: "inclusion financière des ménages", commentaire: "La population étudiée est celle des ménages, pas des entreprises." },
      { texte: "2 400 ménages", commentaire: "Échantillon solide, mais hors de ton sujet." },
    ],
    aVerifier: [],
    manquantes: ["Rien d'essentiel : le titre et le résumé suffisent ici pour écarter provisoirement l'article."],
    indices: ["bancaires", "banque", "mobile money", "inclusion", "ménages", "secteur", "entreprises", "mot-clé", "mots-clés"],
  },
  {
    id: "cadre-performance",
    scenario: "logistique-ci",
    titre: "Mesurer la performance logistique : proposition d'un cadre d'indicateurs",
    auteurs: "J. Martin",
    annee: 2005,
    revue: "Revue française de logistique",
    resume:
      "Cet article conceptuel propose un cadre pour mesurer la performance logistique des entreprises. À partir d'une revue de la littérature, l'auteur distingue quatre dimensions : les coûts, les délais, la fiabilité des livraisons et la flexibilité. Pour chaque dimension, des indicateurs sont définis et discutés. L'article ne contient pas d'étude empirique et ne traite pas des outils numériques.",
    motsCles: ["performance logistique", "indicateurs", "chaîne logistique", "mesure"],
    pertinence: "partiel",
    explicationGlobale:
      "Article ancien et sans terrain, mais utile pour définir et mesurer la variable « performance logistique ». Son ancienneté ne le rend pas inutile : il peut servir de référence conceptuelle.",
    criteres: {
      thematique: { attendu: "partiel", explication: "Il traite de la performance logistique, mais pas de la digitalisation." },
      problematique: { attendu: "partiel", explication: "Il ne répond pas à la question, mais aide à définir la performance, qui en est une variable centrale." },
      concepts: { attendu: "partiel", acceptables: ["oui"], explication: "Le concept de performance logistique est approfondi ; celui de digitalisation est absent." },
      methode: { attendu: "partiel", explication: "Pas d'étude empirique, mais des indicateurs réutilisables pour construire ta mesure de la performance." },
      contexte: { attendu: "non", acceptables: ["insuffisant"], explication: "Article conceptuel, sans terrain : il n'y a pas de contexte à comparer." },
      actualite: {
        attendu: "partiel",
        acceptables: ["oui"],
        explication: "2005, c'est ancien pour un sujet sur le numérique, mais un cadre conceptuel peut rester une référence utile. L'ancienneté seule ne justifie pas d'écarter un article.",
      },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "Cet article conceptuel", commentaire: "Pas de données de terrain : un apport théorique." },
      { texte: "quatre dimensions : les coûts, les délais, la fiabilité des livraisons et la flexibilité", commentaire: "Une définition opérationnelle de la performance, réutilisable." },
      { texte: "ne contient pas d'étude empirique et ne traite pas des outils numériques", commentaire: "Les limites de l'article pour ton sujet." },
    ],
    aVerifier: ["texte-integral", "revue", "definitions"],
    manquantes: ["Les indicateurs précis proposés pour chaque dimension.", "Si ce cadre a été repris ou critiqué par des travaux plus récents."],
    indices: ["indicateurs", "coûts", "délais", "conceptuel", "empirique", "ancien", "2005", "mesure", "définir", "définition"],
  },

  /* ───────── Scénario 2 : IA générative et mémoire au Sénégal ───────── */
  {
    id: "chatgpt-master-ao",
    scenario: "ia-memoire-sn",
    titre: "Usages déclarés de ChatGPT par les étudiants de master en sciences sociales : enquête dans trois universités d'Afrique de l'Ouest",
    auteurs: "A. Ndiaye, K. Sawadogo, M. Touré",
    annee: 2024,
    revue: "Revue africaine de pédagogie universitaire",
    resume:
      "Cette étude décrit comment les étudiants de master en sciences sociales utilisent ChatGPT pendant la rédaction de leur mémoire. Un questionnaire a été rempli par 412 étudiants de trois universités situées au Sénégal, au Burkina Faso et au Mali, puis 24 entretiens ont approfondi les réponses. Les usages les plus fréquents sont la reformulation, la recherche d'idées et la traduction. Les étudiants estiment gagner du temps, mais beaucoup déclarent ne pas vérifier les références proposées. Les résultats ne sont pas présentés séparément par pays.",
    motsCles: ["IA générative", "ChatGPT", "mémoire de master", "étudiants", "Afrique de l'Ouest"],
    pertinence: "tres",
    explicationGlobale:
      "Même population (étudiants de master), même objet (rédaction du mémoire avec l'IA générative) et une université sénégalaise dans l'échantillon. Source centrale, avec une limite : pas de résultats propres au Sénégal.",
    criteres: {
      thematique: { attendu: "oui", explication: "Usage de l'IA générative par des étudiants de master pour leur mémoire : c'est ton thème." },
      problematique: { attendu: "oui", acceptables: ["partiel"], explication: "Il décrit les usages et les effets perçus (gain de temps), mais peu la qualité du travail." },
      concepts: { attendu: "oui", explication: "IA générative, usages, mémoire de master : les concepts clés sont présents." },
      methode: { attendu: "oui", explication: "Méthode mixte (questionnaire puis entretiens) directement transposable à ton enquête." },
      contexte: { attendu: "partiel", acceptables: ["oui"], explication: "Le Sénégal fait partie du terrain, mais les résultats ne sont pas présentés par pays." },
      actualite: { attendu: "oui", explication: "Publication récente (2024), adaptée à un sujet sur l'IA générative." },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "412 étudiants de trois universités situées au Sénégal, au Burkina Faso et au Mali", commentaire: "Le Sénégal est inclus, avec deux pays voisins." },
      { texte: "Les usages les plus fréquents sont la reformulation, la recherche d'idées et la traduction", commentaire: "Des catégories d'usages réutilisables." },
      { texte: "beaucoup déclarent ne pas vérifier les références proposées", commentaire: "Un effet sur la qualité du travail, utile pour ta problématique." },
      { texte: "Les résultats ne sont pas présentés séparément par pays", commentaire: "Limite pour un sujet centré sur le Sénégal." },
    ],
    aVerifier: ["texte-integral", "echantillon", "revue"],
    manquantes: ["La part des étudiants sénégalais dans l'échantillon.", "Les questions posées et la façon dont les « effets perçus » sont mesurés."],
    indices: ["chatgpt", "master", "mémoire", "sénégal", "questionnaire", "entretiens", "usages", "pays", "références", "mixte"],
  },
  {
    id: "ia-evaluation-france",
    scenario: "ia-memoire-sn",
    titre: "L'intelligence artificielle générative et l'évaluation des apprentissages à l'université : le point de vue des enseignants",
    auteurs: "C. Dubois, L. Moreau",
    annee: 2023,
    revue: "Revue de recherche en éducation",
    resume:
      "Cet article analyse les perceptions des enseignants universitaires face à l'arrivée de l'IA générative dans les travaux d'étudiants. Un questionnaire a été diffusé auprès de 260 enseignants de quatre universités françaises. Les enseignants craignent surtout le plagiat et la perte de compétences rédactionnelles, et beaucoup ont modifié leurs modalités d'évaluation. Le point de vue des étudiants n'est pas étudié.",
    motsCles: ["IA générative", "évaluation", "enseignants", "université", "France"],
    pertinence: "partiel",
    explicationGlobale:
      "Même technologie et même cadre universitaire, mais le point de vue étudié est celui des enseignants, en France. Utile pour la discussion (craintes, évaluation), pas pour décrire les usages des étudiants sénégalais.",
    criteres: {
      thematique: { attendu: "partiel", explication: "IA générative à l'université, mais sous l'angle de l'évaluation par les enseignants." },
      problematique: { attendu: "partiel", acceptables: ["non"], explication: "Il éclaire les effets craints sur la rédaction, sans décrire les usages des étudiants." },
      concepts: { attendu: "partiel", explication: "L'IA générative est présente ; les usages étudiants et le mémoire ne le sont pas." },
      methode: { attendu: "partiel", explication: "Un questionnaire est transposable, mais auprès d'une autre population." },
      contexte: { attendu: "non", explication: "France et enseignants : terrain et population différents des tiens." },
      actualite: { attendu: "oui", explication: "Publication récente (2023)." },
      fiabilite: FIABILITE_REVUE,
    },
    extraits: [
      { texte: "perceptions des enseignants universitaires", commentaire: "La population étudiée n'est pas celle de ton sujet." },
      { texte: "260 enseignants de quatre universités françaises", commentaire: "Autre pays, autre population." },
      { texte: "le plagiat et la perte de compétences rédactionnelles", commentaire: "Des effets craints, utiles pour ta discussion." },
      { texte: "Le point de vue des étudiants n'est pas étudié", commentaire: "La limite décisive pour ton sujet." },
    ],
    aVerifier: ["texte-integral", "revue"],
    manquantes: ["Les questions posées aux enseignants.", "Si des résultats portent sur les mémoires de master en particulier."],
    indices: ["enseignants", "france", "étudiants", "évaluation", "plagiat", "questionnaire", "perceptions", "discussion"],
  },
  {
    id: "systemes-experts",
    scenario: "ia-memoire-sn",
    titre: "Les systèmes experts d'aide au diagnostic médical : revue des approches à base de règles",
    auteurs: "P. Lefèvre",
    annee: 1998,
    revue: "Actes d'un colloque d'informatique médicale",
    resume:
      "Ce texte passe en revue les systèmes experts conçus pour aider les médecins à poser un diagnostic. Ces systèmes reposent sur des règles écrites par des spécialistes. L'auteur compare leurs performances et souligne la difficulté de maintenir les bases de règles à jour.",
    motsCles: ["systèmes experts", "diagnostic médical", "règles", "intelligence artificielle"],
    pertinence: "peu",
    explicationGlobale:
      "L'article porte sur une autre forme d'IA (systèmes à base de règles), un autre domaine (médecine) et une autre population. Le fait qu'il parle d'« intelligence artificielle » ne suffit pas.",
    criteres: {
      thematique: { attendu: "non", explication: "Diagnostic médical, pas rédaction universitaire." },
      problematique: { attendu: "non", explication: "Aucun lien avec les usages des étudiants." },
      concepts: { attendu: "non", acceptables: ["partiel"], explication: "Les systèmes experts sont une IA symbolique, très différente de l'IA générative." },
      methode: { attendu: "non", acceptables: ["partiel"], explication: "Une revue d'approches techniques n'éclaire pas une enquête auprès d'étudiants." },
      contexte: { attendu: "non", explication: "Milieu médical, sans terrain comparable." },
      actualite: {
        attendu: "non",
        acceptables: ["partiel"],
        explication: "L'IA générative n'existait pas en 1998. Ce n'est pas l'ancienneté en soi qui écarte l'article, mais le fait qu'il ne peut pas traiter de ton objet.",
      },
      fiabilite: {
        attendu: "insuffisant",
        acceptables: ["partiel", "non"],
        explication: "Des « actes de colloque » sans nom précis, sans DOI ni lien : la source est très difficile à vérifier.",
      },
    },
    extraits: [
      { texte: "systèmes experts conçus pour aider les médecins à poser un diagnostic", commentaire: "Autre domaine et autre forme d'IA." },
      { texte: "reposent sur des règles écrites par des spécialistes", commentaire: "IA à base de règles, et non IA générative." },
    ],
    aVerifier: [],
    manquantes: ["Rien d'essentiel pour ce sujet : l'article peut être écarté sur la base du titre et du résumé."],
    indices: ["systèmes experts", "médical", "médecins", "règles", "1998", "générative", "diagnostic", "domaine"],
  },
];

export const articlePertinence = (id: string) => ARTICLES.find((a) => a.id === id);
export const scenarioPertinence = (id: string) => SCENARIOS.find((s) => s.id === id);
