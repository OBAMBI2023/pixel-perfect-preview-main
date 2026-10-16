import { CheckCircle2, MessageSquare, RotateCcw, ThumbsUp, TrendingUp } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatDate } from "@/components/espace/styles";
import { useMarquerRetourConsulte } from "@/lib/suivi";
import type { RetourFormateur } from "@/lib/supabase";

const fmtNote = (n: number) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/** Points acquis / à améliorer signalés par le formateur (copies et retours). */
export function PointsRetour({ acquis, ameliorer }: { acquis: string | null; ameliorer: string | null }) {
  if (!acquis && !ameliorer) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {acquis && (
        <div className="rounded-xl bg-tint-green/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-tint-green-fg"><ThumbsUp className="h-4 w-4" /> Points acquis</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{acquis}</p>
        </div>
      )}
      {ameliorer && (
        <div className="rounded-xl bg-tint-amber/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-tint-amber-fg"><TrendingUp className="h-4 w-4" /> Points à améliorer</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{ameliorer}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Retour du formateur sur un exercice personnalisé ou une analyse d'article, vu par l'apprenant.
 * `perime` : le travail a été modifié après le retour (le formateur ne l'a pas encore relu).
 * À l'affichage, le retour est marqué comme lu.
 */
export function CarteRetour({ userId, retour, perime = false }: { userId: string; retour: RetourFormateur; perime?: boolean }) {
  const marquer = useMarquerRetourConsulte(userId);
  const fait = useRef(false);
  useEffect(() => {
    if (retour.consulte_le || fait.current) return;
    fait.current = true;
    marquer.mutate(retour.id);
  }, [retour.id, retour.consulte_le, marquer]);

  const corrige = retour.statut === "corrige";
  return (
    <div className={`rounded-2xl border-2 p-4 ${corrige ? "border-tint-green" : "border-tint-rose"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-navy">
          {corrige ? <CheckCircle2 className="h-5 w-5 text-success" /> : <RotateCcw className="h-5 w-5 text-tint-rose-fg" />}
          {corrige ? "Corrigé par ton formateur" : "Ton formateur te demande de reprendre ce travail"}
          {!retour.consulte_le && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Nouveau</span>}
        </p>
        <span className="text-xs text-muted-foreground">le {formatDate(retour.updated_at)}</span>
      </div>
      {retour.note !== null && retour.note_sur !== null && (
        <p className="mt-2 font-display text-2xl font-bold text-navy">{fmtNote(retour.note)}<span className="text-base text-muted-foreground"> / {fmtNote(retour.note_sur)}</span></p>
      )}
      {retour.appreciation && (
        <div className="mt-3 rounded-xl bg-muted p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><MessageSquare className="h-4 w-4" /> Appréciation</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{retour.appreciation}</p>
        </div>
      )}
      <PointsRetour acquis={retour.points_acquis} ameliorer={retour.points_a_ameliorer} />
      {perime && <p className="mt-3 text-xs text-muted-foreground">Tu as modifié ce travail depuis ce retour : ton formateur verra ta nouvelle version.</p>}
    </div>
  );
}
