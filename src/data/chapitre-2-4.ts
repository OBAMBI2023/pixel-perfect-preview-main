// Chapitres du cours « Comprendre l'IA » consultables en ligne (/formations/comprendre-ia/chapitres/:id).
// Les autres leçons sont dans chapitres-comprendre-ia.json ; la navigation suit leur `ordre`.

export type Branche = {
  numero: string;
  titre: string;
  enAnglais?: string;
  icone: "ia" | "automatique" | "profond" | "generative"; // choisit l'icône et la couleur
  definition: string;
  contenus?: string[]; // ce que l'IA générative sait produire
  outils?: string;
  exemples: string[]; // exemples concrets d'utilisation
};


export type Chapitre = {
  id: string; // dans l'URL, ex. « 2-4 »
  cours: string;
  numero: string;
  titre: string;
  introduction: string;
  infographie: {
    titreSection: string;
    src: string; // WebP affiché
    telechargement: string; // PNG d'origine à télécharger
    nomFichier: string;
    largeur: number;
    hauteur: number;
    alt: string;
    legende: string;
  };
  branches: Branche[];
  aRetenir: string[];
  quiz: string[]; // id des questions de questionsComprendreIA
};

export const chapitresComprendreIA: Chapitre[] = [
  {
    id: "2-4",
    cours: "comprendre-ia",
    numero: "2.4",
    titre: "Les branches de l'intelligence artificielle",
    introduction:
      "L'intelligence artificielle regroupe plusieurs domaines et méthodes qui permettent aux machines d'effectuer des tâches nécessitant habituellement des capacités humaines.",
    infographie: {
      titreSection: "Comprendre les grandes familles de l'IA",
      src: "/chapitres/familles-ia.webp",
      telechargement: "/chapitres/familles-ia.png",
      nomFichier: "grandes-familles-de-l-ia.png",
      largeur: 1672,
      hauteur: 941,
      alt: "Infographie « Les grandes familles de l'IA » : quatre cadres emboîtés. L'intelligence artificielle (toutes les techniques qui permettent aux machines d'effectuer des tâches intelligentes) contient l'apprentissage automatique (la machine apprend à partir d'exemples), qui contient l'apprentissage profond (une méthode utilisant plusieurs couches de calcul), qui contient l'IA générative (crée du contenu : textes, images, sons, code). Un encadré précise : chaque niveau est inclus dans le niveau qui l'englobe.",
      legende: "Schéma illustrant les relations entre l'IA, le Machine Learning, le Deep Learning et l'IA générative.",
    },
    branches: [
      {
        numero: "2.4.1",
        titre: "Intelligence artificielle (IA)",
        icone: "ia",
        definition:
          "Ensemble des techniques permettant aux machines de réaliser des tâches intelligentes : raisonnement, compréhension, reconnaissance et résolution de problèmes.",
        exemples: [
          "Un GPS qui calcule l'itinéraire le plus rapide.",
          "Un moteur de recherche qui classe les résultats par pertinence.",
          "En recherche : un logiciel qui repère les passages similaires entre deux documents.",
        ],
      },
      {
        numero: "2.4.2",
        titre: "Apprentissage automatique",
        enAnglais: "Machine Learning",
        icone: "automatique",
        definition:
          "Branche de l'IA dans laquelle les machines apprennent à partir de données et d'exemples, sans être programmées explicitement pour chaque situation.",
        exemples: [
          "Un filtre anti-spam qui apprend à partir des messages signalés.",
          "Les recommandations de vidéos ou d'articles selon ce que vous avez déjà consulté.",
          "En recherche : classer automatiquement des milliers de réponses à un questionnaire.",
        ],
      },
      {
        numero: "2.4.3",
        titre: "Apprentissage profond",
        enAnglais: "Deep Learning",
        icone: "profond",
        definition: "Sous-domaine du Machine Learning reposant sur des réseaux de neurones artificiels comportant plusieurs couches de calcul.",
        exemples: [
          "Le déverrouillage du téléphone par reconnaissance du visage.",
          "La traduction automatique d'un texte.",
          "En recherche : transcrire automatiquement des entretiens enregistrés.",
        ],
      },
      {
        numero: "2.4.4",
        titre: "Intelligence artificielle générative",
        icone: "generative",
        definition: "Domaine de l'IA capable de produire de nouveaux contenus à partir d'instructions ou de données :",
        contenus: ["Textes", "Images", "Sons et musiques", "Vidéos", "Code informatique"],
        outils: "Exemples : ChatGPT, Gemini, Claude, Midjourney et DALL·E.",
        exemples: [
          "Rédiger un premier brouillon de courriel ou de résumé, à relire et corriger.",
          "Créer une illustration pour une présentation à partir d'une description.",
          "En recherche : proposer un script pour analyser des données, à tester et vérifier.",
        ],
      },
    ],
    aRetenir: [
      "Les quatre familles sont emboîtées : chaque niveau est inclus dans celui qui l'englobe.",
      "Toute IA n'est pas de l'apprentissage automatique, et tout apprentissage automatique n'est pas de l'apprentissage profond.",
      "L'IA générative crée de nouveaux contenus : ce qu'elle produit doit toujours être vérifié.",
    ],
    quiz: ["f10", "f7", "f8", "f11", "f12"],
  },
];

export const chapitreComprendreIA = (id: string) => chapitresComprendreIA.find((c) => c.id === id);
