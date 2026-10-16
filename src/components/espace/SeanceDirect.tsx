import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { presentationDe } from "@/lib/seance-direct";
import { getSupabase } from "@/lib/supabase";

/** Séances en cours visibles par l'utilisateur (RLS : ses groupes), tenues à jour par Realtime. */
export function useSeancesEnCours(cle: string) {
  const qc = useQueryClient();
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const canal = sb
      .channel(`seances-en-cours-${cle}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "seances_direct" }, () => {
        void qc.invalidateQueries({ queryKey: ["seances-en-cours", cle] });
      })
      .subscribe();
    return () => void sb.removeChannel(canal);
  }, [qc, cle]);

  return useQuery({
    queryKey: ["seances-en-cours", cle],
    queryFn: async () => {
      const { data, error } = await getSupabase()!
        .from("seances_direct")
        .select("*, groupe:groupes(nom)")
        .eq("statut", "en_cours")
        .order("debut_le", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

/** Mon espace : bandeau « Séance en direct » quand une séance d'un groupe de l'apprenant est en cours. */
export function BandeauSeanceDirect({ userId }: { userId: string }) {
  const seances = useSeancesEnCours(`apprenant-${userId}`);
  // Les séances que l'on anime soi-même (compte formateur) ne s'affichent pas ici.
  const liste = (seances.data ?? []).filter((s) => s.formateur_id !== userId);
  if (liste.length === 0) return null;
  return (
    <div className="space-y-3">
      {liste.map((s) => (
        <Link
          key={s.id}
          to="/seance/$id"
          params={{ id: s.id }}
          className="animate-rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-destructive/30 bg-tint-rose px-5 py-4 text-tint-rose-fg shadow-card transition hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
            </span>
            <span>
              <span className="font-bold">Séance en direct : {presentationDe(s).titre}</span>
              {s.groupe?.nom && <span className="block text-sm opacity-80">{s.groupe.nom}</span>}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
            Rejoindre <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

