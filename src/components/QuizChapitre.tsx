import { Link } from "@tanstack/react-router";
import { ArrowRight, ListChecks, LogIn, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { enregistrerScoreChapitre, SEUIL_TERMINE } from "@/lib/progression-chapitres";
import { CLE_QCM, enregistrerTentatives } from "@/lib/progression";
import { NIVEAUX, questionsComprendreIA } from "@/lib/qcm-comprendre-ia";
import type { NiveauDb } from "@/lib/supabase";

const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-50";
const btnSecondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition hover:opacity-90";

/** Question prête à être jouée et enregistrée (banque de QCM ou leçon du JSON). */
export type QuestionJouable = {
  cle: string; // enregistré dans reponses.question_id
  niveau: string; // libellé affiché
  niveauDb: NiveauDb;
  categorie: string;
  question: string;
  options: string[];
  bonne: number;
  explication: string;
};

const melanger = (n: number) => {
  const t = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j]!, t[i]!];
  }
  return t;
};

/**
 * Mini-quiz : une question à la fois, options mélangées à chaque tentative, correction immédiate et score réel.
 * Chaque réponse est enregistrée comme les autres QCM (tentatives / reponses) si l'apprenant est connecté ;
 * le meilleur score de la leçon est gardé sur l'appareil.
 */
export function QuizInteractif({ chapitreId, questions, titre, ancreRevision, gardeQcmLocal = false }: {
  chapitreId: string;
  questions: QuestionJouable[];
  titre: string;
  /** Section à relire quand le score est insuffisant. */
  ancreRevision: { id: string; libelle: string };
  /** Banque de QCM : met aussi à jour la progression de /exercices. */
  gardeQcmLocal?: boolean;
}) {
  const { status, configured, user } = useAuth();
  const [ordres, setOrdres] = useState<number[][] | null>(null); // ordre affiché des options, par question
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<number | null>(null); // index d'origine de l'option choisie
  const [resultats, setResultats] = useState<boolean[]>([]);

  // Mélange après le premier rendu (le rendu serveur garde l'ordre d'origine).
  useEffect(() => setOrdres(questions.map((q) => melanger(q.options.length))), [questions]);

  const q = questions[index];
  const valide = resultats.length > index;
  // Le score s'affiche après « Voir mon score », pour laisser lire l'explication de la dernière question.
  const termine = questions.length > 0 && index >= questions.length;
  const score = resultats.filter(Boolean).length;
  const reussi = score / questions.length >= SEUIL_TERMINE;

  const valider = () => {
    if (!q || choix === null || valide) return;
    const correcte = choix === q.bonne;
    setResultats([...resultats, correcte]);
    if (gardeQcmLocal) {
      try {
        const p = JSON.parse(localStorage.getItem(CLE_QCM) ?? "{}") as { done?: Record<string, boolean> };
        localStorage.setItem(CLE_QCM, JSON.stringify({ ...p, done: { ...(p.done ?? {}), [q.cle]: correcte } }));
      } catch {
        /* stockage indisponible */
      }
    }
    void enregistrerTentatives([
      {
        cours: "comprendre-ia",
        type: "qcm",
        categorie: q.categorie,
        niveau: q.niveauDb,
        score: correcte ? 1 : 0,
        total: 1,
        reponses: [{ question_id: q.cle, correcte, reponse_donnee: String(choix) }],
      },
    ]);
  };
  const suivante = () => {
    const n = index + 1;
    setIndex(n);
    setChoix(null);
    if (n >= questions.length) enregistrerScoreChapitre(chapitreId, resultats.filter(Boolean).length, questions.length);
  };
  const recommencer = () => {
    setOrdres(questions.map((qq) => melanger(qq.options.length)));
    setIndex(0);
    setChoix(null);
    setResultats([]);
  };

  return (
    <section id="quiz" aria-labelledby="quiz-titre" className="scroll-mt-24 rounded-2xl bg-card p-5 shadow-card md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="quiz-titre" className="flex items-center gap-2 text-xl font-bold text-navy">
          <ListChecks className="h-5 w-5 text-primary" /> {titre}
        </h2>
        {!termine && q && (
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            Question {index + 1} / {questions.length}
          </span>
        )}
      </div>
      {status === "ready" && configured && !user && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
          <LogIn className="h-4 w-4" /> Ton score est gardé sur cet appareil.
          <Link to="/connexion" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Connecte-toi</Link> pour le retrouver dans ton espace.
        </p>
      )}

      {/* Avancement : questions déjà validées (✓ / ✗), aucune valeur simulée. */}
      <ol className="mt-4 flex gap-1.5" aria-label="Avancement du quiz">
        {questions.map((qq, i) => {
          const fait = i < resultats.length;
          return (
            <li
              key={qq.cle}
              aria-label={`Question ${i + 1} : ${fait ? (resultats[i] ? "réussie" : "manquée") : "à faire"}`}
              className={`grid h-6 flex-1 place-items-center rounded-full text-xs font-bold ${
                fait ? (resultats[i] ? "bg-tint-green text-tint-green-fg" : "bg-tint-rose text-tint-rose-fg") : i === index && !termine ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {fait ? (resultats[i] ? "✓" : "✗") : i + 1}
            </li>
          );
        })}
      </ol>

      <div aria-live="polite">
        {termine ? (
          <div className="mt-6 text-center">
            <p className="font-display text-4xl font-bold text-navy">
              {score} <span className="text-2xl text-muted-foreground">/ {questions.length}</span>
            </p>
            <p className={`mt-2 font-semibold ${reussi ? "text-success" : "text-navy"}`}>
              {reussi ? "✓ Bravo, tu as compris ce chapitre !" : "Relis les explications et réessaie."}
            </p>
            {!reussi && (
              <a href={`#${ancreRevision.id}`} className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">
                Relire {ancreRevision.libelle}
              </a>
            )}
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={recommencer} className={btnSecondary}><RotateCcw className="h-4 w-4" /> Recommencer</button>
            </div>
          </div>
        ) : (
          q && (
            <div className="mt-5">
              <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{q.niveau}</span>
              <fieldset className="mt-2">
                <legend className="text-lg font-semibold leading-snug text-navy">{q.question}</legend>
                <div className="mt-4 grid gap-2.5">
                  {(ordres?.[index] ?? q.options.map((_, i) => i)).map((i) => {
                    const o = q.options[i]!;
                    const bonne = valide && i === q.bonne;
                    const fausse = valide && i === choix && i !== q.bonne;
                    return (
                      <label
                        key={o}
                        className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm leading-snug transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                          bonne ? "border-success bg-tint-green" : fausse ? "border-destructive bg-tint-rose" : choix === i ? "border-primary bg-secondary" : "border-border hover:border-primary/50"
                        } ${valide ? "cursor-default" : ""}`}
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.cle}`}
                          checked={choix === i}
                          disabled={valide}
                          onChange={() => setChoix(i)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        />
                        <span className="flex-1">{o}</span>
                        {bonne && <span className="font-bold text-success" aria-label="Bonne réponse">✓</span>}
                        {fausse && <span className="font-bold text-destructive" aria-label="Ta réponse, incorrecte">✗</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {valide && (
                <div className={`mt-4 rounded-xl p-4 text-sm leading-relaxed ${resultats[index] ? "bg-tint-green text-tint-green-fg" : "bg-tint-rose text-tint-rose-fg"}`}>
                  <p className="font-semibold">{resultats[index] ? "✓ Bonne réponse !" : "✗ Pas tout à fait."}</p>
                  <p className="mt-1">{q.explication}</p>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                {valide ? (
                  <button onClick={suivante} className={btnPrimary}>
                    {index + 1 < questions.length ? "Question suivante" : "Voir mon score"} <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={valider} disabled={choix === null} className={btnPrimary}>Valider</button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

/** Page 2.4 (faite à la main) : questions tirées de la banque de QCM, enregistrées sous leur id d'origine. */
export function QuizChapitre({ ids, titre, chapitreId, ancreRevision }: { ids: string[]; titre: string; chapitreId: string; ancreRevision: { id: string; libelle: string } }) {
  const [questions] = useState<QuestionJouable[]>(() =>
    ids.flatMap((id) => {
      const q = questionsComprendreIA.find((x) => x.id === id);
      return q
        ? [{
            cle: q.id,
            niveau: NIVEAUX.find((n) => n.id === q.niveau)?.label ?? q.niveau,
            niveauDb: q.niveau,
            categorie: q.categorie,
            question: q.question,
            options: q.options,
            bonne: q.reponse,
            explication: q.explication,
          }]
        : [];
    }),
  );
  return <QuizInteractif chapitreId={chapitreId} questions={questions} titre={titre} ancreRevision={ancreRevision} gardeQcmLocal />;
}
