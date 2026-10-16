import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import type { ExerciceARendre } from "@/data/exercices-a-rendre";
import { etatCopie, formatNote } from "@/lib/soumissions";
import { titreCategorie } from "@/lib/progression";
import { CATEGORIES, NIVEAUX } from "@/lib/qcm-comprendre-ia";
import type { Soumission } from "@/lib/supabase";

const niveauBadge: Record<string, string> = { green: "bg-tint-green text-tint-green-fg", orange: "bg-tint-amber text-tint-amber-fg", red: "bg-tint-rose text-tint-rose-fg" };

/** Badge d'état d'une copie : Non rendu / En attente / Corrigé : x/y / À refaire. */
export function BadgeCopie({ copie, className = "" }: { copie: Pick<Soumission, "statut" | "note" | "note_sur"> | null | undefined; className?: string }) {
  const { texte, classe } = etatCopie(copie);
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${classe} ${className}`}>{texte}</span>;
}

/** Niveau, catégorie et chapitre d'un exercice à rendre. */
export function BadgesExercice({ exo }: { exo: ExerciceARendre }) {
  const niveau = NIVEAUX.find((n) => n.id === exo.niveau);
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground">À rendre</span>
      <span className={`rounded-full px-2.5 py-0.5 ${niveauBadge[niveau?.couleur ?? ""] ?? "bg-muted"}`}>{niveau?.label ?? exo.niveau}</span>
      <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">{titreCategorie(exo.categorie)}</span>
      <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">Chapitre {exo.chapitre}</span>
    </span>
  );
}

/** Barème de l'exercice ; avec `note`, le total obtenu (seule la note globale est enregistrée). */
export function Bareme({ exo, note }: { exo: ExerciceARendre; note?: number | null }) {
  return (
    <div>
      <ul className="divide-y text-sm">
        {exo.bareme.map((c) => (
          <li key={c.critere} className="flex items-baseline justify-between gap-4 py-2">
            <span>{c.critere}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatNote(c.points)} pt{c.points > 1 ? "s" : ""}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t-2 border-navy pt-2 font-semibold text-navy">
        <span>Total</span>
        <span className="tabular-nums">{note === undefined ? "" : `${formatNote(note ?? null)} / `}{formatNote(exo.noteSur)}</span>
      </div>
    </div>
  );
}

export function LienChapitre({ exo }: { exo: ExerciceARendre }) {
  const cours = CATEGORIES.find((c) => c.id === exo.categorie)?.cours ?? "comprendre-ia";
  return (
    <Link to="/formations/$slug" params={{ slug: cours }} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
      <BookOpen className="h-4 w-4" /> Revoir le chapitre {exo.chapitre}
    </Link>
  );
}
