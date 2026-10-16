import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, SkipForward, Target, Trophy, XCircle, Award, Flame } from "lucide-react";
import { ExercicesPratiques } from "@/components/ExercicesPratiques";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { ListeARendre } from "@/components/rendre/ListeARendre";
import { useAuth } from "@/lib/auth";
import { challenges } from "@/lib/content";
import { CLE_QCM, enregistrerTentatives } from "@/lib/progression";
import { CATEGORIES, NIVEAUX, filtrerQuestions, questionsComprendreIA as questions, type Niveau } from "@/lib/qcm-comprendre-ia";
import type { TypeTentative } from "@/lib/supabase";

/** Filtres de départ passés dans l'URL (bouton « Commencer » d'un travail assigné). */
type RechercheExercices = { onglet?: "a-rendre"; type?: TypeTentative; categorie?: string; niveau?: Niveau };

export const Route = createFileRoute("/exercices")({
  validateSearch: (s: Record<string, unknown>): RechercheExercices => ({
    ...(s["onglet"] === "a-rendre" && { onglet: "a-rendre" as const }),
    ...((s["type"] === "qcm" || s["type"] === "exercice") && { type: s["type"] }),
    ...(CATEGORIES.some((c) => c.id === s["categorie"]) && { categorie: s["categorie"] as string }),
    ...(NIVEAUX.some((n) => n.id === s["niveau"]) && { niveau: s["niveau"] as Niveau }),
  }),
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
const KEY = CLE_QCM;
type Progress = { done: Record<string, boolean> };

const questionIds = new Set(questions.map((q) => q.id));
const categorieTitre = (id: string) => CATEGORIES.find((c) => c.id === id)?.titre ?? id;
const niveauBadge: Record<string, string> = { green: "bg-tint-green text-tint-green-fg", orange: "bg-tint-amber text-tint-amber-fg", red: "bg-tint-rose text-tint-rose-fg" };
const chipClass = (active: boolean) => `rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card hover:bg-muted"}`;

function Exercices() {
  const recherche = Route.useSearch();
  const pourQcm = recherche.type === "qcm";
  const [cat, setCat] = useState<string | undefined>(pourQcm ? recherche.categorie : undefined);
  const [niveau, setNiveau] = useState<Niveau | undefined>(pourQcm ? recherche.niveau : undefined);
  const list = filtrerQuestions({ ...(cat && { categorie: cat }), ...(niveau && { niveau }) });
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState<Progress>({ done: {} });

  useEffect(() => {
    try { const s = localStorage.getItem(KEY); if (s) setProgress(JSON.parse(s)); } catch { /* ignore */ }
  }, []);
  const save = (p: Progress) => { setProgress(p); localStorage.setItem(KEY, JSON.stringify(p)); };

  // On ignore les réponses enregistrées pour d'anciennes questions qui n'existent plus.
  const done = Object.entries(progress.done).filter(([id]) => questionIds.has(id));
  const attempted = done.length;
  const correct = done.filter(([, ok]) => ok).length;
  const rate = attempted ? Math.round((correct / attempted) * 100) : 0;
  const points = correct * POINTS;
  const maxPoints = questions.length * POINTS;
  const level = points >= (maxPoints * 5) / 6 ? "Avancé" : points >= maxPoints / 3 ? "Intermédiaire" : "Débutant";
  const finished = idx >= list.length;
  const q = list[idx];

  const reset = (i: number) => { setIdx(i); setSelected(null); setChecked(false); };
  const validate = () => {
    if (selected === null || !q) return;
    setChecked(true);
    const correcte = selected === q.reponse;
    save({ done: { ...progress.done, [q.id]: correcte } });
    void enregistrerTentatives([{
      cours: q.cours, type: "qcm", categorie: q.categorie, niveau: q.niveau, score: correcte ? 1 : 0, total: 1,
      reponses: [{ question_id: q.id, correcte, reponse_donnee: String(selected) }],
    }]);
  };
  const niveauInfo = q ? NIVEAUX.find((n) => n.id === q.niveau) : undefined;

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
        <div role="tablist" aria-label="Type d'exercices" className="mb-8 flex w-fit gap-1 rounded-full bg-muted p-1">
          {([[undefined, "S'entraîner"], ["a-rendre", "À rendre"]] as const).map(([id, label]) => {
            const actif = recherche.onglet === id;
            return (
              <Link
                key={label}
                to="/exercices"
                search={id ? { onglet: id } : {}}
                role="tab"
                aria-selected={actif}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${actif ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        {recherche.onglet === "a-rendre" ? <ListeARendre /> : <>
        <BandeauProgression />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-card p-5 shadow-card">
              <Icon className="h-6 w-6 text-primary" />
              <div className="mt-3 font-display text-2xl font-bold text-navy">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div id="qcm" className="mt-8 flex scroll-mt-24 flex-wrap gap-2">
          <button onClick={() => { setCat(undefined); reset(0); }} className={chipClass(cat === undefined)}>Toutes les catégories</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { setCat(c.id); reset(0); }} title={c.description} className={chipClass(c.id === cat)}>{c.titre}</button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => { setNiveau(undefined); reset(0); }} className={chipClass(niveau === undefined)}>Tous les niveaux</button>
          {NIVEAUX.map((n) => (
            <button key={n.id} onClick={() => { setNiveau(n.id); reset(0); }} title={n.description} className={chipClass(n.id === niveau)}>{n.label}</button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-card p-6 shadow-card md:p-8">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${list.length ? (Math.min(idx, list.length) / list.length) * 100 : 0}%` }} />
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Aucune question pour cette combinaison de filtres.</p>
          ) : finished ? (
            <div className="py-10 text-center">
              <Trophy className="mx-auto h-14 w-14 text-tint-amber-fg" />
              <h2 className="mt-4 text-2xl font-bold text-navy">Série terminée !</h2>
              <p className="mt-2 text-muted-foreground">Score global : {points} points · Taux de réussite : {rate} %</p>
              <button onClick={() => reset(0)} className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Recommencer</button>
            </div>
          ) : q && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">QCM</span>
                <span className={`rounded-full px-3 py-1 ${niveauBadge[niveauInfo?.couleur ?? ""] ?? "bg-muted"}`}>{niveauInfo?.label ?? q.niveau}</span>
                <span className="rounded-full bg-muted px-3 py-1">{categorieTitre(q.categorie)}</span>
                <span className="ml-auto text-muted-foreground">Question {idx + 1} / {list.length}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Consigne : choisissez la bonne réponse puis validez.</p>
              <h2 className="mt-4 text-xl font-bold text-navy md:text-2xl">{q.question}</h2>
              <div className="mt-5 grid gap-3">
                {q.options.map((o, i) => {
                  const state = checked ? (i === q.reponse ? "border-success bg-tint-green" : i === selected ? "border-destructive bg-tint-rose" : "border-border") : i === selected ? "border-primary bg-secondary" : "border-border hover:bg-muted";
                  return (
                    <button key={o} disabled={checked} onClick={() => setSelected(i)} className={`rounded-xl border-2 p-4 text-left font-medium transition ${state}`}>{o}</button>
                  );
                })}
              </div>
              {checked && (
                <div className="mt-5 space-y-2 rounded-xl bg-muted p-5 text-sm">
                  <p className={`flex items-center gap-2 font-bold ${selected === q.reponse ? "text-success" : "text-destructive"}`}>
                    {selected === q.reponse ? <><CheckCircle2 className="h-5 w-5" /> Bonne réponse ! +{POINTS} points</> : <><XCircle className="h-5 w-5" /> Réponse incorrecte</>}
                  </p>
                  <p><strong>Bonne réponse :</strong> {q.options[q.reponse]}</p>
                  <p><strong>Pourquoi :</strong> {q.explication}</p>
                  <p className="flex flex-wrap items-center gap-1">
                    <strong>Pour approfondir :</strong> chapitre {q.chapitre} du
                    <Link to="/formations/$slug" params={{ slug: q.cours }} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><BookOpen className="h-4 w-4" />support de cours</Link>
                  </p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {!checked ? (
                  <>
                    <button onClick={validate} disabled={selected === null} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50">Valider ma réponse</button>
                    <button onClick={() => reset(idx + 1)} className="inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-muted-foreground hover:bg-muted"><SkipForward className="h-4 w-4" />Passer la question</button>
                  </>
                ) : (
                  <button onClick={() => reset(idx + 1)} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Question suivante</button>
                )}
              </div>
            </div>
          )}
        </div>

        <h2 id="exercices-pratiques" className="mt-14 scroll-mt-24 text-3xl font-bold text-navy">Exercices pratiques</h2>
        <p className="mt-2 text-muted-foreground">Vrai ou faux justifié, associations, remise en ordre, construction de prompts, équations de recherche et études de cas, tirés du support de cours.</p>
        <ExercicesPratiques {...(recherche.type === "exercice" && { categorieInitiale: recherche.categorie, niveauInitial: recherche.niveau })} />

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
        </>}
      </div>
    </SiteLayout>
  );
}

function BandeauProgression() {
  const { status, configured, user } = useAuth();
  if (status === "loading" || !configured) return null;
  if (user) {
    return (
      <p className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-tint-green px-5 py-3 text-sm text-tint-green-fg">
        <CheckCircle2 className="h-4 w-4" /> Ta progression est enregistrée dans ton espace.
        <Link to="/mon-espace" className="font-semibold underline">Voir mon espace</Link>
      </p>
    );
  }
  return (
    <p className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm text-secondary-foreground">
      Connecte-toi pour enregistrer ta progression et la partager avec ton formateur.
      <Link to="/connexion" className="font-semibold underline">Se connecter</Link>
      <Link to="/inscription" className="font-semibold underline">Créer un compte</Link>
    </p>
  );
}
