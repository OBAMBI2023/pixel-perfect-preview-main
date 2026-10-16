// QCM du cours « Comprendre l'IA », tirés du support « L'intelligence artificielle et la recherche »
// (Bamba Mahama, octobre 2026). Chaque question a un niveau et une catégorie de cours.
// `reponse` = index (0 à 3) de la bonne option dans `options`.

export type Niveau = "debutant" | "intermediaire" | "avance";

export type Categorie = {
  id: string;
  cours: string; // slug du cours, pour pouvoir ajouter d'autres cours plus tard
  titre: string;
  description: string;
  chapitres: string;
};

export type QuestionQCM = {
  id: string;
  cours: string;
  categorie: string; // id d'une Categorie
  niveau: Niveau;
  question: string;
  options: string[];
  reponse: number;
  explication: string;
  chapitre: string;
};

export const NIVEAUX: { id: Niveau; label: string; description: string; couleur: string }[] = [
  { id: "debutant", label: "Débutant", description: "Définitions et notions clés à connaître", couleur: "green" },
  { id: "intermediaire", label: "Intermédiaire", description: "Comprendre et distinguer les notions", couleur: "orange" },
  { id: "avance", label: "Avancé", description: "Appliquer à des cas concrets et analyser", couleur: "red" },
];

export const CATEGORIES: Categorie[] = [
  { id: "fondements", cours: "comprendre-ia", titre: "Fondements de l'IA", description: "Définition, histoire, composantes et branches de l'IA", chapitres: "2" },
  { id: "ia-generative", cours: "comprendre-ia", titre: "IA générative", description: "Fonctionnement, outils et différence avec l'IA", chapitres: "3" },
  { id: "prompts", cours: "comprendre-ia", titre: "Ingénierie des prompts", description: "Les six éléments d'un prompt efficace et les bonnes pratiques", chapitres: "4" },
  { id: "ethique", cours: "comprendre-ia", titre: "Limites, risques et éthique", description: "Hallucinations, biais, confidentialité, déclaration de l'usage de l'IA", chapitres: "5" },
  { id: "recherche-documentaire", cours: "comprendre-ia", titre: "Recherche documentaire", description: "Types de sources, outils, opérateurs booléens et stratégie", chapitres: "6" },
  { id: "selection-evaluation", cours: "comprendre-ia", titre: "Sélection et évaluation des sources", description: "Critères d'inclusion, lecture d'article, évaluation par les pairs, DOI", chapitres: "7–8" },
  { id: "organisation", cours: "comprendre-ia", titre: "Organisation et démarche intégrée", description: "Gestion bibliographique, matrice de lecture, IA et recherche", chapitres: "9–10" },
];

export const questionsComprendreIA: QuestionQCM[] = [
  {
    "id": "f1",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "Qu'est-ce que l'intelligence artificielle ?",
    "options": [
      "Un domaine de l'informatique qui conçoit des systèmes capables de réaliser des tâches exigeant habituellement des capacités humaines",
      "Un programme qui exécute uniquement des instructions prédéfinies",
      "Un réseau Internet réservé aux chercheurs",
      "Un logiciel de traitement de texte avancé"
    ],
    "reponse": 0,
    "explication": "L'IA conçoit des systèmes capables d'apprendre, raisonner, reconnaître des images, comprendre le langage, résoudre des problèmes et décider (Russell et Norvig, 2021).",
    "chapitre": "2.1"
  },
  {
    "id": "f2",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "En quelle année Turing publie-t-il son article sur les machines et l'intelligence ?",
    "options": [
      "1936",
      "1956",
      "1950",
      "1970"
    ],
    "reponse": 2,
    "explication": "Turing formule la question des machines « pensantes » en 1950.",
    "chapitre": "2.2"
  },
  {
    "id": "f6",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "Quelles sont les quatre composantes d'un système d'IA ?",
    "options": [
      "Les données, les algorithmes, le modèle, le résultat",
      "Le clavier, l'écran, le processeur, la mémoire",
      "Le rôle, le contexte, l'objectif, le format",
      "L'apprentissage, l'entraînement, l'instruction, la génération"
    ],
    "reponse": 0,
    "explication": "Un système d'IA repose sur les données, les algorithmes, le modèle entraîné et le résultat produit.",
    "chapitre": "2.3"
  },
  {
    "id": "f9",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "Lequel de ces exemples est un usage quotidien de l'IA ?",
    "options": [
      "Imprimer un document",
      "Déverrouiller son téléphone par reconnaissance faciale",
      "Envoyer un courriel déjà rédigé",
      "Enregistrer un fichier sur une clé USB"
    ],
    "reponse": 1,
    "explication": "Reconnaissance faciale, navigation selon la circulation, recommandations de contenus et assistants conversationnels sont des usages quotidiens de l'IA.",
    "chapitre": "2.5"
  },
  {
    "id": "f3",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "intermediaire",
    "question": "Où apparaît le terme « intelligence artificielle » ?",
    "options": [
      "Dans l'article sur l'architecture Transformer (2017)",
      "Lors du lancement des assistants conversationnels (2022)",
      "Dans l'article de Turing (1950)",
      "Dans la proposition de l'atelier de Dartmouth (1955–1956)"
    ],
    "reponse": 3,
    "explication": "Le terme apparaît dans la proposition rédigée par McCarthy et ses collègues pour l'atelier de Dartmouth, tenu à l'été 1956.",
    "chapitre": "2.2"
  },
  {
    "id": "f4",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "intermediaire",
    "question": "Comment appelle-t-on les périodes de ralentissement des financements et des attentes (années 1970–1990) ?",
    "options": [
      "Les crises du calcul",
      "Les « hivers de l'IA »",
      "Les années Transformer",
      "L'ère de l'apprentissage profond"
    ],
    "reponse": 1,
    "explication": "Ces phases de désillusion sont appelées les « hivers de l'IA ».",
    "chapitre": "2.2"
  },
  {
    "id": "f5",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "intermediaire",
    "question": "Quelle architecture, introduite en 2017, sous-tend les modèles de langage actuels ?",
    "options": [
      "Le perceptron",
      "Le système expert",
      "Le Transformer",
      "L'arbre de décision"
    ],
    "reponse": 2,
    "explication": "L'architecture Transformer (Vaswani et al., 2017) est à la base des modèles de langage actuels.",
    "chapitre": "2.2"
  },
  {
    "id": "f7",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "intermediaire",
    "question": "Quelle branche de l'IA utilise des réseaux de neurones artificiels à plusieurs couches ?",
    "options": [
      "La vision par ordinateur",
      "Le traitement du langage naturel",
      "Les systèmes experts",
      "L'apprentissage profond (deep learning)"
    ],
    "reponse": 3,
    "explication": "L'apprentissage profond utilise des réseaux de neurones à plusieurs couches pour traiter des problèmes complexes.",
    "chapitre": "2.4"
  },
  {
    "id": "f8",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "avance",
    "question": "Quel est l'emboîtement correct des domaines de l'IA ?",
    "options": [
      "IA générative ⊃ apprentissage profond ⊃ IA",
      "IA ⊃ apprentissage automatique ⊃ apprentissage profond ⊃ IA générative",
      "Apprentissage profond ⊃ IA ⊃ apprentissage automatique",
      "Ce sont des domaines totalement séparés"
    ],
    "reponse": 1,
    "explication": "L'IA générative s'appuie sur l'apprentissage profond, lui-même une forme d'apprentissage automatique, qui fait partie de l'IA.",
    "chapitre": "2.4"
  },
  {
    "id": "f10",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "Qu'est-ce que l'apprentissage automatique (machine learning) ?",
    "options": [
      "Un programme qui suit des règles écrites à la main pour chaque situation",
      "Une branche de l'IA dans laquelle la machine apprend à partir de données et d'exemples",
      "Un robot capable de se déplacer seul",
      "Une base de données d'articles scientifiques"
    ],
    "reponse": 1,
    "explication": "En apprentissage automatique, la machine apprend à partir de données et d'exemples, sans être programmée explicitement pour chaque situation.",
    "chapitre": "2.4"
  },
  {
    "id": "f11",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "debutant",
    "question": "Lequel de ces outils relève de l'IA générative ?",
    "options": [
      "Un tableur qui calcule une moyenne",
      "Un moteur de recherche qui trouve les mots-clés exacts",
      "Midjourney, qui crée une image à partir d'une description",
      "Un correcteur qui compare les mots à un dictionnaire"
    ],
    "reponse": 2,
    "explication": "L'IA générative produit de nouveaux contenus (textes, images, sons, vidéos, code) à partir d'instructions : c'est le cas de Midjourney, DALL·E, ChatGPT, Gemini ou Claude.",
    "chapitre": "2.4"
  },
  {
    "id": "f12",
    "cours": "comprendre-ia",
    "categorie": "fondements",
    "niveau": "intermediaire",
    "question": "Laquelle de ces affirmations est exacte ?",
    "options": [
      "Tout système d'IA utilise l'apprentissage profond",
      "L'IA générative englobe l'apprentissage automatique",
      "L'apprentissage profond est un sous-domaine de l'apprentissage automatique",
      "L'apprentissage automatique ne fait pas partie de l'IA"
    ],
    "reponse": 2,
    "explication": "Chaque niveau est inclus dans celui qui l'englobe : l'apprentissage profond fait partie de l'apprentissage automatique, qui fait partie de l'IA. Mais toute IA n'est pas de l'apprentissage profond.",
    "chapitre": "2.4"
  },
  {
    "id": "g1",
    "cours": "comprendre-ia",
    "categorie": "ia-generative",
    "niveau": "debutant",
    "question": "Quelle est la fonction principale de l'IA générative ?",
    "options": [
      "Classer des données",
      "Détecter des fraudes",
      "Stocker des documents",
      "Créer de nouveaux contenus"
    ],
    "reponse": 3,
    "explication": "L'IA « classique » classe, reconnaît ou analyse ; l'IA générative produit des textes, images, vidéos, sons et du code.",
    "chapitre": "3.1 / 3.5"
  },
  {
    "id": "g4",
    "cours": "comprendre-ia",
    "categorie": "ia-generative",
    "niveau": "debutant",
    "question": "Quel outil sert principalement à créer des images à partir de descriptions textuelles ?",
    "options": [
      "GitHub Copilot",
      "Google Gemini",
      "Crossref",
      "Midjourney"
    ],
    "reponse": 3,
    "explication": "Midjourney crée des images ; GitHub Copilot génère du code ; Gemini et ChatGPT sont des assistants polyvalents.",
    "chapitre": "3.3"
  },
  {
    "id": "g2",
    "cours": "comprendre-ia",
    "categorie": "ia-generative",
    "niveau": "intermediaire",
    "question": "Quel est l'ordre des quatre étapes de fonctionnement d'une IA générative ?",
    "options": [
      "Apprentissage → Entraînement → Instruction → Génération",
      "Instruction → Apprentissage → Génération → Entraînement",
      "Génération → Instruction → Entraînement → Apprentissage",
      "Entraînement → Génération → Apprentissage → Instruction"
    ],
    "reponse": 0,
    "explication": "Le modèle est exposé aux données (apprentissage), identifie des régularités (entraînement), reçoit un prompt (instruction) puis produit un contenu (génération).",
    "chapitre": "3.2"
  },
  {
    "id": "g5",
    "cours": "comprendre-ia",
    "categorie": "ia-generative",
    "niveau": "intermediaire",
    "question": "Lequel de ces exemples relève de l'IA générative plutôt que de l'IA « classique » ?",
    "options": [
      "Détecter une transaction bancaire suspecte",
      "Rédiger des propositions de problématique à partir d'un prompt",
      "Classer des courriels en spam",
      "Prédire la météo de demain"
    ],
    "reponse": 1,
    "explication": "Créer un contenu à partir d'un prompt est le propre de l'IA générative ; détecter, classer ou prédire relève de l'IA au sens large.",
    "chapitre": "3.5"
  },
  {
    "id": "g3",
    "cours": "comprendre-ia",
    "categorie": "ia-generative",
    "niveau": "avance",
    "question": "Sur quoi repose la génération de texte d'un grand modèle de langage ?",
    "options": [
      "Sur la consultation d'une encyclopédie vérifiée",
      "Sur la copie de textes existants",
      "Sur un mécanisme statistique qui estime les suites de mots les plus probables",
      "Sur un raisonnement humain intégré au modèle"
    ],
    "reponse": 2,
    "explication": "Le modèle estime les suites de mots les plus probables : le texte est fluide, mais un énoncé plausible n'est pas nécessairement vrai.",
    "chapitre": "3.2"
  },
  {
    "id": "g6",
    "cours": "comprendre-ia",
    "categorie": "prompts",
    "niveau": "debutant",
    "question": "Quels sont les six éléments d'un prompt efficace ?",
    "options": [
      "Rôle, contexte, objectif, consignes, format, critères de qualité",
      "Titre, résumé, mots-clés, introduction, méthode, conclusion",
      "Qui, quoi, où, quand, comment, pourquoi",
      "Données, algorithme, modèle, résultat, vérification, citation"
    ],
    "reponse": 0,
    "explication": "Le tableau 8 du cours détaille ces six éléments avec un exemple pour chacun.",
    "chapitre": "4.2"
  },
  {
    "id": "g7",
    "cours": "comprendre-ia",
    "categorie": "prompts",
    "niveau": "intermediaire",
    "question": "« Agis comme un chercheur spécialisé en sociologie. » correspond à quel élément du prompt ?",
    "options": [
      "Le contexte",
      "Le format",
      "Le rôle",
      "L'objectif"
    ],
    "reponse": 2,
    "explication": "Le rôle précise l'expertise que l'IA doit mobiliser.",
    "chapitre": "4.2"
  },
  {
    "id": "g9",
    "cours": "comprendre-ia",
    "categorie": "prompts",
    "niveau": "intermediaire",
    "question": "Laquelle de ces affirmations sur les bonnes pratiques de prompt est correcte ?",
    "options": [
      "On procède par itérations : analyser la réponse, puis préciser ou reformuler",
      "Plus un prompt est long, meilleur il est",
      "Il faut obtenir la bonne réponse dès le premier essai",
      "On peut y inclure des données confidentielles si l'outil est connu"
    ],
    "reponse": 0,
    "explication": "Un bon prompt se juge à la pertinence des informations, pas à sa longueur ; il s'améliore par itérations et ne contient jamais de données confidentielles.",
    "chapitre": "4.4"
  },
  {
    "id": "g8",
    "cours": "comprendre-ia",
    "categorie": "prompts",
    "niveau": "avance",
    "question": "« Signale les limites, distingue les faits des hypothèses et n'invente aucune référence. » correspond à :",
    "options": [
      "Les consignes",
      "Le format",
      "Les critères de qualité",
      "Le contexte"
    ],
    "reponse": 2,
    "explication": "Les critères de qualité fixent les exigences de rigueur de la réponse.",
    "chapitre": "4.2"
  },
  {
    "id": "a3",
    "cours": "comprendre-ia",
    "categorie": "prompts",
    "niveau": "avance",
    "question": "Quelle version améliore le mieux le prompt « Parle-moi de l'intelligence artificielle dans l'éducation » ?",
    "options": [
      "« Parle-moi beaucoup plus longuement de l'IA dans l'éducation. »",
      "« Agis comme un spécialiste en sciences de l'éducation. Analyse les effets de l'IA générative sur les pratiques pédagogiques dans l'enseignement supérieur en Afrique de l'Ouest. Présente opportunités, limites et enjeux éthiques en trois parties, en langage académique. »",
      "« Donne-moi 50 références sur l'IA dans l'éducation. »",
      "« IA éducation avantages inconvénients »"
    ],
    "reponse": 1,
    "explication": "La version améliorée précise le rôle, le sujet, le contexte géographique, l'objectif et la structure attendue.",
    "chapitre": "4.3"
  },
  {
    "id": "l1",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "debutant",
    "question": "Qu'appelle-t-on une « hallucination » d'une IA ?",
    "options": [
      "Une panne du serveur",
      "Une information ou une référence inventée présentée comme crédible",
      "Une image générée de mauvaise qualité",
      "Une réponse trop longue"
    ],
    "reponse": 1,
    "explication": "Un modèle génératif peut produire des informations fausses ou des références d'apparence crédible mais inexistantes (Ji et al., 2023).",
    "chapitre": "5.1"
  },
  {
    "id": "l2",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "debutant",
    "question": "Une IA vous propose une référence scientifique. Que faire ?",
    "options": [
      "La citer directement, l'IA est fiable",
      "Demander à l'IA si elle est sûre et la citer si elle confirme",
      "La remplacer par la réponse de l'IA",
      "La retrouver et la vérifier dans une base documentaire ou chez l'éditeur"
    ],
    "reponse": 3,
    "explication": "Toute référence suggérée doit être retrouvée et vérifiée à la source (Crossref, éditeur, base d'origine).",
    "chapitre": "5.1 / 5.4"
  },
  {
    "id": "l8",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "debutant",
    "question": "Quel est le principe directeur du cours ?",
    "options": [
      "L'IA décide, le chercheur exécute",
      "L'IA remplace la recherche documentaire",
      "L'IA propose, le chercheur vérifie et décide",
      "Le chercheur doit éviter toute utilisation de l'IA"
    ],
    "reponse": 2,
    "explication": "L'IA facilite le travail scientifique mais ne remplace ni la réflexion, ni la méthode, ni la responsabilité du chercheur.",
    "chapitre": "1.1 / 5.4 / 12"
  },
  {
    "id": "l3",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "intermediaire",
    "question": "Quelle mesure de précaution répond au risque de biais ?",
    "options": [
      "Ne pas saisir de données personnelles",
      "Croiser plusieurs sources et examiner les réponses de façon critique",
      "Utiliser un prompt plus court",
      "Changer d'outil d'IA"
    ],
    "reponse": 1,
    "explication": "Les réponses peuvent reproduire les préjugés des données d'entraînement : il faut croiser les sources et garder un regard critique.",
    "chapitre": "5.1 / tableau 9"
  },
  {
    "id": "l4",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "intermediaire",
    "question": "Une réponse d'IA rédigée de façon fluide et convaincante est-elle forcément valide ?",
    "options": [
      "Oui, la fluidité prouve la qualité",
      "Oui, si elle cite des auteurs",
      "Oui, si l'outil est payant",
      "Non, la fluidité du texte ne garantit pas la validité de son contenu"
    ],
    "reponse": 3,
    "explication": "Une réponse convaincante n'est pas nécessairement pertinente sur le plan scientifique.",
    "chapitre": "5.2"
  },
  {
    "id": "l5",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "avance",
    "question": "Une IA peut-elle être déclarée co-auteur d'un article scientifique ?",
    "options": [
      "Oui, si elle a rédigé plus de la moitié du texte",
      "Oui, avec l'accord de la revue",
      "Non : le chercheur reste seul responsable, et on déclare l'usage de l'IA de façon transparente",
      "Non, et il ne faut surtout pas mentionner son usage"
    ],
    "reponse": 2,
    "explication": "Une IA ne peut assumer la responsabilité d'un contenu ; le COPE (2023) recommande de ne pas lui attribuer le statut d'auteur et de déclarer son usage.",
    "chapitre": "5.3"
  },
  {
    "id": "l6",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "avance",
    "question": "Que doit préciser une déclaration d'usage de l'IA dans un travail académique ?",
    "options": [
      "L'outil, sa version ou la date d'utilisation, la tâche concernée et le contrôle exercé",
      "Seulement le nom de l'outil",
      "Le prix de l'abonnement",
      "Le nombre de prompts envoyés uniquement"
    ],
    "reponse": 0,
    "explication": "La déclaration précise l'outil, la version ou la date, la tâche réalisée et le contrôle exercé par l'auteur.",
    "chapitre": "5.4"
  },
  {
    "id": "l7",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "avance",
    "question": "Peut-on citer une réponse d'IA comme source scientifique ?",
    "options": [
      "Non, il faut consulter et citer directement les publications qu'elle évoque",
      "Oui, comme n'importe quel article",
      "Oui, si la réponse contient des chiffres",
      "Oui, en style APA uniquement"
    ],
    "reponse": 0,
    "explication": "Une réponse d'IA n'est jamais une source scientifique : les publications évoquées doivent être consultées directement.",
    "chapitre": "5.4"
  },
  {
    "id": "a5",
    "cours": "comprendre-ia",
    "categorie": "ethique",
    "niveau": "avance",
    "question": "Selon le style APA, comment mentionner l'usage d'un outil d'IA générative ?",
    "options": [
      "Le citer comme co-auteur",
      "Le citer comme un logiciel (développeur, version, adresse) et décrire le prompt utilisé dans le texte",
      "Citer sa réponse comme un article scientifique",
      "Ne rien mentionner si le texte a été relu"
    ],
    "reponse": 1,
    "explication": "L'APA recommande de citer l'outil comme un logiciel et de décrire dans le texte le prompt utilisé.",
    "chapitre": "5.4"
  },
  {
    "id": "r5",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "debutant",
    "question": "Quel opérateur booléen regroupe des synonymes et élargit la recherche ?",
    "options": [
      "OR",
      "AND",
      "NOT",
      "Les guillemets"
    ],
    "reponse": 0,
    "explication": "OR élargit en regroupant des synonymes ; AND associe des concepts et réduit les résultats ; NOT exclut un terme.",
    "chapitre": "6.4"
  },
  {
    "id": "r6",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "debutant",
    "question": "Que permettent les guillemets dans une équation de recherche ?",
    "options": [
      "Exclure un terme",
      "Élargir aux synonymes",
      "Rechercher une expression exacte",
      "Trier par date"
    ],
    "reponse": 2,
    "explication": "Les guillemets recherchent une expression exacte, par exemple \"Higher Education\".",
    "chapitre": "6.4"
  },
  {
    "id": "r1",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "intermediaire",
    "question": "Quelle est la différence entre une source primaire et une source secondaire ?",
    "options": [
      "La primaire est plus ancienne que la secondaire",
      "La primaire est gratuite ; la secondaire est payante",
      "La primaire est en français ; la secondaire en anglais",
      "La primaire présente des données originales ; la secondaire analyse ou synthétise des travaux existants"
    ],
    "reponse": 3,
    "explication": "Une source primaire présente des données ou résultats originaux ; une source secondaire analyse, synthétise ou discute des travaux existants.",
    "chapitre": "6.2"
  },
  {
    "id": "r2",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "intermediaire",
    "question": "Quel type de document offre une synthèse structurée de plusieurs études ?",
    "options": [
      "Le mémoire universitaire",
      "La revue systématique",
      "Le rapport institutionnel",
      "Les actes de conférence"
    ],
    "reponse": 1,
    "explication": "La revue systématique synthétise de façon structurée plusieurs études et donne l'état des connaissances.",
    "chapitre": "6.2"
  },
  {
    "id": "r3",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "intermediaire",
    "question": "Quel outil sert principalement à vérifier les métadonnées et les DOI ?",
    "options": [
      "PubMed",
      "CORE",
      "Midjourney",
      "Crossref"
    ],
    "reponse": 3,
    "explication": "Crossref permet de vérifier les métadonnées et les DOI ; PubMed couvre le biomédical, CORE l'accès ouvert.",
    "chapitre": "6.3"
  },
  {
    "id": "r8",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "intermediaire",
    "question": "Quel est l'ordre des quatre étapes d'une stratégie de recherche ?",
    "options": [
      "Filtrer → combiner → enregistrer → définir les concepts",
      "Définir concepts et mots-clés → combiner avec les opérateurs → affiner avec les filtres → enregistrer les références",
      "Enregistrer → filtrer → définir → combiner",
      "Combiner → définir → enregistrer → filtrer"
    ],
    "reponse": 1,
    "explication": "Concepts et mots-clés, opérateurs booléens, filtres, puis enregistrement des références dès leur découverte.",
    "chapitre": "6.4"
  },
  {
    "id": "r4",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "avance",
    "question": "Un document présent dans Google Scholar a-t-il forcément été évalué par les pairs ?",
    "options": [
      "Oui, Google Scholar n'indexe que des articles évalués",
      "Non, un moteur académique indexe des documents de nature variée",
      "Oui, s'il a un résumé",
      "Oui, s'il est en anglais"
    ],
    "reponse": 1,
    "explication": "La présence dans un moteur académique n'est pas un label de qualité.",
    "chapitre": "6.3"
  },
  {
    "id": "r7",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "avance",
    "question": "Laquelle de ces équations est correctement construite pour le sujet « IA dans l'enseignement supérieur » ?",
    "options": [
      "\"Artificial Intelligence\" NOT \"Higher Education\"",
      "Artificial AND OR Intelligence Education",
      "(\"Artificial Intelligence\" OR \"Generative AI\") AND (\"Higher Education\" OR University)",
      "(\"Artificial Intelligence\" AND \"Generative AI\") OR NOT University"
    ],
    "reponse": 2,
    "explication": "OR regroupe les synonymes à l'intérieur de chaque concept, et AND associe les deux concepts.",
    "chapitre": "6.4"
  },
  {
    "id": "r9",
    "cours": "comprendre-ia",
    "categorie": "recherche-documentaire",
    "niveau": "avance",
    "question": "Quel outil d'IA permet de voir si un article est cité en soutien ou en contraste ?",
    "options": [
      "NotebookLM",
      "Elicit",
      "Zotero",
      "Scite"
    ],
    "reponse": 3,
    "explication": "Scite montre comment un article est cité (soutien ou contraste) ; les citations s'interprètent dans leur contexte.",
    "chapitre": "6.6"
  },
  {
    "id": "s3",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "debutant",
    "question": "Dans la lecture progressive d'un article, quel élément donne l'objectif, la méthode et les principaux résultats ?",
    "options": [
      "Le titre",
      "Les mots-clés",
      "La conclusion",
      "Le résumé"
    ],
    "reponse": 3,
    "explication": "Le résumé condense l'objectif, la méthode et les résultats ; il vient juste après le titre dans la lecture progressive.",
    "chapitre": "7.3"
  },
  {
    "id": "s4",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "debutant",
    "question": "Lequel de ces éléments fait partie des six questions d'évaluation d'une publication ?",
    "options": [
      "Combien de pages comporte le document ?",
      "Le document est-il gratuit ?",
      "Qui est l'auteur ?",
      "Le titre est-il accrocheur ?"
    ],
    "reponse": 2,
    "explication": "Les six questions : qui est l'auteur, où est-ce publié, quand, comment la recherche a été menée, les résultats sont-ils justifiés, le document est-il pertinent.",
    "chapitre": "8.1"
  },
  {
    "id": "s7",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "debutant",
    "question": "Qu'est-ce qu'un DOI ?",
    "options": [
      "Un logiciel de gestion bibliographique",
      "Un opérateur booléen",
      "Un identifiant pérenne attribué à une publication ou ressource numérique",
      "Un type de revue scientifique"
    ],
    "reponse": 2,
    "explication": "Le DOI (Digital Object Identifier) prend la forme https://doi.org/10.xxxx/xxxxx.",
    "chapitre": "8.4"
  },
  {
    "id": "s1",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "intermediaire",
    "question": "Pourquoi établir des critères d'inclusion et d'exclusion avant de sélectionner des sources ?",
    "options": [
      "Pour garantir la transparence et la reproductibilité de la démarche",
      "Pour lire moins d'articles",
      "Pour exclure tous les documents anciens",
      "Pour ne garder que les sources en français"
    ],
    "reponse": 0,
    "explication": "Des critères explicites garantissent la transparence et la reproductibilité (Page et al., 2021).",
    "chapitre": "7.2"
  },
  {
    "id": "s2",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "intermediaire",
    "question": "Faut-il exclure automatiquement un document ancien ?",
    "options": [
      "Non, certains travaux fondateurs restent indispensables",
      "Oui, seules les publications récentes comptent",
      "Oui, s'il a plus de 5 ans",
      "Non, il faut toujours privilégier les plus anciens"
    ],
    "reponse": 0,
    "explication": "Les travaux fondateurs restent indispensables pour comprendre les théories et concepts d'un domaine.",
    "chapitre": "7.2"
  },
  {
    "id": "s5",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "intermediaire",
    "question": "L'évaluation par les pairs garantit-elle l'absence d'erreurs ?",
    "options": [
      "Oui, totalement",
      "Non, elle améliore le contrôle mais une lecture critique reste nécessaire",
      "Oui, si la revue est connue",
      "Non, elle n'a aucune utilité"
    ],
    "reponse": 1,
    "explication": "Elle renforce le contrôle scientifique sans garantir l'absence d'erreurs (Tennant et Ross-Hellauer, 2020).",
    "chapitre": "8.2"
  },
  {
    "id": "s8",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "intermediaire",
    "question": "Quel outil permet de vérifier si une publication a été rétractée ?",
    "options": [
      "Midjourney",
      "Mendeley",
      "GitHub Copilot",
      "Retraction Watch"
    ],
    "reponse": 3,
    "explication": "Crossref Search, Retraction Watch et Google Scholar sont cités pour vérifier références, corrections et rétractations.",
    "chapitre": "8.4"
  },
  {
    "id": "s6",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "avance",
    "question": "Lequel de ces signaux doit alerter sur une revue « prédatrice » ?",
    "options": [
      "Un comité éditorial clairement identifié",
      "Une promesse de publication garantie en quelques jours",
      "Une politique éditoriale transparente",
      "Un processus d'évaluation décrit en détail"
    ],
    "reponse": 1,
    "explication": "Publication garantie rapide, frais flous, comité introuvable ou site imitant une revue reconnue sont des signaux d'alerte.",
    "chapitre": "8.3"
  },
  {
    "id": "a2",
    "cours": "comprendre-ia",
    "categorie": "selection-evaluation",
    "niveau": "avance",
    "question": "Sujet : « L'IA dans les universités ivoiriennes ». Un article sur les pratiques pédagogiques universitaires qui ne traite pas de l'IA est :",
    "options": [
      "Très pertinent : il éclaire une composante centrale du sujet",
      "Hors sujet, à exclure",
      "Utile uniquement pour une comparaison",
      "Peu pertinent car il ne parle pas d'IA"
    ],
    "reponse": 0,
    "explication": "Le tableau 14 le classe « très pertinent » : les pratiques pédagogiques sont une composante centrale du sujet.",
    "chapitre": "7.1"
  },
  {
    "id": "s9",
    "cours": "comprendre-ia",
    "categorie": "organisation",
    "niveau": "debutant",
    "question": "À quoi servent Zotero et Mendeley ?",
    "options": [
      "À organiser, classer et citer les références, et générer la bibliographie",
      "À générer des images",
      "À détecter le plagiat",
      "À traduire des articles"
    ],
    "reponse": 0,
    "explication": "Ce sont des gestionnaires de références qui génèrent la bibliographie dans le style exigé (APA, Chicago…).",
    "chapitre": "9.2"
  },
  {
    "id": "s10",
    "cours": "comprendre-ia",
    "categorie": "organisation",
    "niveau": "intermediaire",
    "question": "Comment s'organise une revue de littérature construite à partir d'une matrice de lecture ?",
    "options": [
      "Par auteur, un résumé après l'autre",
      "Par ordre alphabétique des titres",
      "Par date de téléchargement",
      "Par thèmes ou par questions, en mettant les travaux en relation"
    ],
    "reponse": 3,
    "explication": "La revue de littérature s'organise par thèmes, pas par auteur : elle compare, discute et fait émerger la lacune à combler.",
    "chapitre": "9.3 / 9.4"
  },
  {
    "id": "a1",
    "cours": "comprendre-ia",
    "categorie": "organisation",
    "niveau": "avance",
    "question": "Dans la démarche intégrée, quel est le rôle de l'IA à l'étape « Organiser » (enregistrement dans Zotero ou Mendeley) ?",
    "options": [
      "Rédiger la bibliographie à la place du chercheur",
      "Inventer les métadonnées manquantes",
      "Aucun rôle nécessaire : le chercheur contrôle lui-même les métadonnées",
      "Choisir les articles à conserver"
    ],
    "reponse": 2,
    "explication": "Le tableau 19 indique « Aucun rôle nécessaire » pour l'IA à cette étape ; le contrôle humain porte sur les métadonnées.",
    "chapitre": "10"
  },
  {
    "id": "a4",
    "cours": "comprendre-ia",
    "categorie": "organisation",
    "niveau": "avance",
    "question": "À l'étape « Sélectionner » de la démarche intégrée, qui décide de l'inclusion d'un article ?",
    "options": [
      "L'IA, après avoir résumé l'article",
      "Le moteur de recherche, selon son classement",
      "Le chercheur : l'IA peut seulement l'aider à résumer le résumé",
      "L'éditeur de la revue"
    ],
    "reponse": 2,
    "explication": "Le rôle possible de l'IA est de résumer un résumé d'article ; la décision d'inclusion relève du contrôle humain.",
    "chapitre": "10"
  }
];

// Filtrer par catégorie et/ou niveau (sans argument = toutes les questions)
export function filtrerQuestions(opts: { categorie?: string; niveau?: Niveau } = {}): QuestionQCM[] {
  return questionsComprendreIA.filter(
    (q) => (!opts.categorie || q.categorie === opts.categorie) && (!opts.niveau || q.niveau === opts.niveau),
  );
}
