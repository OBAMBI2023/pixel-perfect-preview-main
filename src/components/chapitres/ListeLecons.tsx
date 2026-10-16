import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { COURS_CHAPITRES, resumesChapitres, TITRES_GROUPES } from "@/data/chapitres";
import { useProgressionChapitres } from "@/lib/progression-chapitres";
import { titreCategorie } from "@/lib/progression";

/** Page du module : toutes les leçons interactives, groupées par chapitre du manuel, dans l'ordre du cours. */
export function ListeLecons() {
  const etats = useProgressionChapitres();
  const groupes = [...new Set(resumesChapitres.map((r) => r.groupe))];
  const terminees = resumesChapitres.filter((r) => etats[r.id]?.termine).length;

  return (
    <section id="chapitres-interactifs" aria-labelledby="chapitres-interactifs-titre" className="mt-8 scroll-mt-24 rounded-2xl bg-card p-5 shadow-card md:p-7">
      <h2 id="chapitres-interactifs-titre" className="flex items-center gap-2 text-xl font-bold text-navy">
        <BookOpen className="h-5 w-5 text-primary" /> Chapitres interactifs
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Infographie, explications, exemples et mini-quiz corrigé, leçon par leçon.</p>
      <p className="mt-2 text-sm font-medium text-navy">
        {terminees} leçon{terminees > 1 ? "s" : ""} terminée{terminees > 1 ? "s" : ""} sur {resumesChapitres.length}
      </p>

      <div className="mt-5 space-y-6">
        {groupes.map((g) => (
          <div key={g}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Chapitre {g} · {TITRES_GROUPES[g] ?? ""}
            </h3>
            <ul className="mt-2 grid gap-2.5 md:grid-cols-2">
              {resumesChapitres.filter((r) => r.groupe === g).map((r) => {
                const etat = etats[r.id];
                return (
                  <li key={r.id}>
                    <Link
                      to="/formations/$slug/chapitres/$chapitre"
                      params={{ slug: COURS_CHAPITRES, chapitre: r.id }}
                      className="group flex min-h-16 items-center justify-between gap-3 rounded-xl border-2 border-border p-3.5 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
                          <span className="text-primary">{r.numero}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{titreCategorie(r.categorie)}</span>
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" aria-hidden="true" /> {r.dureeMin} min</span>
                        </span>
                        <span className="mt-0.5 block font-semibold leading-snug text-navy">{r.titre}</span>
                        {etat && (
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {etat.termine && <span className="rounded-full bg-tint-green px-2 py-0.5 font-semibold text-tint-green-fg">Terminé ✓</span>}
                            <span className="text-muted-foreground">Meilleur score : {etat.meilleur} / {etat.total}</span>
                          </span>
                        )}
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
