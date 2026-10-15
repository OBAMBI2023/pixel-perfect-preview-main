import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, SkipForward, Target, Trophy, XCircle, Award, Flame } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { challenges, questions } from "@/lib/content";

export const Route = createFileRoute("/exercices")({
  head: () => ({
    meta: [
      { title: "Exercices — IA et la Recherche" },
      { name: "description", content: "Exercices interactifs corrigés pour pratiquer l'IA appliquée à la recherche." },
      { property: "og:title", content: "Espace exercices — IA et la Recherche" },
      { property: "og:description", content: "Apprendre en pratiquant : QCM, vrai/faux et défis pratiques." },
    ],
  }),
  component: Exercices,
});

const POINTS = 10;
const KEY = "iar-progress";
type Progress = { done: Record<string, boolean> };

function Exercices() {
  const categories = useMemo(() => ["Toutes", ...Array.from(new Set(questions.map((q) => q.category)))], []);
  const [cat, setCat] = useState("Toutes");
  const list = cat === "Toutes" ? questions : questions.filter((q) => q.category === cat);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [progress, setProgress] = useState<Progress>({ done: {} });

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setProgress(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  const save = (p: Progress) => { setProgress(p); localStorage.setItem(KEY, JSON.stringify(p)); };

  const attempted = Object.keys(progress.done).length;
  const correct = Object.values(progress.done).filter(Boolean).length;
  const rate = attempted ? Math.round((correct / attempted) * 100) : 0;
  const points = correct * POINTS;
  const level = points >= 50 ? "Avancé" : points >= 20 ? "Intermédiaire" : "Débutant";
  const finished = idx >= list.length;
  const q = list[idx];

  const reset = (i: number) => { setIdx(i); setSelected(null); setChecked(false); setHint(false); };
  const validate = () => {
    if (selected === null || !q) return;
    setChecked(true);
    save({ done: { ...progress.done, [q.id]: selected === q.answer } });
  };

  const stats = [
    { icon: Target, label: "Exercices réalisés", value: `${attempted}/${questions.length}` },
    { icon: CheckCircle2, label: "Taux de réussite", value: `${rate} %` },
    { icon: Trophy, label: "Points obtenus", value: points },
    { icon: Award, label: "Niveau actuel", value: level },
  ];

  return (
    <SiteLayout>
      <PageHero badge="Espace exercices" title="Apprendre en pratiquant" description="Testez vos connaissances, réalisez des défis pratiques et développez vos compétences en intelligence artificielle." />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-card p-5 shadow-card">
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-display text-2xl font-bold text-navy">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => { setCat(c); reset(0); }} className={`rounded-full px-4 py-2 text-sm font-medium transition ${c === cat ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-muted"}`}>{c}</button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-card p-6 shadow-card md:p-8">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(Math.min(idx, list.length) / list.length) * 100}%` }} />
          </div>
          {finished ? (
            <div className="py-10 text-center">
              <Trophy className="mx-auto h-14 w-14 text-tint-amber-fg" />
              <h2 className="mt-4 text-2xl font-bold text-navy">Série terminée !</h2>
              <p className="mt-2 text-muted-foreground">Score global : {points} points · Taux de réussite : {rate} %</p>
              <button onClick={() => reset(0)} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Recommencer</button>
            </div>
          ) : q && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">{q.type}</span>
                <span className="rounded-full bg-muted px-3 py-1">{q.level}</span>
                <span className="rounded-full bg-muted px-3 py-1">{q.category}</span>
                <span className="ml-auto text-muted-foreground">Question {idx + 1} / {list.length}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Consigne : choisissez la bonne réponse puis validez.</p>
              <h2 className="mt-4 text-xl font-bold text-navy md:text-2xl">{q.question}</h2>
              <div className="mt-5 grid gap-3">
                {q.options.map((o, i) => {
                  const state = checked ? (i === q.answer ? "border-success bg-tint-green" : i === selected ? "border-destructive bg-tint-rose" : "border-border") : i === selected ? "border-primary bg-secondary" : "border-border hover:bg-muted";
                  return (
                    <button key={o} disabled={checked} onClick={() => setSelected(i)} className={`rounded-xl border-2 p-4 text-left font-medium transition ${state}`}>{o}</button>
                  );
                })}
              </div>
              {hint && !checked && <p className="mt-4 flex gap-2 rounded-xl bg-tint-amber p-4 text-sm"><Lightbulb className="h-5 w-5 shrink-0 text-tint-amber-fg" />{q.hint}</p>}
              {checked && (
                <div className="mt-5 space-y-2 rounded-xl bg-muted p-5 text-sm">
                  <p className={`flex items-center gap-2 font-bold ${selected === q.answer ? "text-success" : "text-destructive"}`}>
                    {selected === q.answer ? <><CheckCircle2 className="h-5 w-5" /> Bonne réponse ! +{POINTS} points</> : <><XCircle className="h-5 w-5" /> Réponse incorrecte</>}
                  </p>
                  <p><strong>Bonne réponse :</strong> {q.options[q.answer]}</p>
                  <p><strong>Pourquoi :</strong> {q.explanation}</p>
                  <p><strong>Erreur fréquente :</strong> {q.commonError}</p>
                  <p><strong>Pour approfondir :</strong> {q.resource}</p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {!checked ? (
                  <>
                    <button onClick={validate} disabled={selected === null} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50">Valider ma réponse</button>
                    <button onClick={() => setHint(true)} className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-semibold text-secondary-foreground"><Lightbulb className="h-4 w-4" />Indice</button>
                    <button onClick={() => reset(idx + 1)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-muted-foreground hover:bg-muted"><SkipForward className="h-4 w-4" />Passer la question</button>
                  </>
                ) : (
                  <button onClick={() => reset(idx + 1)} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Question suivante</button>
                )}
              </div>
            </div>
          )}
        </div>

        <h2 className="mt-14 text-3xl font-bold text-navy">Défis pratiques</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {challenges.map((c) => (
            <div key={c.title} className="rounded-2xl bg-card p-6 shadow-card">
              <Flame className="h-6 w-6 text-tint-rose-fg" />
              <h3 className="mt-3 text-lg font-bold text-navy">{c.title}</h3>
              <p className="mt-2 text-sm">{c.task}</p>
              <p className="mt-3 text-xs text-muted-foreground"><strong>Évaluation :</strong> {c.evaluation}</p>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
