import manuelAsset from "@/assets/manuel.pdf.asset.json";

export const MANUEL_URL = manuelAsset.url;
export const MANUEL_PAGES = 29;
/** Numéro de page imprimé dans le manuel → page du fichier PDF (couverture + sommaire = 3 pages). */
export const pdfPage = (printed: number) => printed + 3;

export const objectifs = [
  "Définir l'intelligence artificielle et l'IA générative, et en distinguer les principes de fonctionnement.",
  "Formuler des instructions (prompts) précises, contextualisées et vérifiables.",
  "Identifier les limites, les risques éthiques et les règles d'intégrité liés à l'usage de l'IA en recherche.",
  "Construire une stratégie de recherche documentaire structurée et la mettre en œuvre dans des bases scientifiques.",
  "Sélectionner, lire et évaluer de manière critique des sources scientifiques.",
  "Organiser sa documentation et rédiger une matrice de lecture préparant la revue de littérature.",
];

export type Module = { n: number; chapitre: number; title: string; page: number; objectifs: string; sections: string[] };

export const modules: Module[] = [
  { n: 1, chapitre: 2, title: "Fondements de l'intelligence artificielle", page: 2, objectifs: "Définir l'IA ; situer ses grandes étapes historiques ; décrire les quatre composantes d'un système d'IA ; distinguer ses principales branches.", sections: ["Définition", "Repères historiques", "Fonctionnement général", "Principales branches", "Exemples d'usages quotidiens", "Importance pour la recherche scientifique"] },
  { n: 2, chapitre: 3, title: "Intelligence artificielle générative", page: 5, objectifs: "Comprendre ce qu'est l'IA générative, son fonctionnement, ses outils et ce qui la distingue de l'IA en général.", sections: ["Définition", "Fonctionnement", "Exemples d'outils", "Applications dans la recherche scientifique", "Différence entre IA et IA générative"] },
  { n: 3, chapitre: 4, title: "Ingénierie des instructions et prompts", page: 7, objectifs: "Rédiger un prompt efficace à l'aide des six éléments : rôle, contexte, objectif, consignes, format, critères de qualité.", sections: ["Définition", "Les six éléments d'un prompt efficace", "Exemple d'amélioration d'un prompt", "Bonnes pratiques"] },
  { n: 4, chapitre: 5, title: "Limites, risques et éthique de l'IA", page: 9, objectifs: "Identifier les limites techniques, les hallucinations, les enjeux de confidentialité et d'intégrité ; savoir déclarer l'usage de l'IA.", sections: ["Limites techniques", "Limites liées au jugement et à l'autonomie", "Confidentialité et intégrité scientifique", "Déclarer et citer l'usage de l'IA"] },
  { n: 5, chapitre: 6, title: "Recherche documentaire scientifique", page: 11, objectifs: "Définir la recherche documentaire ; distinguer les types de sources ; choisir des outils ; construire une équation de recherche ; mobiliser l'IA avec prudence.", sections: ["Définition et finalités", "Types de sources scientifiques", "Moteurs de recherche et bases de données", "Construire une stratégie de recherche", "Utiliser l'IA pour la recherche documentaire", "Outils d'IA dédiés"] },
  { n: 6, chapitre: 7, title: "Sélection et lecture des sources", page: 15, objectifs: "Établir des critères d'inclusion et d'exclusion ; trier un corpus ; lire un article scientifique de façon progressive.", sections: ["Pourquoi sélectionner ?", "Critères d'inclusion et d'exclusion", "Lire efficacement un article scientifique"] },
  { n: 7, chapitre: 8, title: "Évaluation de la qualité des sources", page: 17, objectifs: "Évaluer la crédibilité d'une publication ; comprendre l'évaluation par les pairs ; repérer les sources douteuses ; vérifier références et DOI.", sections: ["Évaluer la crédibilité d'une publication", "Comprendre l'évaluation par les pairs", "Identifier les sources douteuses", "Vérifier les références et les DOI"] },
  { n: 8, chapitre: 9, title: "Organisation et exploitation de la documentation", page: 18, objectifs: "Organiser sa documentation ; utiliser un gestionnaire de références ; construire une matrice de lecture ; préparer la revue de littérature.", sections: ["Organiser sa documentation scientifique", "Outils de gestion bibliographique", "La matrice de lecture scientifique", "De la matrice à la revue de littérature"] },
  { n: 9, chapitre: 10, title: "Démarche intégrée IA et recherche documentaire", page: 20, objectifs: "Enchaîner les étapes : l'IA propose, le chercheur vérifie et décide.", sections: ["Démarche intégrée", "Évaluation des acquis (chapitre 11)"] },
];

export type Quiz = { id: string; module: number; question: string; options: string[]; answer: number; explanation: string };

/** Questions construites à partir du contenu du manuel. */
export const quiz: Quiz[] = [
  { id: "m1", module: 1, question: "Selon le manuel, l'intelligence artificielle est…", options: ["Un logiciel de traitement de texte", "Un domaine de l'informatique qui conçoit des systèmes capables de tâches exigeant des capacités humaines", "Une base de données de publications", "Un synonyme de robotique"], answer: 1, explanation: "L'IA conçoit des systèmes capables d'apprendre, raisonner, reconnaître, comprendre le langage et décider (chapitre 2.1)." },
  { id: "m2", module: 2, question: "Quelle est la différence entre l'IA et l'IA générative ?", options: ["Ce sont deux noms pour la même chose", "L'IA générative est une branche de l'IA qui crée de nouveaux contenus à partir d'un prompt", "L'IA générative ne fonctionne que sur des images", "L'IA est plus récente que l'IA générative"], answer: 1, explanation: "L'IA est le domaine global (analyser, reconnaître, prédire, classer) ; l'IA générative en est une branche qui crée des contenus (chapitre 3.5)." },
  { id: "m3", module: 3, question: "Lequel de ces éléments ne fait PAS partie des six éléments d'un prompt efficace ?", options: ["Le rôle", "Le format", "La longueur maximale", "Les critères de qualité"], answer: 2, explanation: "Les six éléments sont : rôle, contexte, objectif, consignes, format, critères de qualité. « Un bon prompt ne se mesure pas à sa longueur » (chapitre 4)." },
  { id: "m4", module: 4, question: "Qu'est-ce qu'une hallucination d'une IA ?", options: ["Une panne du serveur", "Une information ou une référence inventée présentée comme crédible", "Une réponse trop longue", "Une image floue"], answer: 1, explanation: "Pour s'en prémunir : vérifier chaque référence à la source et exiger dans le prompt qu'aucune référence ne soit fabriquée (chapitre 5)." },
  { id: "m5", module: 4, question: "Peut-on transmettre des données personnelles ou confidentielles dans un prompt ?", options: ["Oui, si l'outil est connu", "Non, jamais", "Oui, si on le déclare"], answer: 1, explanation: "Bonne pratique du chapitre 4.4 : ne jamais transmettre de données personnelles ou confidentielles dans un prompt." },
  { id: "m6", module: 5, question: "Une source primaire est un document qui…", options: ["Analyse et synthétise des travaux existants", "Présente des données ou des résultats originaux", "Est publié par une institution", "Est le premier résultat sur Google"], answer: 1, explanation: "Une source secondaire, elle, analyse, synthétise ou discute des travaux existants (chapitre 6.2)." },
  { id: "m7", module: 5, question: "Dans une équation de recherche, l'opérateur OR sert à…", options: ["Exclure un terme", "Associer deux concepts et réduire les résultats", "Regrouper des synonymes et élargir la recherche", "Rechercher une expression exacte"], answer: 2, explanation: "AND associe et réduit, OR regroupe des synonymes et élargit, NOT exclut, les guillemets cherchent l'expression exacte (chapitre 6.4)." },
  { id: "m8", module: 5, question: "La présence d'un document dans Google Scholar garantit-elle sa qualité ?", options: ["Oui", "Non"], answer: 1, explanation: "Un moteur académique indexe des documents variés, évalués ou non par les pairs : ce n'est pas un label de qualité (chapitre 6.3)." },
  { id: "m9", module: 5, question: "Quel outil est cité dans le manuel pour vérifier les métadonnées et les DOI ?", options: ["PubMed", "Crossref", "CORE", "Persée"], answer: 1, explanation: "Crossref (crossref.org) permet de vérifier les métadonnées et les DOI (tableau 11)." },
  { id: "m10", module: 6, question: "Lequel est un critère d'EXCLUSION de source ?", options: ["Lien direct avec la problématique", "Méthodologie décrite", "Origine invérifiable", "Résultats utiles"], answer: 2, explanation: "Exclusion : hors sujet, origine invérifiable, méthodologie absente, redondance (chapitre 7.2)." },
  { id: "m11", module: 7, question: "L'évaluation par les pairs garantit-elle l'absence d'erreurs ?", options: ["Oui", "Non"], answer: 1, explanation: "Elle améliore le contrôle scientifique, mais une publication évaluée doit aussi faire l'objet d'une lecture critique (chapitre 8.2)." },
  { id: "m12", module: 7, question: "Lequel est un signal d'alerte d'une revue douteuse (« prédatrice ») ?", options: ["Comité éditorial clairement identifié", "Promesse d'une publication garantie en quelques jours", "Processus d'évaluation transparent", "Frais clairement expliqués"], answer: 1, explanation: "Autres signaux : évaluation non transparente, frais flous, comité difficile à identifier, indexation trompeuse (chapitre 8.3)." },
  { id: "m13", module: 8, question: "À quoi sert une matrice de lecture ?", options: ["À stocker des PDF", "À comparer plusieurs publications selon des critères identiques", "À traduire des articles", "À générer une bibliographie"], answer: 1, explanation: "Elle évite la simple succession de résumés et fait apparaître convergences, divergences et limites (chapitre 9.3)." },
  { id: "m14", module: 9, question: "Quel principe directeur résume le cours ?", options: ["L'IA décide, le chercheur valide", "L'IA propose, le chercheur vérifie et décide", "Le chercheur propose, l'IA vérifie", "L'IA remplace la recherche documentaire"], answer: 1, explanation: "« L'IA propose, le chercheur vérifie et décide » (chapitres 1 et 12)." },
];

export const promptElements = [
  { key: "role", label: "Le rôle", fonction: "Préciser l'expertise à mobiliser", exemple: "« Agis comme un chercheur spécialisé en sociologie. »" },
  { key: "contexte", label: "Le contexte", fonction: "Présenter la situation et le sujet", exemple: "« Je prépare un mémoire sur le chômage des jeunes en Côte d'Ivoire. »" },
  { key: "objectif", label: "L'objectif", fonction: "Indiquer le travail attendu", exemple: "« Propose cinq problématiques de recherche pertinentes. »" },
  { key: "consignes", label: "Les consignes", fonction: "Définir les règles à respecter", exemple: "« Évite les sujets trop généraux et privilégie une approche empirique. »" },
  { key: "format", label: "Le format", fonction: "Préciser la forme de la réponse", exemple: "« Présente les propositions dans un tableau avec les objectifs associés. »" },
  { key: "qualite", label: "Les critères de qualité", fonction: "Fixer les exigences de rigueur", exemple: "« Signale les limites, distingue les faits des hypothèses et n'invente aucune référence. »" },
];

export const promptFaible = "Parle-moi de l'intelligence artificielle dans l'éducation.";
export const promptAmeliore = "Agis comme un spécialiste en sciences de l'éducation. Analyse les effets de l'IA générative sur les pratiques pédagogiques dans l'enseignement supérieur en Afrique de l'Ouest. Présente les opportunités, les limites et les enjeux éthiques. Structure ta réponse en trois parties et adopte un langage académique.";

export const sixQuestions = [
  { q: "Qui est l'auteur ?", p: "Qualifications, domaine de compétence et affiliation identifiables" },
  { q: "Où le document est-il publié ?", p: "Politique éditoriale transparente de la revue ou de l'éditeur" },
  { q: "Quand a-t-il été publié ?", p: "Actualité suffisante au regard du sujet étudié" },
  { q: "Comment la recherche a-t-elle été menée ?", p: "Méthodologie clairement expliquée et adaptée" },
  { q: "Les résultats sont-ils justifiés ?", p: "Conclusions fondées sur les données présentées" },
  { q: "Le document est-il pertinent ?", p: "Réponse effective à la problématique" },
];

export const doiEtapes = [
  "Rechercher le titre exact de la référence",
  "Vérifier les auteurs et l'année",
  "Vérifier le nom de la revue",
  "Comparer le DOI avec les métadonnées (Crossref)",
  "Consulter la page de l'éditeur",
  "Rechercher d'éventuelles corrections ou rétractations",
];

export const revision = [
  { q: "Définissez l'intelligence artificielle et donnez trois exemples d'usage quotidien.", r: "L'IA désigne des systèmes capables d'accomplir des tâches associées à des capacités humaines (apprendre, reconnaître, prédire) ; exemples : déverrouillage par reconnaissance faciale, navigation GPS, recommandations de contenus.", ch: 2 },
  { q: "Quelle différence existe-t-il entre l'IA et l'IA générative ?", r: "L'IA est le domaine global (analyser, reconnaître, prédire, classer) ; l'IA générative en est une branche qui crée de nouveaux contenus à partir d'un prompt.", ch: 3 },
  { q: "Quels sont les six éléments d'un prompt efficace ? Illustrez chacun par un exemple.", r: "Rôle, contexte, objectif, consignes, format, critères de qualité ; chacun est illustré par un exemple dans le tableau du chapitre 4.", ch: 4 },
  { q: "Expliquez ce qu'est une hallucination et proposez deux moyens de s'en prémunir.", r: "Une hallucination est une information ou une référence inventée présentée comme crédible ; précautions : vérifier chaque référence à la source et exiger dans le prompt qu'aucune référence ne soit fabriquée.", ch: 5 },
  { q: "Distinguez source primaire et source secondaire.", r: "Une source primaire présente des données originales ; une source secondaire analyse ou synthétise des travaux existants.", ch: 6 },
  { q: "Pourquoi la présence d'un document dans Google Scholar ne garantit-elle pas sa qualité ?", r: "Un moteur académique indexe des documents de nature variée, évalués ou non par les pairs ; la présence dans l'outil n'est pas un label de qualité.", ch: 6 },
  { q: "Rédigez une équation de recherche combinant AND et OR pour un sujet de votre choix.", r: "Exemple : (\"artificial intelligence\" OR \"generative AI\") AND (\"higher education\" OR university) ; la réponse varie selon le sujet choisi.", ch: 6 },
  { q: "Citez quatre critères d'inclusion et quatre critères d'exclusion de sources.", r: "Inclusion : lien direct avec la problématique, origine identifiable, méthodologie décrite, résultats utiles. Exclusion : hors sujet, origine invérifiable, méthodologie absente, redondance.", ch: 7 },
  { q: "Que contrôle l'évaluation par les pairs, et quelles sont ses limites ?", r: "Elle contrôle la pertinence, la méthodologie, la qualité des résultats et la cohérence des interprétations ; elle ne garantit pas l'absence d'erreurs et n'exempte pas de lecture critique.", ch: 8 },
  { q: "Décrivez les étapes de vérification d'une référence bibliographique et d'un DOI.", r: "Titre exact, auteurs, année, revue, comparaison du DOI avec les métadonnées, page de l'éditeur, recherche de corrections ou rétractations.", ch: 8 },
];

export const travauxPratiques = [
  { t: "Cadrage", d: "Choisissez un sujet de recherche, identifiez ses concepts clés et construisez un tableau de mots-clés bilingue." },
  { t: "Recherche", d: "Élaborez trois équations de recherche et testez-les dans deux bases différentes ; comparez le nombre et la nature des résultats." },
  { t: "Sélection et évaluation", d: "Retenez cinq publications selon des critères explicites, puis évaluez chacune à l'aide des six questions du chapitre 8." },
  { t: "Synthèse", d: "Réalisez une matrice de lecture de ces cinq publications et rédigez un paragraphe de synthèse (150 à 200 mots) mettant en évidence convergences et divergences." },
  { t: "Usage de l'IA", d: "Soumettez à une IA un prompt structuré selon les six éléments, vérifiez chaque référence proposée et consignez les erreurs relevées." },
];

export const grille = [
  { c: "Qualité de la stratégie de recherche", pts: 5, i: "Concepts, mots-clés bilingues, équations pertinentes, filtres justifiés" },
  { c: "Rigueur de la sélection et de l'évaluation", pts: 5, i: "Critères explicites ; application des six questions d'évaluation" },
  { c: "Matrice de lecture et synthèse", pts: 5, i: "Comparaison structurée ; convergences et divergences dégagées" },
  { c: "Usage critique de l'IA et vérification des références", pts: 3, i: "Prompt structuré ; erreurs repérées ; usage déclaré" },
  { c: "Présentation et références", pts: 2, i: "Clarté, orthographe, références complètes et cohérentes" },
];

export const motsCles = [
  { fr: "Intelligence artificielle", en: "Artificial intelligence" },
  { fr: "IA générative", en: "Generative AI" },
  { fr: "Enseignement supérieur", en: "Higher education" },
  { fr: "Pratiques pédagogiques", en: "Teaching practices" },
  { fr: "Côte d'Ivoire", en: "Ivory Coast" },
];
