import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronRight, Clock, Lightbulb, ListChecks, Printer, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Infographie } from "@/components/chapitres/Infographie";
import { QuizInteractif, type QuestionJouable } from "@/components/QuizChapitre";
import { COURS_CHAPITRES, idQuestion, LIBELLE_NIVEAU, NIVEAU_DB, voisins, type ResumeChapitre } from "@/data/chapitres";
import type { ChapitreInteractif as TypeChapitre } from "@/data/chapitres.types";
import { useProgressionChapitres } from "@/lib/progression-chapitres";
import { titreCategorie } from "@/lib/progression";

const SECTIONS = [
  ["en-bref", "En bref"],
  ["infographie", "Infographie"],
  ["explications", "Explications"],
  ["exemples", "Exemples"],
  ["quiz", "Quiz"],
  ["a-retenir", "À retenir"],
] as const;

/** Barre de progression de lecture (part de la page déjà parcourue). */
function BarreLecture() {
  const [part, setPart] = useState(0);
  useEffect(() => {
    const maj = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPart(max > 0 ? Math.min(1, window.scrollY / max) : 1);
    };
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    window.addEventListener("resize", maj);
    return () => {
      window.removeEventListener("scroll", maj);
      window.removeEventListener("resize", maj);
    };
  }, []);
  return (
    <div className="sticky top-0 z-30 h-1 bg-muted print:hidden" role="progressbar" aria-label="Progression de lecture" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(part * 100)}>
      <div className="h-full bg-primary transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${part * 100}%` }} />
    </div>
  );
}

/** Page d'une leçon interactive du JSON. */
export function ChapitreInteractif({ chapitre: c }: { chapitre: TypeChapitre }) {
  const etats = useProgressionChapitres();
  const etat = etats[c.id];
  const { precedent, suivant } = voisins(c.id);
  const questions = useMemo<QuestionJouable[]>(
    () =>
      c.quiz.map((q) => ({
        cle: idQuestion(c.id, q.id),
        niveau: LIBELLE_NIVEAU[q.niveau],
        niveauDb: NIVEAU_DB[q.niveau],
        categorie: c.categorie,
        question: q.question,
        options: q.options,
        bonne: q.bonne,
        explication: q.explication,
      })),
    [c],
  );

  return (
    <SiteLayout>
      {/* Impression : seule la fiche (titre, en bref, infographie, à retenir) est imprimée. */}
      <style>{`@media print { header, footer, nav { display: none !important; } @page { margin: 12mm; } }`}</style>
      <BarreLecture />

      <section className="border-b bg-card print:border-0">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
          <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground print:hidden">
            <Link to="/formations/$slug" params={{ slug: COURS_CHAPITRES }} hash="chapitres-interactifs" className="inline-flex min-h-11 items-center hover:text-primary hover:underline">Comprendre l'IA</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span aria-current="page">Leçon {c.numero}</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary px-2.5 py-1 text-primary-foreground">Chapitre {c.numero}</span>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{titreCategorie(c.categorie)}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {c.dureeMin} min</span>
            {etat?.termine && <span className="rounded-full bg-tint-green px-2.5 py-1 text-tint-green-fg print:hidden">Terminé ✓</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-navy md:text-4xl">{c.titre}</h1>
          <nav aria-label="Sommaire de la leçon" className="mt-5 print:hidden">
            <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {SECTIONS.map(([id, label]) => (
                <li key={id} className="shrink-0">
                  <a href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full bg-muted px-3.5 text-sm font-medium hover:bg-secondary">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8 md:py-10">
        <section id="en-bref" aria-labelledby="en-bref-titre" className="scroll-mt-24 space-y-4">
          <div className="rounded-2xl border-l-4 border-primary bg-secondary/60 p-5 md:p-6">
            <h2 id="en-bref-titre" className="text-sm font-bold uppercase tracking-wide text-primary">En bref</h2>
            <p className="mt-2 text-lg leading-relaxed text-navy">{c.enBref}</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-card md:p-6 print:hidden">
            <h3 className="flex items-center gap-2 font-bold text-navy"><Target className="h-5 w-5 text-primary" /> Objectifs</h3>
            <ul className="mt-2 space-y-1.5">
              {c.objectifs.map((o) => <li key={o} className="flex gap-2 leading-snug"><span className="text-primary" aria-hidden="true">✓</span>{o}</li>)}
            </ul>
          </div>
        </section>

        <section id="infographie" aria-label="Infographie" className="scroll-mt-24">
          <Infographie infographie={c.infographie} />
        </section>

        <section id="explications" aria-labelledby="explications-titre" className="scroll-mt-24 print:hidden">
          <h2 id="explications-titre" className="text-2xl font-bold text-navy">Explications</h2>
          <div className="mt-4 space-y-3">
            {c.explications.map((e, i) => <Explication key={e.titre} explication={e} ouverte={i === 0} />)}
          </div>
        </section>

        <section id="exemples" aria-labelledby="exemples-titre" className="scroll-mt-24 print:hidden">
          <h2 id="exemples-titre" className="text-2xl font-bold text-navy">Exemples</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {c.exemples.map((e) => (
              <li key={e.titre} className="flex flex-col rounded-2xl bg-card p-5 shadow-card">
                <h3 className="font-bold text-navy">{e.titre}</h3>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contexte</p>
                <p className="text-sm">{e.contexte}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exemple</p>
                <p className="text-sm leading-relaxed">{e.texte}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="print:hidden">
          <QuizInteractif chapitreId={c.id} questions={questions} titre="Mini-quiz corrigé" ancreRevision={{ id: "explications", libelle: "les explications" }} />
          {etat && <p className="mt-2 text-right text-sm text-muted-foreground">Meilleur score : {etat.meilleur} / {etat.total}</p>}
        </div>

        <section id="a-retenir" aria-labelledby="a-retenir-titre" className="scroll-mt-24 rounded-2xl bg-tint-green p-5 text-tint-green-fg shadow-card md:p-7 print:bg-white print:text-black print:shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="a-retenir-titre" className="flex items-center gap-2 text-xl font-bold"><Lightbulb className="h-5 w-5" /> À retenir</h2>
            <button onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-semibold text-navy shadow-card hover:bg-muted print:hidden">
              <Printer className="h-4 w-4" /> Imprimer la fiche
            </button>
          </div>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {c.aRetenir.map((r) => <li key={r} className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />{r}</li>)}
          </ul>
        </section>

        <NavigationLecons precedent={precedent} suivant={suivant} categorie={c.categorie} />
      </div>
    </SiteLayout>
  );
}

function Explication({ explication: e, ouverte: initiale }: { explication: TypeChapitre["explications"][number]; ouverte: boolean }) {
  const [ouverte, setOuverte] = useState(initiale);
  const id = `explication-${e.titre.replace(/[^\w]+/g, "-")}`;
  return (
    <div className="rounded-2xl bg-card shadow-card">
      <h3>
        <button
          onClick={() => setOuverte(!ouverte)}
          aria-expanded={ouverte}
          aria-controls={id}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-5 py-3 text-left font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {e.titre}
          <ChevronDown className={`h-5 w-5 shrink-0 text-primary transition-transform motion-reduce:transition-none ${ouverte ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} hidden={!ouverte} className="px-5 pb-5">
        <p className="leading-relaxed">{e.texte}</p>
        {e.attention && (
          <div className="mt-3 flex gap-2.5 rounded-xl bg-tint-amber p-3 text-sm leading-snug text-tint-amber-fg">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p><span className="font-semibold">À ne pas oublier : </span>{e.attention}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Précédent / suivant calculés à partir de `ordre`, liste des leçons et QCM de la catégorie. */
export function NavigationLecons({ precedent, suivant, categorie }: { precedent: ResumeChapitre | undefined; suivant: ResumeChapitre | undefined; categorie: string }) {
  const carte = (r: ResumeChapitre, sens: "precedent" | "suivant") => (
    <Link
      to="/formations/$slug/chapitres/$chapitre"
      params={{ slug: COURS_CHAPITRES, chapitre: r.id }}
      className={`group flex min-h-11 flex-1 flex-col gap-1 rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5 ${sens === "suivant" ? "sm:items-end sm:text-right" : ""}`}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {sens === "precedent" && <ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        {sens === "precedent" ? "Leçon précédente" : "Leçon suivante"}
        {sens === "suivant" && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </span>
      <span className="font-semibold text-navy group-hover:text-primary">{r.numero} {r.titre}</span>
    </Link>
  );
  return (
    <nav aria-label="Navigation entre les leçons" className="space-y-4 print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row">
        {precedent ? carte(precedent, "precedent") : <span className="hidden flex-1 sm:block" />}
        {suivant ? carte(suivant, "suivant") : <span className="hidden flex-1 sm:block" />}
      </div>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/formations/$slug" params={{ slug: COURS_CHAPITRES }} hash="chapitres-interactifs" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary hover:bg-muted">
          <BookOpen className="h-4 w-4" /> Toutes les leçons
        </Link>
        <Link to="/exercices" search={{ type: "qcm", categorie }} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-primary hover:bg-muted">
          <ListChecks className="h-4 w-4" /> S'entraîner : QCM {titreCategorie(categorie)}
        </Link>
      </div>
    </nav>
  );
}
