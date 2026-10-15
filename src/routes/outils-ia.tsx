import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, Compass, ExternalLink, FileSearch, HeartPulse, ShieldCheck, Wrench } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { autresOutils, comparatif, outilsRecherche, TYPES_OUTIL, type OutilRecherche, type TypeOutil } from "@/data/outils-recherche";

export const Route = createFileRoute("/outils-ia")({
  head: () => ({
    meta: [
      { title: "Outils IA — IA et la Recherche" },
      { name: "description", content: "Choisir le bon outil de recherche selon l'étape : moteurs académiques, bases spécialisées et outils d'IA, avec leurs avantages et leurs limites." },
      { property: "og:title", content: "Outils de recherche et outils IA" },
      { property: "og:description", content: "Google Scholar, PubMed, NotebookLM, Semantic Scholar, Elicit… avantages, limites et bon usage." },
    ],
  }),
  component: Outils,
});

const badgeType: Record<TypeOutil, string> = {
  moteur: "bg-tint-blue text-tint-blue-fg",
  base: "bg-tint-purple text-tint-purple-fg",
  ia: "bg-tint-rose text-tint-rose-fg",
};
const labelType = (t: TypeOutil) => TYPES_OUTIL.find((x) => x.id === t)?.badge ?? t;

const raccourcis = [
  { icon: Compass, titre: "Explorer un sujet", ids: ["google-scholar", "semantic-scholar"] },
  { icon: HeartPulse, titre: "Recherche en santé", ids: ["pubmed"] },
  { icon: FileSearch, titre: "Travailler sur mes documents", ids: ["notebooklm"] },
];
const nomOutil = (id: string) => outilsRecherche.find((o) => o.id === id)?.nom ?? id;

function Outils() {
  const [type, setType] = useState<TypeOutil | "tous">("tous");
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const list = type === "tous" ? outilsRecherche : outilsRecherche.filter((o) => o.type === type);

  const basculer = (id: string) => setOuverts((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  // Raccourci : affiche tous les outils, déplie la carte (mobile) et défile jusqu'à elle.
  const allerA = (id: string) => {
    setType("tous");
    setOuverts((s) => new Set(s).add(id));
    requestAnimationFrame(() => document.getElementById(`outil-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <SiteLayout>
      <PageHero badge="Outils IA" title="Les outils pour la recherche" description="Moteurs académiques, bases spécialisées et outils d'IA : leurs avantages, leurs limites et leur bon usage." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h2 className="text-2xl font-bold text-navy">Choisir le bon outil selon l'étape de sa recherche</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {raccourcis.map(({ icon: Icon, titre, ids }) => (
            <div key={titre} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary"><Icon className="h-5 w-5 text-primary" /></span>
                <h3 className="font-bold text-navy">{titre}</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ids.map((id) => (
                  <a key={id} href={`#outil-${id}`} onClick={(e) => { e.preventDefault(); allerA(id); }} className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                    {nomOutil(id)} →
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filtrer par type d'outil">
          {[...TYPES_OUTIL.map((t) => ({ id: t.id as TypeOutil | "tous", label: t.label })), { id: "tous" as const, label: "Tous" }].map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} aria-pressed={t.id === type} className={`rounded-full px-4 py-2 text-sm font-medium transition ${t.id === type ? "bg-primary text-primary-foreground" : "bg-card shadow-card hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {list.map((o) => <CarteOutil key={o.id} outil={o} ouvert={ouverts.has(o.id)} onBasculer={() => basculer(o.id)} />)}
        </div>

        {type === "tous" && (
          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-navy"><Wrench className="h-6 w-6 text-primary" /> Autres outils du chercheur</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gestion bibliographique, rédaction, statistiques et présentation.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {autresOutils.map((t) => (
                <article key={t.name} className="flex flex-col rounded-2xl bg-card p-5 shadow-card">
                  <span className="text-xs font-semibold text-primary">{t.category}</span>
                  <h3 className="mt-1 text-lg font-bold text-navy">{t.name}</h3>
                  <p className="mt-1 text-sm">{t.description}</p>
                  <dl className="mt-3 flex-1 space-y-1 text-sm text-muted-foreground">
                    <div><dt className="inline font-semibold text-foreground">Utilité : </dt><dd className="inline">{t.use}</dd></div>
                    <div><dt className="inline font-semibold text-success">Avantages : </dt><dd className="inline">{t.pros}</dd></div>
                    <div><dt className="inline font-semibold text-tint-amber-fg">Limites : </dt><dd className="inline">{t.cons}</dd></div>
                  </dl>
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ouvrir l'outil <ExternalLink className="h-4 w-4" /></a>
                </article>
              ))}
            </div>
          </section>
        )}

        <details className="group mt-14 rounded-2xl bg-card shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 text-lg font-bold text-navy [&::-webkit-details-marker]:hidden">
            Tableau comparatif
            <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
          </summary>
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Outil</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Gratuit / payant</th>
                  <th className="py-2 pr-3">Discipline</th><th className="py-2 pr-3">Point fort</th><th className="py-2">Principale limite</th>
                </tr>
              </thead>
              <tbody className="divide-y align-top">
                {outilsRecherche.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3 font-semibold text-navy">{o.nom}</td>
                    <td className="py-2.5 pr-3">{labelType(o.type)}</td>
                    <td className="py-2.5 pr-3">{comparatif[o.id]?.acces ?? "—"}</td>
                    <td className="py-2.5 pr-3">{comparatif[o.id]?.discipline ?? "—"}</td>
                    <td className="py-2.5 pr-3">{pointFort(o)}</td>
                    <td className="py-2.5">{o.limites[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <p className="mt-10 flex items-start gap-3 rounded-2xl bg-navy p-5 font-medium text-navy-foreground">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-sky" />
          Quel que soit l'outil, aucune référence n'est retenue tant qu'elle n'a pas été retrouvée et vérifiée à la source.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">Les fonctions et conditions d'accès de ces outils évoluent : vérifiées en octobre 2026.</p>
      </div>
    </SiteLayout>
  );
}

/** Le premier avantage, sauf s'il se résume à « Gratuit » (déjà dans la colonne accès). */
const pointFort = (o: OutilRecherche) => o.avantages.find((a) => a !== "Gratuit") ?? o.avantages[0];

function CarteOutil({ outil: o, ouvert, onBasculer }: { outil: OutilRecherche; ouvert: boolean; onBasculer: () => void }) {
  const detailId = `detail-${o.id}`;
  return (
    <article id={`outil-${o.id}`} className="scroll-mt-24 rounded-2xl bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-navy">{o.nom}</h3>
          <p className="text-sm text-muted-foreground">{o.editeur}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeType[o.type]}`}>{labelType(o.type)}</span>
      </div>
      <p className="mt-3 text-sm">{o.usage}</p>

      {/* Sur mobile, le détail est replié ; toujours visible à partir de md. */}
      <button onClick={onBasculer} aria-expanded={ouvert} aria-controls={detailId} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary md:hidden">
        {ouvert ? "Masquer le détail" : "Voir avantages et limites"} <ChevronDown className={`h-4 w-4 transition ${ouvert ? "rotate-180" : ""}`} />
      </button>

      <div id={detailId} className={`${ouvert ? "block" : "hidden"} md:block`}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-tint-green p-4">
            <h4 className="text-sm font-bold text-tint-green-fg">✅ Avantages</h4>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{o.avantages.map((a) => <li key={a}>{a}</li>)}</ul>
          </div>
          <div className="rounded-xl bg-tint-amber p-4">
            <h4 className="text-sm font-bold text-tint-amber-fg">⚠️ Limites</h4>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{o.limites.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        </div>
        {o.bonUsage && (
          <p className="mt-3 rounded-xl border-2 border-primary/30 bg-secondary/40 p-4 text-sm"><strong className="text-navy">Bon usage : </strong>{o.bonUsage}</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90">
          Ouvrir l'outil <ExternalLink className="h-4 w-4" />
        </a>
        <Link to="/formations/$slug" params={{ slug: "comprendre-ia" }} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <BookOpen className="h-4 w-4" /> Voir le cours : chapitre {o.chapitre}
        </Link>
      </div>
    </article>
  );
}
