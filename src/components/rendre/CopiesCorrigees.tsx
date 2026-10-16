import { Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck2 } from "lucide-react";
import { formatDate } from "@/components/espace/styles";
import { Carte } from "@/components/espace/ui";
import { BadgeCopie } from "@/components/rendre/communs";
import { exerciceARendre } from "@/data/exercices-a-rendre";
import { useMesSoumissions } from "@/lib/soumissions";

/** Mon espace : copies corrigées ou à refaire, « Nouveau » tant que la correction n'a pas été ouverte. */
export function CopiesCorrigees({ userId }: { userId: string }) {
  const copies = useMesSoumissions(userId);
  const corrigees = (copies.data ?? [])
    .filter((c) => c.statut !== "soumis")
    .sort((a, b) => (b.corrige_le ?? "").localeCompare(a.corrige_le ?? ""));
  if (corrigees.length === 0) return null;
  const nouvelles = corrigees.filter((c) => !c.consulte_le).length;

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-primary" /> Mes copies corrigées</span>}
      action={nouvelles > 0 ? <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{nouvelles} nouvelle{nouvelles > 1 ? "s" : ""}</span> : undefined}
    >
      <ul className="divide-y">
        {corrigees.map((c) => (
          <li key={c.id}>
            <Link to="/exercices/a-rendre/$id" params={{ id: c.exercice_id }} className="group flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-medium text-navy">
                  {exerciceARendre(c.exercice_id)?.titre ?? c.exercice_id}
                  {!c.consulte_le && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Nouveau</span>}
                </span>
                <span className="text-xs text-muted-foreground">Corrigée le {formatDate(c.corrige_le)}</span>
              </span>
              <span className="flex items-center gap-3">
                <BadgeCopie copie={c} />
                <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Carte>
  );
}
