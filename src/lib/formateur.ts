import { useQuery, type QueryClient } from "@tanstack/react-query";
import { getSupabase, type Database } from "@/lib/supabase";

export type Fn = Database["public"]["Functions"];
export type Filtres = { p_groupe: string; p_debut?: string; p_niveau?: string };

/** Lance une RPC et renvoie ses lignes (ou lève l'erreur pour React Query). */
export async function rpc<K extends keyof Fn>(nom: K, args: Fn[K]["Args"]): Promise<Fn[K]["Returns"]> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase non configuré");
  // Le typage générique de .rpc() ne suit pas une clé variable : on le reprend ici.
  const { data, error } = await (sb.rpc as unknown as (n: K, a: Fn[K]["Args"]) => Promise<{ data: Fn[K]["Returns"]; error: { message: string } | null }>)(nom, args);
  if (error) throw new Error(error.message);
  return data;
}

export function useMembres(groupeId: string) {
  return useQuery({
    queryKey: ["membres", groupeId],
    queryFn: async () => {
      const { data, error } = await getSupabase()!
        .from("membres_groupe")
        .select("apprenant_id, joined_at, profil:profiles(nom_complet)")
        .eq("groupe_id", groupeId)
        .order("joined_at");
      if (error) throw error;
      return data;
    },
  });
}

/** Recharge toutes les requêtes qui portent sur ce groupe (membres, statistiques, devoirs…). */
export const invaliderGroupe = (qc: QueryClient, groupeId: string) =>
  qc.invalidateQueries({ predicate: (q) => JSON.stringify(q.queryKey).includes(groupeId) });

export const PERIODES = [
  { id: "7", label: "7 jours", jours: 7 },
  { id: "30", label: "30 jours", jours: 30 },
  { id: "90", label: "3 mois", jours: 90 },
  { id: "tout", label: "Tout", jours: null },
] as const;
export type PeriodeId = (typeof PERIODES)[number]["id"];

export const estPeriode = (v: unknown): v is PeriodeId => PERIODES.some((p) => p.id === v);

/** Filtres des RPC formateur ; début de période arrondi au jour, pour garder une clé de cache stable. */
export function construireFiltres(groupe: string, periode: PeriodeId, niveau: string): Filtres {
  const jours = PERIODES.find((p) => p.id === periode)?.jours ?? null;
  const debut = jours === null ? null : new Date(new Date().setHours(0, 0, 0, 0) - jours * 86_400_000).toISOString();
  return { p_groupe: groupe, ...(debut && { p_debut: debut }), ...(niveau && { p_niveau: niveau }) };
}

/** Un devoir QCM est « fait » à partir de ce nombre de questions différentes (même valeur que public.seuil_devoir). */
export const SEUIL_DEVOIR_QCM = 5;

/** Un membre est « à relancer » sans tentative depuis ce nombre de jours (ou depuis son arrivée). */
export const JOURS_INACTIVITE = 7;

/** Jours écoulés depuis la dernière tentative (ou l'arrivée dans le groupe), ou null si le membre est actif. */
export function joursInactif(derniereActivite: string | null, arrivee: string, maintenant = Date.now()): number | null {
  const depuis = Math.max(new Date(arrivee).getTime(), derniereActivite ? new Date(derniereActivite).getTime() : 0);
  const jours = Math.floor((maintenant - depuis) / 86_400_000);
  return jours >= JOURS_INACTIVITE ? jours : null;
}

/* ───────── Export CSV ───────── */

const champCsv = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Nom de fichier sans accents ni espaces (ex. « Master 1 — 2026 » → « master-1-2026 »). */
export const slugFichier = (texte: string) =>
  texte.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

/** Télécharge un CSV ; point-virgule et BOM pour une ouverture directe dans Excel en français. */
export function telechargerCsv(nomFichier: string, lignes: unknown[][]) {
  const csv = "﻿" + lignes.map((r) => r.map(champCsv).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  URL.revokeObjectURL(url);
}

/* ───────── Copies à corriger ───────── */

/** Copies des groupes du formateur (la RLS limite aux groupes dont il est formateur), avec le nom de l'apprenant. */
export function useCopiesFormateur(userId: string) {
  return useQuery({
    queryKey: ["copies-formateur", userId],
    queryFn: async () => {
      const { data, error } = await getSupabase()!
        .from("soumissions")
        .select("*, apprenant:profiles!soumissions_apprenant_id_fkey(nom_complet)")
        .neq("apprenant_id", userId)
        .order("soumis_le");
      if (error) throw error;
      return data;
    },
  });
}
export type CopieFormateur = NonNullable<ReturnType<typeof useCopiesFormateur>["data"]>[number];

export const chipClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-muted"}`;
