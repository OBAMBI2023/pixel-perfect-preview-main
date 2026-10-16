import { useQuery } from "@tanstack/react-query";
import { getSupabase, type Soumission, type StatutSoumission } from "@/lib/supabase";

/** Nombre de mots d'une réponse (suites de caractères séparées par des espaces). */
export const compterMots = (texte: string) => (texte.trim().match(/\S+/g) ?? []).length;

export const LIBELLES_STATUT: Record<StatutSoumission, string> = {
  soumis: "En attente de correction",
  corrige: "Corrigé",
  a_refaire: "À refaire",
};

/** Libellé et couleur du badge d'une copie (« Non rendu » sans copie). */
export function etatCopie(s: Pick<Soumission, "statut" | "note" | "note_sur"> | null | undefined): { texte: string; classe: string } {
  if (!s) return { texte: "Non rendu", classe: "bg-muted text-muted-foreground" };
  if (s.statut === "corrige") return { texte: `Corrigé : ${formatNote(s.note)}/${formatNote(s.note_sur)}`, classe: "bg-tint-green text-tint-green-fg" };
  if (s.statut === "a_refaire") return { texte: "À refaire", classe: "bg-tint-rose text-tint-rose-fg" };
  return { texte: "En attente de correction", classe: "bg-tint-amber text-tint-amber-fg" };
}

export const formatNote = (n: number | null) => (n === null ? "—" : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 }));

/** Copie la plus récente parmi celles d'un exercice (un apprenant peut en avoir une par groupe). */
export const derniereCopie = (copies: Soumission[], exerciceId: string) =>
  copies.filter((c) => c.exercice_id === exerciceId).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

/* ───────── Brouillons (navigateur) ───────── */

const cleBrouillon = (exerciceId: string, groupeId: string) => `iar-brouillon-${exerciceId}-${groupeId}`;

export function lireBrouillon(exerciceId: string, groupeId: string): string | null {
  try { return localStorage.getItem(cleBrouillon(exerciceId, groupeId)); } catch { return null; }
}
export function ecrireBrouillon(exerciceId: string, groupeId: string, texte: string) {
  try { localStorage.setItem(cleBrouillon(exerciceId, groupeId), texte); } catch { /* stockage indisponible : pas de brouillon */ }
}
export function effacerBrouillon(exerciceId: string, groupeId: string) {
  try { localStorage.removeItem(cleBrouillon(exerciceId, groupeId)); } catch { /* ignore */ }
}

/* ───────── Requêtes apprenant ───────── */

export function useMesSoumissions(userId: string | undefined) {
  return useQuery({
    queryKey: ["mes-soumissions", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("soumissions").select("*").eq("apprenant_id", userId!).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Groupes de l'apprenant (même clé que « Mon espace »). */
export function useMesGroupes(userId: string | undefined) {
  return useQuery({
    queryKey: ["mes-groupes", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await getSupabase()!
        .from("membres_groupe")
        .select("joined_at, groupe:groupes(id, nom, archive_le)")
        .eq("apprenant_id", userId!)
        .order("joined_at");
      if (error) throw error;
      return data;
    },
  });
}
