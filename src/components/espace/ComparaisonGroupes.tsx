import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { formatPct } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { chipClass, construireFiltres, PERIODES, rpc, type PeriodeId } from "@/lib/formateur";
import { CATEGORIES } from "@/lib/qcm-comprendre-ia";
import type { Groupe } from "@/lib/supabase";

/** Score moyen et réussite par catégorie, côte à côte pour chaque groupe actif. */
export function ComparaisonGroupes({ groupes }: { groupes: Groupe[] }) {
  const [periode, setPeriode] = useState<PeriodeId>("tout");
  const filtres = groupes.map((g) => construireFiltres(g.id, periode, ""));
  // Mêmes clés que le tableau de bord du groupe : le cache est partagé.
  const stats = useQueries({ queries: filtres.map((f) => ({ queryKey: ["stats_groupe", f], queryFn: () => rpc("stats_groupe", f) })) });
  const categories = useQueries({ queries: filtres.map((f) => ({ queryKey: ["reussite_par_categorie", f], queryFn: () => rpc("reussite_par_categorie", f) })) });
  const erreur = [...stats, ...categories].find((q) => q.error)?.error;
  const tauxCategorie = (i: number, cat: string) => categories[i]?.data?.find((c) => c.categorie === cat);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PERIODES.map((p) => <button key={p.id} onClick={() => setPeriode(p.id)} className={chipClass(p.id === periode)}>{p.label}</button>)}
      </div>
      {erreur && <Message ton="erreur">Impossible de charger la comparaison : {erreur.message}</Message>}
      <Carte titre="Comparer les groupes">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: `${220 + groupes.length * 140}px` }}>
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-xs uppercase text-muted-foreground">Indicateur</th>
                {groupes.map((g) => <th key={g.id} scope="col" className="py-2 pr-4 text-right font-semibold text-navy">{g.nom}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <th scope="row" className="py-2.5 pr-4 font-medium">Membres</th>
                {groupes.map((g, i) => <td key={g.id} className="py-2.5 pr-4 text-right tabular-nums">{stats[i]?.data?.[0]?.nb_membres ?? "—"}</td>)}
              </tr>
              <tr>
                <th scope="row" className="py-2.5 pr-4 font-medium">Tentatives</th>
                {groupes.map((g, i) => <td key={g.id} className="py-2.5 pr-4 text-right tabular-nums">{stats[i]?.data?.[0]?.nb_tentatives ?? "—"}</td>)}
              </tr>
              <tr className="bg-muted/60">
                <th scope="row" className="py-2.5 pr-4 font-bold text-navy">Score moyen</th>
                {groupes.map((g, i) => <td key={g.id} className="py-2.5 pr-4 text-right font-display text-lg font-bold tabular-nums text-navy">{formatPct(stats[i]?.data?.[0]?.score_moyen)}</td>)}
              </tr>
              <tr><th colSpan={groupes.length + 1} className="pb-1 pt-5 text-xs uppercase text-muted-foreground">Réussite par catégorie</th></tr>
              {CATEGORIES.map((c) => (
                <tr key={c.id}>
                  <th scope="row" className="py-2.5 pr-4 font-medium">{c.titre}</th>
                  {groupes.map((g, i) => {
                    const t = tauxCategorie(i, c.id);
                    return (
                      <td key={g.id} className="py-2.5 pr-4 text-right" title={t ? `${t.nb_tentatives} tentative(s)` : "Aucune tentative"}>
                        <span className="tabular-nums">{formatPct(t?.taux_reussite)}</span>
                        <div className="ml-auto mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted" role="presentation">
                          {t && <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, Number(t.taux_reussite)))}%` }} />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </div>
  );
}
