import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/components/espace/styles";
import { DUREE_TOTALE_MIN, notesComprendreIA } from "@/data/notes-comprendre-ia";
import { PAGES_PDF } from "@/data/slides-comprendre-ia";
import { useGardeFormateur } from "@/lib/auth";
import { PRESENTATIONS_DIRECT } from "@/lib/seance-direct";

export const Route = createFileRoute("/formateur_/notes-cours")({
  head: () => ({
    meta: [
      { title: "Notes du formateur — IA et la Recherche" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotesCours,
});

function NotesCours() {
  const { status, user } = useGardeFormateur();
  if (!user) return <p className="p-10 text-muted-foreground">{status === "loading" ? "Chargement…" : "Redirection…"}</p>;
  const pres = PRESENTATIONS_DIRECT["comprendre-ia"]!;

  return (
    <div className="min-h-screen bg-muted py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <Link to="/formateur" className={btnSecondary}><ArrowLeft className="h-4 w-4" /> Espace formateur</Link>
        <button onClick={() => window.print()} className={btnPrimary}><Printer className="h-4 w-4" /> Imprimer</button>
      </div>

      <article className="mx-auto max-w-3xl bg-card p-8 text-foreground shadow-card md:rounded-2xl md:p-12 print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-navy pb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary print:text-black">Notes du formateur</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy print:text-black">{pres.titre} — l'essentiel</h1>
          <p className="mt-1 text-sm text-muted-foreground">{pres.slides.length} diapositives · environ {DUREE_TOTALE_MIN} min</p>
        </header>

        <ol className="mt-6 space-y-5">
          {pres.slides.map((slide, i) => {
            const note = notesComprendreIA.find((n) => n.id === slide.id);
            const page = PAGES_PDF[slide.chapitre];
            return (
              <li key={slide.id} className="break-inside-avoid rounded-xl border-2 border-border p-5 print:rounded-none print:border print:p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold text-navy print:text-black">{i + 1}. {slide.titre}</h2>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {note ? `${note.dureeMin} min` : ""} · ch. {slide.chapitre}{page ? ` (p. ${page})` : ""}
                  </span>
                </div>
                {slide.sousTitre && <p className="mt-1 text-sm font-medium">{slide.sousTitre}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{slide.points.join(" · ")}</p>
                {note && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                    {note.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
                {note && (
                  <dl className="mt-3 space-y-1 text-sm">
                    <div><dt className="inline font-semibold">Question à la salle : </dt><dd className="inline">{note.question}</dd></div>
                    <div><dt className="inline font-semibold">Exemple : </dt><dd className="inline">{note.exemple}</dd></div>
                    <div><dt className="inline font-semibold">Transition : </dt><dd className="inline italic">{note.transition}</dd></div>
                  </dl>
                )}
              </li>
            );
          })}
        </ol>
      </article>
    </div>
  );
}
