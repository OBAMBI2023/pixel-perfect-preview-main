import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase, type AccueilParticipant, type Database, type ModeParticipation } from "@/lib/supabase";

/**
 * Parcours d'accueil (page /bienvenue) : étapes de démarrage et mode de participation.
 * Enregistré dans public.accueil_participant, à part des tentatives : aucun effet sur les scores.
 */
export const ETAPES_ACCUEIL = [
  {
    id: "site",
    titre: "Découvrir le site",
    texte: "Repère les grandes rubriques du menu : tu y reviendras à chaque séance.",
    points: [
      "Formations : le programme, les modules, les leçons interactives et les supports de cours.",
      "Exercices : les QCM et les exercices pratiques.",
      "Outils IA : les moteurs académiques et les outils d'IA utiles à la recherche, avec leurs limites.",
    ],
    lien: { to: "/outils-ia", label: "Voir les outils IA" },
  },
  {
    id: "programme",
    titre: "Consulter le programme",
    texte: "La formation progresse par niveaux, puis par modules. Prends quelques minutes pour voir ce qui t'attend.",
    points: [
      "La page Formations présente le parcours et les thèmes abordés à chaque niveau.",
      "Le module « Comprendre l'IA » rassemble le support de cours, les leçons interactives et la présentation.",
      "Chaque leçon interactive se termine par un court quiz pour vérifier ta compréhension.",
    ],
    lien: { to: "/formations", label: "Voir le programme" },
  },
  {
    id: "exercices",
    titre: "Découvrir les exercices",
    texte: "Les exercices servent à t'entraîner entre les explications du formateur.",
    points: [
      "Choisis une catégorie et un niveau, puis réponds aux questions une par une.",
      "La correction et son explication s'affichent juste après chaque réponse ; le score de la série apparaît à la fin.",
      "Quand tu es connecté, chaque réponse est enregistrée dans ton compte.",
    ],
    lien: { to: "/exercices", label: "Voir les exercices" },
  },
  {
    id: "progression",
    titre: "Comprendre ma progression",
    texte: "Ton espace personnel rassemble tes résultats.",
    points: [
      "Tes tentatives, ta réussite moyenne, ta progression par niveau et par catégorie.",
      "L'historique de tes exercices, les travaux à faire et les copies corrigées par ton formateur.",
      "La progression des leçons interactives est gardée sur l'appareil que tu utilises.",
    ],
    lien: { to: "/mon-espace", label: "Ouvrir mon espace" },
  },
  {
    id: "pratique",
    titre: "Se préparer à pratiquer",
    texte: "Quelques règles simples pour bien profiter des séances.",
    points: [
      "Suis les explications du formateur avant de te lancer seul.",
      "Réalise les exercices proposés pendant et après les séances.",
      "Vérifie toujours les réponses produites par l'IA : sources, références et chiffres peuvent être faux.",
    ],
    lien: null,
  },
] as const;

export type EtapeAccueil = (typeof ETAPES_ACCUEIL)[number]["id"];

export const MODES_PARTICIPATION: { id: ModeParticipation; label: string; consignes: string[] }[] = [
  {
    id: "presentiel",
    label: "Présentiel",
    consignes: [
      "Connecte ton ordinateur au Wi-Fi indiqué par le formateur ou par l'établissement, si nécessaire.",
      "Branche ou charge ton ordinateur avant la séance et ferme les applications inutiles.",
      "Ouvre ce site dans ton navigateur et reste connecté à ton compte pendant toute la séance.",
    ],
  },
  {
    id: "distance",
    label: "À distance via Google Meet",
    consignes: [
      "Ouvre Google Meet avec le lien transmis par le formateur.",
      "Garde le site pédagogique ouvert dans un autre onglet pour passer de l'un à l'autre.",
      "Utilise un casque ou des écouteurs si possible.",
      "Consulte le chat de la réunion : le formateur y partage les liens et les consignes.",
    ],
  },
];

export const NB_ETAPES_ACCUEIL = ETAPES_ACCUEIL.length;

/** Étapes terminées, limitées à celles du parcours (ordre du parcours). */
export const etapesFaites = (a: AccueilParticipant | null | undefined) =>
  ETAPES_ACCUEIL.filter((e) => a?.etapes.includes(e.id)).map((e) => e.id);

/** Parcours de l'utilisateur connecté ; null tant qu'il n'a rien enregistré. */
export function useAccueil(userId: string | undefined) {
  return useQuery({
    queryKey: ["accueil", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const sb = getSupabase();
      if (!sb) throw new Error("Supabase non configuré");
      const { data, error } = await sb.from("accueil_participant").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Enregistre une étape, le mode ou la page vue ; l'identifiant vient de la session côté base (auth.uid()). */
export function useMajAccueil(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Database["public"]["Functions"]["enregistrer_accueil"]["Args"]) => {
      const sb = getSupabase();
      if (!sb) throw new Error("La connexion n'est pas configurée sur ce site.");
      const { data, error } = await sb.rpc("enregistrer_accueil", args);
      if (error) throw new Error("L'enregistrement a échoué. Vérifie ta connexion internet, puis réessaie.");
      return data;
    },
    onSuccess: (ligne) => qc.setQueryData(["accueil", userId], ligne),
  });
}

/**
 * Formateur : avancement du démarrage des membres d'un groupe (la RLS limite aux membres de ses groupes).
 * Seules les colonnes utiles sont lues ; groupeId dans la clé pour suivre invaliderGroupe.
 */
export function useAccueilMembres(groupeId: string, ids: string[]) {
  return useQuery({
    queryKey: ["accueil-membres", groupeId, ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await getSupabase()!
        .from("accueil_participant")
        .select("user_id, etapes, mode_participation, termine_le")
        .in("user_id", ids);
      if (error) throw error;
      return new Map(data.map((a) => [a.user_id, a]));
    },
  });
}

/** Après la connexion, la page de bienvenue n'est proposée qu'une fois par session de navigation. */
const CLE_PROPOSE = "iar-accueil-propose";
export function accueilDejaPropose(): boolean {
  try {
    return sessionStorage.getItem(CLE_PROPOSE) === "1";
  } catch {
    return false;
  }
}
export function noterAccueilPropose() {
  try {
    sessionStorage.setItem(CLE_PROPOSE, "1");
  } catch {
    /* stockage indisponible : la redirection reste limitée aux comptes qui n'ont pas vu l'accueil */
  }
}
