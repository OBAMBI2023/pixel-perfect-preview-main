import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Bot, ChartLine, ChevronRight, Download, Lightbulb, Network, Sparkles, X, ZoomIn, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChapitreInteractif, NavigationLecons } from "@/components/chapitres/ChapitreInteractif";
import { QuizChapitre } from "@/components/QuizChapitre";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { chapitreComprendreIA, type Branche, type Chapitre } from "@/data/chapitre-2-4";
import { chapitreInteractif, COURS_CHAPITRES, voisins } from "@/data/chapitres";
import type { ChapitreInteractif as ChapitreInteractifJson } from "@/data/chapitres.types";
import { getFormationModule, type FormationModule } from "@/lib/content";

type Donnees =
  | { genre: "manuel"; module: FormationModule; chapitre: Chapitre } // page faite à la main (2.4)
  | { genre: "lecon"; module: FormationModule; lecon: ChapitreInteractifJson } // leçon du JSON
  | { genre: "bientot"; module: FormationModule; id: string }
  | null; // module inconnu

// `formations_` et `$slug_` : route sœur des pages module, l'URL reste /formations/$slug/chapitres/$chapitre.
// 2-4 garde sa page faite à la main ; les autres leçons viennent du JSON ; un id inconnu affiche « arrive bientôt ».
export const Route = createFileRoute("/formations_/$slug_/chapitres/$chapitre")({
  loader: ({ params }): Donnees => {
    const module = getFormationModule(params.slug);
    if (!module) return null;
    const manuel = chapitreComprendreIA(params.chapitre);
    if (manuel && manuel.cours === module.slug) return { genre: "manuel", module, chapitre: manuel };
    const lecon = module.slug === COURS_CHAPITRES ? chapitreInteractif(params.chapitre) : undefined;
    return lecon ? { genre: "lecon", module, lecon } : { genre: "bientot", module, id: params.chapitre };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Chapitre introuvable — IA et la Recherche" }] };
    if (loaderData.genre === "bientot") return { meta: [{ title: `Chapitre à venir — ${loaderData.module.title} — IA et la Recherche` }] };
    const { module } = loaderData;
    const { numero, titre } = loaderData.genre === "manuel" ? loaderData.chapitre : loaderData.lecon;
    const description = loaderData.genre === "manuel" ? loaderData.chapitre.introduction : loaderData.lecon.enBref;
    const title = `${numero} ${titre} — ${module.title} — IA et la Recherche`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PageChapitre,
});

const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90";
const btnSecondary = "inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90";

function PageChapitre() {
  const data = Route.useLoaderData();
  if (!data) return <ChapitreIntrouvable />;
  if (data.genre === "lecon") return <ChapitreInteractif chapitre={data.lecon} />;
  if (data.genre === "bientot") return <ArriveBientot module={data.module} />;
  return <Page24 module={data.module} chapitre={data.chapitre} />;
}

/** Page faite à la main du chapitre 2.4 (inchangée, navigation calculée à partir de `ordre`). */
function Page24({ module, chapitre }: { module: FormationModule; chapitre: Chapitre }) {
  const { precedent, suivant } = voisins("2-4");
  return (
    <SiteLayout>
      <PageHero badge={`${module.title} · Chapitre ${chapitre.numero}`} title={chapitre.titre} description={chapitre.introduction} />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/formations" className="hover:text-primary hover:underline">Formations</Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <Link to="/formations/$slug" params={{ slug: module.slug }} className="hover:text-primary hover:underline">{module.title}</Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span aria-current="page" className="font-medium text-navy">Chapitre {chapitre.numero}</span>
        </nav>

        <Infographie chapitre={chapitre} />

        <section aria-labelledby="branches-titre">
          <h2 id="branches-titre" className="text-2xl font-bold text-navy">Les quatre branches, une par une</h2>
          <p className="mt-1 text-muted-foreground">De la plus large à la plus spécialisée : chaque branche est incluse dans la précédente.</p>
          <ol className="mt-5 grid gap-5 md:grid-cols-2">
            {chapitre.branches.map((b, i) => <CarteBranche key={b.numero} branche={b} niveau={i} />)}
          </ol>
        </section>

        <section aria-labelledby="retenir-titre" className="rounded-2xl bg-tint-green p-5 text-tint-green-fg shadow-card md:p-7">
          <h2 id="retenir-titre" className="flex items-center gap-2 text-xl font-bold"><Lightbulb className="h-5 w-5" /> À retenir</h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {chapitre.aRetenir.map((r) => (
              <li key={r} className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />{r}</li>
            ))}
          </ul>
        </section>

        <QuizChapitre ids={chapitre.quiz} titre="Mini-quiz : as-tu bien compris ?" chapitreId="2-4" ancreRevision={{ id: "branches-titre", libelle: "les quatre branches" }} />

        <NavigationLecons precedent={precedent} suivant={suivant} categorie="fondements" />
      </div>
    </SiteLayout>
  );
}

/* ───────────────────────── Infographie ───────────────────────── */

function Infographie({ chapitre }: { chapitre: Chapitre }) {
  const img = chapitre.infographie;
  const telecharger = (
    <a href={img.telechargement} download={img.nomFichier} className={btnSecondary}>
      <Download className="h-4 w-4" /> Télécharger l'infographie <span className="font-normal opacity-80">(PNG)</span>
    </a>
  );

  return (
    <section aria-labelledby="infographie-titre" className="rounded-2xl bg-card p-5 shadow-card md:p-7">
      <h2 id="infographie-titre" className="text-xl font-bold text-navy">{img.titreSection}</h2>
      <figure className="mt-4">
        <VueAgrandie chapitre={chapitre} telecharger={telecharger}>
          <button
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-border bg-white transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Agrandir l'infographie"
          >
            <img src={img.src} alt={img.alt} width={img.largeur} height={img.hauteur} decoding="async" className="h-auto w-full object-contain" />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-semibold text-navy-foreground" aria-hidden="true">
              <ZoomIn className="h-4 w-4" /> Agrandir
            </span>
          </button>
        </VueAgrandie>
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">{img.legende}</figcaption>
      </figure>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <VueAgrandie chapitre={chapitre} telecharger={telecharger}>
          <button className={btnPrimary}><ZoomIn className="h-4 w-4" /> Voir en grand</button>
        </VueAgrandie>
        {telecharger}
      </div>
    </section>
  );
}

/** Infographie en grand dans une fenêtre ; sur téléphone, l'image garde 720 px de large et défile. */
function VueAgrandie({ chapitre, telecharger, children }: { chapitre: Chapitre; telecharger: ReactNode; children: ReactNode }) {
  const img = chapitre.infographie;
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Le bouton de fermeture par défaut (libellé anglais, petite cible) est remplacé par « Fermer ». */}
      <DialogContent className="max-h-[95vh] w-[min(96vw,1500px)] max-w-none gap-3 overflow-auto p-3 sm:p-4 [&>button:last-child]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle className="text-base text-navy sm:text-lg">{img.titreSection}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">{img.legende}</DialogDescription>
          </div>
          <DialogClose className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted hover:bg-secondary" aria-label="Fermer">
            <X className="h-5 w-5" />
          </DialogClose>
        </div>
        <div className="overflow-x-auto rounded-lg bg-white">
          <img src={img.src} alt={img.alt} width={img.largeur} height={img.hauteur} decoding="async" className="h-auto w-full min-w-[720px] object-contain sm:min-w-0" />
        </div>
        <div className="flex justify-end">{telecharger}</div>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Branches ───────────────────────── */

const STYLE_BRANCHE: Record<Branche["icone"], { icone: LucideIcon; teinte: string; bord: string }> = {
  ia: { icone: Bot, teinte: "bg-tint-blue text-tint-blue-fg", bord: "border-t-tint-blue-fg/40" },
  automatique: { icone: ChartLine, teinte: "bg-tint-purple text-tint-purple-fg", bord: "border-t-tint-purple-fg/40" },
  profond: { icone: Network, teinte: "bg-tint-green text-tint-green-fg", bord: "border-t-tint-green-fg/40" },
  generative: { icone: Sparkles, teinte: "bg-tint-amber text-tint-amber-fg", bord: "border-t-tint-amber-fg/40" },
};

function CarteBranche({ branche: b, niveau }: { branche: Branche; niveau: number }) {
  const { icone: Icone, teinte, bord } = STYLE_BRANCHE[b.icone];
  return (
    <li className={`flex flex-col rounded-2xl border-t-4 bg-card p-5 shadow-card md:p-6 ${bord}`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${teinte}`}><Icone className="h-6 w-6" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {b.numero}{niveau > 0 && <span className="text-muted-foreground"> · incluse dans la branche précédente</span>}
          </p>
          <h3 className="mt-0.5 text-lg font-bold leading-snug text-navy">
            {b.titre}
            {b.enAnglais && <span className="font-medium text-muted-foreground"> ({b.enAnglais})</span>}
          </h3>
        </div>
      </div>
      <p className="mt-4 leading-relaxed">{b.definition}</p>
      {b.contenus && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Contenus produits">
          {b.contenus.map((c) => <li key={c} className={`rounded-full px-3 py-1 text-sm font-medium ${teinte}`}>{c}</li>)}
        </ul>
      )}
      {b.outils && <p className="mt-3 text-sm text-muted-foreground">{b.outils}</p>}
      <div className="mt-auto pt-4">
        <h4 className="text-sm font-semibold text-navy">Exemples concrets</h4>
        <ul className="mt-2 space-y-1.5 text-sm leading-snug">
          {b.exemples.map((e) => (
            <li key={e} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{e}</li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* ───────────────────────── Navigation ───────────────────────── */

/** Leçon pas encore disponible en ligne : renvoi vers le support PDF et la liste des leçons. */
function ArriveBientot({ module }: { module: FormationModule }) {
  return (
    <SiteLayout>
      <PageHero badge={module.title} title="Ce chapitre arrive bientôt" description="Cette leçon n'est pas encore disponible en version interactive. Son contenu est déjà dans le support de cours." />
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-12 sm:flex-row md:px-8">
        <a href={module.pdfUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
          <BookOpen className="h-4 w-4" /> Lire le support PDF <span className="sr-only">(nouvel onglet)</span>
        </a>
        <Link to="/formations/$slug" params={{ slug: module.slug }} hash="chapitres-interactifs" className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" /> Toutes les leçons
        </Link>
      </div>
    </SiteLayout>
  );
}

function ChapitreIntrouvable() {
  return (
    <SiteLayout>
      <PageHero badge="Formations" title="Chapitre introuvable" description="Ce chapitre n'existe pas ou n'est pas encore disponible en ligne." />
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <Link to="/formations" className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" /> Retour aux formations
        </Link>
      </div>
    </SiteLayout>
  );
}
