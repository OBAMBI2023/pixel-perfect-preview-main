import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { tools } from "@/lib/content";

export const Route = createFileRoute("/outils-ia")({
  head: () => ({
    meta: [
      { title: "Outils IA — IA et la Recherche" },
      { name: "description", content: "Sélection d'outils d'IA utiles pour la recherche, avec avantages et limites." },
      { property: "og:title", content: "Outils IA pour la recherche" },
      { property: "og:description", content: "Recherche documentaire, analyse, bibliographie, rédaction et statistiques." },
    ],
  }),
  component: Outils,
});

function Outils() {
  const cats = ["Toutes", ...tools.map((t) => t.category)];
  const [cat, setCat] = useState("Toutes");
  const list = cat === "Toutes" ? tools : tools.filter((t) => t.category === cat);
  return (
    <SiteLayout>
      <PageHero badge="Outils IA" title="Les outils IA pour la recherche" description="Une sélection commentée d'outils, avec leur utilité, leurs avantages et leurs limites." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm font-medium ${c === cat ? "bg-primary text-primary-foreground" : "bg-card shadow-card hover:bg-muted"}`}>{c}</button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <article key={t.name} className="flex flex-col rounded-2xl bg-card p-6 shadow-card">
              <span className="text-xs font-semibold text-primary">{t.category}</span>
              <h3 className="mt-2 text-xl font-bold text-navy">{t.name}</h3>
              <p className="mt-2 text-sm">{t.description}</p>
              <dl className="mt-4 flex-1 space-y-1 text-sm text-muted-foreground">
                <div><dt className="inline font-semibold text-foreground">Utilité : </dt><dd className="inline">{t.use}</dd></div>
                <div><dt className="inline font-semibold text-success">Avantages : </dt><dd className="inline">{t.pros}</dd></div>
                <div><dt className="inline font-semibold text-destructive">Limites : </dt><dd className="inline">{t.cons}</dd></div>
              </dl>
              <a href={t.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Lien officiel <ExternalLink className="h-4 w-4" /></a>
            </article>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
