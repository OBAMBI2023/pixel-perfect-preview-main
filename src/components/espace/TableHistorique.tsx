import { formatDateHeure } from "@/components/espace/styles";
import { infoQuestion, labelNiveau, titreCategorie } from "@/lib/progression";

export function TableHistorique({ lignes }: { lignes: { id: string; type: string; categorie: string | null; niveau: string | null; score: number; total: number; created_at: string; reponses: { question_id: string }[] }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Question / exercice</th><th className="py-2 pr-3">Catégorie</th><th className="py-2 pr-3">Niveau</th><th className="py-2 text-right">Score</th></tr>
        </thead>
        <tbody className="divide-y">
          {lignes.map((t) => {
            const info = t.reponses[0] ? infoQuestion(t.reponses[0].question_id) : undefined;
            const reussi = t.score === t.total;
            return (
              <tr key={t.id}>
                <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">{formatDateHeure(t.created_at)}</td>
                <td className="py-2.5 pr-3"><span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{info?.genre ?? (t.type === "qcm" ? "QCM" : "Exercice")}</span>{info?.enonce ?? "—"}</td>
                <td className="py-2.5 pr-3">{titreCategorie(t.categorie)}</td>
                <td className="py-2.5 pr-3">{labelNiveau(t.niveau)}</td>
                <td className={`whitespace-nowrap py-2.5 text-right font-semibold tabular-nums ${reussi ? "text-success" : "text-destructive"}`}>{t.score} / {t.total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
