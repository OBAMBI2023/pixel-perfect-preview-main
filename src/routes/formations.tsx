import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { courseFeatures, levels } from "@/lib/content";

export const Route = createFileRoute("/formations")({
  head: () => ({
    meta: [
      { title: "Formations — IA et la Recherche" },
      { name: "description", content: "Parcours progressifs, du débutant à l'avancé, pour maîtriser l'IA appliquée à la recherche." },
      { property: "og:title", content: "Parcours de formation — IA et la Recherche" },
      { property: "og:description", content: "Un apprentissage progressif pour maîtriser l'IA appliquée à la recherche." },
    ],
  }),
  component: Formations,
});

function Formations() {
  return (
    <SiteLayout>
      <PageHero badge="Formations" title="Parcours de formation" description="Un apprentissage progressif pour maîtriser l'intelligence artificielle appliquée à la recherche." />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="flex flex-wrap gap-2">
          {courseFeatures.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-card"><CheckCircle2 className="h-4 w-4 text-success" />{f}</span>
          ))}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {levels.map((lvl, i) => (
            <div key={lvl.name} className="rounded-2xl bg-card p-7 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-navy">{lvl.name}</h2>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Niveau {i + 1}</span>
              </div>
              <ul className="mt-5 space-y-3">
                {lvl.courses.map((c) => (
                  <li key={c} className="flex items-start gap-3 rounded-xl bg-muted p-3 text-sm"><PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{c}</li>
                ))}
              </ul>
              <Link to="/exercices" className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground">S'exercer sur ce niveau</Link>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
