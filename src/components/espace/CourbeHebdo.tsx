import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const libelleSemaine = (jour: string) => {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(a ?? 0, (m ?? 1) - 1, j ?? 1).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/**
 * Évolution hebdomadaire : taux de réussite (courbe) et nombre de réponses (barres).
 * Affichée seulement à partir de deux semaines de résultats datés.
 */
export function CourbeHebdo({ serie }: { serie: { semaine: string; taux: number; nb: number }[] }) {
  if (serie.length < 2) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {serie.length === 0 ? "Aucun résultat daté pour l'instant." : "Pas encore assez de résultats datés pour tracer une évolution (au moins deux semaines d'activité)."}
      </p>
    );
  }
  const donnees = serie.map((s) => ({ ...s, libelle: `Sem. du ${libelleSemaine(s.semaine)}` }));
  return (
    <div className="mt-2 h-64 w-full" role="img" aria-label={`Évolution sur ${serie.length} semaines : taux de réussite de ${serie[0]!.taux} % à ${serie[serie.length - 1]!.taux} %`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={donnees} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="libelle" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.replace("Sem. du ", "")} />
          <YAxis yAxisId="taux" domain={[0, 100]} tick={{ fontSize: 11 }} unit=" %" />
          <YAxis yAxisId="nb" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} hide />
          <Tooltip
            formatter={(v: number, nom: string) => (nom === "taux" ? [`${v.toLocaleString("fr-FR")} %`, "Taux de réussite"] : [v, "Réponses"])}
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
          />
          <Bar yAxisId="nb" dataKey="nb" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
          <Line yAxisId="taux" dataKey="taux" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
