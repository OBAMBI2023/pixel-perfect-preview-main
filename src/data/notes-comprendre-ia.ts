// Notes orales du formateur pour « L'IA et la recherche — l'essentiel » (src/data/slides-comprendre-ia.ts).
// Réservées aux pages formateur : ne jamais importer ce fichier dans une page apprenant.
// La question à la salle est copiée dans public.seances_direct au moment où elle est posée.

export type NoteSlide = {
  id: string; // id de la diapositive
  dureeMin: number; // durée conseillée
  notes: string[]; // phrases à dire à la salle
  question: string; // question à poser à la salle (réponse courte)
  exemple: string; // exemple ou activité à montrer
  transition: string; // phrase pour enchaîner sur la diapositive suivante
};

export const notesComprendreIA: NoteSlide[] = [
  {
    id: "s1",
    dureeMin: 2,
    notes: [
      "Bienvenue à tous. Aujourd'hui, nous allons apprendre à utiliser l'intelligence artificielle dans la recherche universitaire.",
      "Le but n'est pas de devenir informaticien. Le but est d'apprendre à utiliser ces outils intelligemment, sans leur faire confiance aveuglément.",
    ],
    question: "Qui a déjà utilisé ChatGPT ou un autre outil d'intelligence artificielle pour un devoir, un mémoire ou une recherche ?",
    exemple: "Partir des réponses des participants et leur demander ce qu'ils ont trouvé utile ou difficile.",
    transition: "Avant d'aller plus loin, retenons une règle essentielle.",
  },
  {
    id: "s2",
    dureeMin: 3,
    notes: [
      "Retenez cette phrase : l'IA propose, le chercheur vérifie et décide.",
      "ChatGPT peut vous aider à avancer plus vite, mais il ne fait pas le travail de réflexion à votre place. Vous restez responsable de ce que vous écrivez dans votre mémoire ou votre thèse.",
    ],
    question: "Si ChatGPT invente un article et que vous le citez dans votre mémoire, qui est responsable ?",
    exemple: "Un étudiant cite un article qui n'existe pas. Lors de la vérification, le jury ne retrouve ni l'article ni ses auteurs.",
    transition: "Pour comprendre cette règle, voyons d'abord ce qu'est l'intelligence artificielle.",
  },
  {
    id: "s3",
    dureeMin: 3,
    notes: [
      "L'intelligence artificielle, ou IA, désigne des systèmes informatiques capables d'effectuer certaines tâches qui demandent habituellement des capacités humaines.",
      "Par exemple, une IA peut reconnaître un visage, comprendre une question ou aider à analyser un document. Contrairement à un programme classique entièrement basé sur des règles écrites à l'avance, certains systèmes d'IA apprennent à partir de nombreux exemples.",
    ],
    question: "Dans votre vie quotidienne, où utilisez-vous déjà l'IA sans forcément y penser ?",
    exemple: "Le téléphone qui reconnaît votre visage ou Google Maps qui propose un itinéraire en fonction de la circulation.",
    transition: "L'IA ne date pas d'hier. Regardons comment elle s'est développée.",
  },
  {
    id: "s4",
    dureeMin: 3,
    notes: [
      "En 1950, le chercheur Alan Turing pose une question importante : une machine peut-elle donner l'impression de penser comme un humain ?",
      "En 1956, l'expression “intelligence artificielle” est utilisée lors d'un atelier scientifique qui marque le début officiel du domaine.",
      "L'IA a connu des périodes de progrès, mais aussi des périodes de déception, lorsque les résultats ne répondaient pas aux attentes. Plus récemment, les progrès des ordinateurs, la quantité de données disponibles et les nouvelles méthodes ont permis de développer des outils très puissants.",
    ],
    question: "Pourquoi pensez-vous que l'IA est devenue aussi visible ces dernières années ?",
    exemple: "En 2022, ChatGPT devient accessible au grand public et attire rapidement l'attention.",
    transition: "Mais concrètement, comment une intelligence artificielle produit-elle un résultat ?",
  },
  {
    id: "s5",
    dureeMin: 4,
    notes: [
      "Prenons un exemple simple : une IA qui apprend à reconnaître les chats.",
      "1. Les données, c'est ce qu'on lui donne : par exemple 1 000 photos de chats, noirs, blancs et roux.",
      "2. L'algorithme, c'est la méthode : des calculs qui repèrent les points communs, comme les oreilles, les yeux ou la forme du museau.",
      "3. Le modèle, c'est ce que l'IA a retenu après l'entraînement : les caractéristiques d'un chat.",
      "4. Le résultat, c'est sa réponse face à une nouvelle photo : “Cette image contient probablement un chat.”",
      "Pour retenir : les données sont les ingrédients, l'algorithme la recette, le modèle le savoir-faire, et le résultat le plat.",
    ],
    question: "Si on lui montre seulement des chats noirs, que répondra-t-elle devant un chat blanc ?",
    exemple: "Cliquer sur « Voir l'analogie de la cuisine » au moment de la dernière phrase.",
    transition: "L'IA a plusieurs branches : voyons comment elles s'emboîtent.",
  },
  {
    id: "s6",
    dureeMin: 3,
    notes: [
      "L'intelligence artificielle est un grand domaine. À l'intérieur, on trouve notamment l'apprentissage automatique, où les systèmes apprennent à partir de données.",
      "L'apprentissage profond est une méthode qui utilise des réseaux de neurones artificiels comportant plusieurs couches. Il permet notamment de reconnaître des images et de traiter le langage.",
      "L'IA générative est capable de produire du contenu, par exemple du texte, des images ou du code. ChatGPT est un exemple d'IA générative fondée sur un grand modèle de langage. Ces catégories sont liées, mais elles ne forment pas toujours des boîtes parfaitement séparées.",
    ],
    question: "ChatGPT sert-il surtout à produire du contenu ou à reconnaître des images ? Et une IA qui aide à analyser une radiographie ?",
    exemple: "ChatGPT pour produire du texte ; un système de vision par ordinateur pour repérer des éléments sur une image médicale.",
    transition: "Concentrons-nous maintenant sur l'IA générative, celle que nous utiliserons dans la recherche.",
  },
  {
    id: "s7",
    dureeMin: 4,
    notes: [
      "Une IA générative peut créer un texte, une image, un résumé ou du code à partir d'une demande appelée prompt.",
      "Pour produire une réponse, un modèle de langage calcule quelles suites de mots sont plausibles dans le contexte. Mais une réponse plausible n'est pas forcément vraie.",
      "C'est pourquoi une IA peut écrire un texte très convaincant tout en contenant une erreur ou une information inventée. La qualité de la rédaction ne garantit donc pas la qualité scientifique.",
    ],
    question: "Un texte bien écrit est-il forcément exact ?",
    exemple: "Demander à une IA la biographie détaillée d'un chercheur peu connu, puis vérifier les informations dans des sources fiables.",
    transition: "Pour obtenir une réponse utile, il faut apprendre à bien formuler sa demande.",
  },
  {
    id: "s8",
    dureeMin: 5,
    notes: [
      "Un prompt est simplement la demande que vous adressez à l'IA. Plus votre demande est claire, plus la réponse a de chances d'être adaptée à votre besoin.",
      "Pour construire un bon prompt, pensez à six éléments : le rôle attendu, le contexte, l'objectif, les consignes, le format de la réponse et les critères de qualité.",
      "Il ne suffit pas d'écrire une longue demande. Il faut surtout être précis. Et attention : ne transmettez pas de données personnelles ou de documents confidentiels sans avoir vérifié les règles de confidentialité de l'outil.",
    ],
    question: "Comment pouvons-nous améliorer la demande suivante : “Parle-moi de l'IA dans l'éducation” ?",
    exemple:
      "Construire ensemble cette demande : « Agis comme un spécialiste des sciences de l'éducation. Présente les usages de l'intelligence artificielle dans l'enseignement supérieur en Afrique de l'Ouest. Organise la réponse en trois parties, distingue les faits des hypothèses et propose des références scientifiques vérifiables. N'invente aucune référence. »",
    transition: "Même avec une bonne demande, l'IA peut se tromper. Voyons ses principales limites.",
  },
  {
    id: "s9",
    dureeMin: 4,
    notes: [
      "Première limite : les hallucinations. C'est lorsque l'IA présente une information fausse ou inventée comme si elle était vraie. Cela peut concerner des faits, des citations ou des références bibliographiques.",
      "Il existe aussi des biais, des informations dépassées et des réponses incomplètes. Enfin, si nous laissons l'IA tout faire, nous risquons de moins réfléchir par nous-mêmes.",
      "Le bon réflexe consiste à utiliser l'IA pour nous aider, puis à contrôler ses réponses avec des sources fiables.",
    ],
    question: "Comment vérifier qu'une référence bibliographique proposée par ChatGPT existe réellement ?",
    exemple:
      "Des travaux de Walters et Wilder, publiés en 2023, ont étudié les références bibliographiques générées par ChatGPT et mis en évidence des erreurs et des références fabriquées.",
    transition: "Ces limites nous amènent à une question importante : comment utiliser l'IA de manière responsable ?",
  },
  {
    id: "s10",
    dureeMin: 3,
    notes: [
      "ChatGPT n'est pas responsable de votre mémoire ou de votre thèse. C'est vous qui devez pouvoir justifier vos choix, vos analyses et vos conclusions.",
      "Lorsque les règles de votre établissement l'exigent, déclarez votre utilisation de l'IA. Précisez l'outil utilisé, les tâches concernées et les vérifications effectuées.",
      "Pour une affirmation scientifique, recherchez et citez de préférence la source originale. Une réponse de ChatGPT ne remplace pas une publication scientifique. Si vous étudiez directement les réponses de l'IA, leur citation peut toutefois être nécessaire selon les règles bibliographiques applicables.",
    ],
    question: "Utiliser l'IA pour corriger ou reformuler un paragraphe est-il automatiquement de la triche ?",
    exemple:
      "Lire une déclaration d'utilisation de l'IA et montrer comment l'adapter à un mémoire ou à une thèse, conformément aux règles de l'établissement.",
    transition: "Maintenant que nous savons utiliser l'IA avec prudence, apprenons à rechercher des sources scientifiques.",
  },
  {
    id: "s11",
    dureeMin: 5,
    notes: [
      "Pour chercher des articles scientifiques, ne tapez pas forcément toute votre question dans le moteur de recherche. Commencez par découper votre sujet en grandes idées, qu'on appelle des concepts.",
      "Pour chaque concept, trouvez des mots-clés en français et en anglais. Ensuite, utilisez les opérateurs de recherche : OR pour relier des synonymes, AND pour combiner plusieurs concepts et les guillemets pour rechercher une expression exacte.",
      "Google Scholar permet de repérer des publications scientifiques, mais il faut toujours examiner la qualité et la pertinence des documents trouvés.",
    ],
    question: "Quels mots-clés utiliseriez-vous pour rechercher des travaux sur le téléphone mobile dans l'apprentissage universitaire ?",
    exemple:
      "Construire avec les participants une équation telle que : (\"téléphone mobile\" OR smartphone) AND (\"apprentissage universitaire\" OR \"enseignement supérieur\"). Puis tester cette équation dans Google Scholar et observer les résultats.",
    transition: "Une recherche peut produire beaucoup de résultats. Comment choisir les articles qui nous intéressent vraiment ?",
  },
  {
    id: "s12",
    dureeMin: 4,
    notes: [
      "Avant de commencer le tri, définissez vos critères : le sujet, la période de publication, la langue et le type d'étude recherché.",
      "Vous n'avez pas besoin de lire tous les articles en entier dès le départ. Commencez par le titre et le résumé. Si l'article semble pertinent, examinez ensuite la méthode, les résultats et les limites.",
      "Pour évaluer une source, posez-vous quatre questions simples : qui a écrit ? Où l'article a-t-il été publié ? Quand ? Comment la recherche a-t-elle été menée ? Vérifiez aussi si les résultats sont justifiés par les données présentées et si l'article répond à votre question de recherche.",
    ],
    question: "Une revue qui vous promet de publier votre article en trois jours, sans véritable évaluation scientifique, est-elle un bon signe ?",
    exemple:
      "Présenter les signaux d'alerte d'une revue prédatrice : promesses irréalistes, frais mal expliqués, comité éditorial douteux ou absence d'évaluation scientifique crédible. Le délai seul ne suffit cependant pas à conclure.",
    transition: "Après avoir sélectionné les articles, il reste à vérifier les références et à organiser les informations.",
  },
  {
    id: "s13",
    dureeMin: 3,
    notes: [
      "Pour chaque article retenu, vérifiez le titre, les auteurs, la revue, l'année et, lorsqu'il existe, le DOI. Le DOI est un identifiant permanent qui permet de retrouver une publication.",
      "Des outils comme Crossref permettent de vérifier les informations bibliographiques. Retraction Watch aide à repérer les publications rétractées.",
      "Zotero permet d'enregistrer et de classer les références, puis de créer une bibliographie. Une matrice de lecture permet de comparer les articles selon leurs objectifs, leurs méthodes, leurs résultats et leurs limites.",
    ],
    question: "Qui utilise déjà Zotero ou Mendeley pour organiser ses références ?",
    exemple: "Montrer un DOI, ouvrir son lien sur https://doi.org/ et expliquer comment enregistrer ensuite la référence dans Zotero.",
    transition: "Nous avons vu comment demander, vérifier et organiser. Résumons les réflexes à conserver.",
  },
  {
    id: "s14",
    dureeMin: 3,
    notes: [
      "Retenez trois réflexes : bien formuler vos demandes, vérifier les réponses et déclarer votre utilisation de l'IA lorsque cela est requis.",
      "L'intelligence artificielle peut vous faire gagner du temps, mais elle ne garantit ni la vérité ni la qualité scientifique. C'est votre méthode, votre esprit critique et votre rigueur qui donnent de la valeur à votre recherche.",
      "Après cette séance, vous allez pouvoir mettre ces principes en pratique grâce au questionnaire et aux exercices disponibles sur le site pédagogique.",
    ],
    question: "Quelle habitude allez-vous changer dès demain dans votre manière d'utiliser l'IA pour vos recherches ?",
    exemple: "Annoncer le QCM et l'exercice de vérification des sources à réaliser sur le site pédagogique.",
    transition: "Merci pour votre participation. Place maintenant à vos questions, puis au QCM.",
  },
];

export const DUREE_TOTALE_MIN = notesComprendreIA.reduce((s, n) => s + n.dureeMin, 0);
