import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { slidesComprendreIA, type Slide } from "@/data/slides-comprendre-ia";
import { getSupabase, type SeanceDirect } from "@/lib/supabase";

/** Présentations jouables en direct (clé = colonne seances_direct.presentation). */
export const PRESENTATIONS_DIRECT: Record<string, { titre: string; slides: Slide[]; pdfUrl: string; cours: string }> = {
  "comprendre-ia": { titre: "L'IA et la recherche", slides: slidesComprendreIA, pdfUrl: "/pdfs/comprendre-ia.pdf", cours: "comprendre-ia" },
};

export const presentationDe = (s: Pick<SeanceDirect, "presentation">) => PRESENTATIONS_DIRECT[s.presentation] ?? PRESENTATIONS_DIRECT["comprendre-ia"]!;

export const cleSeance = (id: string) => ["seance-direct", id] as const;
export const cleReactions = (id: string) => ["reactions-seance", id] as const;

/** La séance (null si introuvable ou non visible : RLS). Rafraîchie aussi par le canal Realtime. */
export function useSeance(id: string) {
  return useQuery({
    queryKey: cleSeance(id),
    queryFn: async () => {
      const { data, error } = await getSupabase()!.from("seances_direct").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    // Filet de sécurité si un événement Realtime est perdu (le canal reste la source principale).
    refetchInterval: 30_000,
  });
}

export type EtatConnexion = "connexion" | "connecte" | "reconnexion";

/**
 * Canal Realtime de la séance : mises à jour de la séance (diapositive, question, fin),
 * nouvelles réactions (formateur) et présence. Après une coupure, tout est rechargé.
 */
export function useCanalSeance({ seanceId, userId, role }: { seanceId: string; userId: string; role: "formateur" | "apprenant" }) {
  const qc = useQueryClient();
  const [etat, setEtat] = useState<EtatConnexion>("connexion");
  const [presents, setPresents] = useState(0);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let coupe = false;
    const resynchroniser = () => {
      void qc.invalidateQueries({ queryKey: cleSeance(seanceId) });
      void qc.invalidateQueries({ queryKey: cleReactions(seanceId) });
    };

    const canal = sb.channel(`seance-${seanceId}`, { config: { presence: { key: userId } } });
    canal
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "seances_direct", filter: `id=eq.${seanceId}` }, (p) => {
        qc.setQueryData(cleSeance(seanceId), p.new as SeanceDirect);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions_seance", filter: `seance_id=eq.${seanceId}` }, () => {
        void qc.invalidateQueries({ queryKey: cleReactions(seanceId) });
      })
      .on("presence", { event: "sync" }, () => {
        const etatPresence = canal.presenceState<{ role: string }>();
        setPresents(Object.values(etatPresence).filter((l) => l.some((p) => p.role === "apprenant")).length);
      })
      .subscribe((statut) => {
        if (statut === "SUBSCRIBED") {
          setEtat("connecte");
          void canal.track({ role });
          if (coupe) resynchroniser();
          coupe = false;
        } else if (statut === "CHANNEL_ERROR" || statut === "TIMED_OUT" || statut === "CLOSED") {
          coupe = true;
          setEtat("reconnexion");
        }
      });

    const horsLigne = () => {
      coupe = true;
      setEtat("reconnexion");
    };
    const enLigne = () => resynchroniser();
    // Téléphone mis en veille : au retour, on recharge la diapositive en cours.
    const visible = () => {
      if (document.visibilityState === "visible") resynchroniser();
    };
    window.addEventListener("offline", horsLigne);
    window.addEventListener("online", enLigne);
    document.addEventListener("visibilitychange", visible);

    return () => {
      window.removeEventListener("offline", horsLigne);
      window.removeEventListener("online", enLigne);
      document.removeEventListener("visibilitychange", visible);
      void sb.removeChannel(canal);
    };
  }, [qc, seanceId, userId, role]);

  return { etat, presents };
}

/** Durée écoulée depuis `debut` au format m:ss ou h:mm:ss. */
export function formatDuree(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Heure courante rafraîchie chaque seconde (chronomètres). */
export function useMaintenant(actif = true) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (!actif) return;
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, [actif]);
  return maintenant;
}
