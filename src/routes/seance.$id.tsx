import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, LogIn, Presentation, RefreshCw, Send, Target } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import { btnPrimary, btnSecondary } from "@/components/espace/styles";
import { Message } from "@/components/espace/ui";
import { ContenuSlide } from "@/components/SlidesPresentation";
import { useAuth } from "@/lib/auth";
import { cleReactions, presentationDe, useCanalSeance, useSeance } from "@/lib/seance-direct";
import { getSupabase, type SeanceDirect, type TypeReaction } from "@/lib/supabase";

// Page apprenant : n'importe jamais les notes orales du formateur (src/data/notes-comprendre-ia.ts).

export const Route = createFileRoute("/seance/$id")({
  head: () => ({
    meta: [
      { title: "Séance en direct — IA et la Recherche" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PageSeanceApprenant,
});

function PageSeanceApprenant() {
  const { id } = Route.useParams();
  const { status, configured, user } = useAuth();

  if (status === "loading") return <Ecran><p className="text-muted-foreground">Chargement…</p></Ecran>;
  if (!configured || !user) {
    return (
      <Ecran>
        <p className="text-lg font-semibold text-navy">Connecte-toi pour suivre la séance en direct.</p>
        <Link to="/connexion" className={`${btnPrimary} mt-5 w-full py-3.5 text-base`}><LogIn className="h-5 w-5" /> Se connecter</Link>
      </Ecran>
    );
  }
  return <VueApprenant seanceId={id} userId={user.id} />;
}

function Ecran({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-card p-6 text-center shadow-card">{children}</div>
    </div>
  );
}

function VueApprenant({ seanceId, userId }: { seanceId: string; userId: string }) {
  const seance = useSeance(seanceId);
  const { etat } = useCanalSeance({ seanceId, userId, role: "apprenant" });

  if (seance.isLoading) return <Ecran><p className="text-muted-foreground">Connexion à la séance…</p></Ecran>;
  if (seance.isError && !seance.data) {
    return <Ecran><Message ton="erreur">Impossible de rejoindre la séance. Vérifie ta connexion, puis recharge la page.</Message></Ecran>;
  }
  if (!seance.data) {
    return (
      <Ecran>
        <p className="font-semibold text-navy">Séance introuvable.</p>
        <p className="mt-2 text-sm text-muted-foreground">Elle est réservée aux membres du groupe de ton formateur.</p>
        <Link to="/mon-espace" className={`${btnSecondary} mt-5 w-full`}><ArrowLeft className="h-4 w-4" /> Mon espace</Link>
      </Ecran>
    );
  }
  if (seance.data.statut === "terminee") return <FinSeance seance={seance.data} />;
  return <Suivi seance={seance.data} reconnexion={etat === "reconnexion"} />;
}

/* ───────────────────────── Fin ───────────────────────── */

function FinSeance({ seance }: { seance: SeanceDirect }) {
  const pres = presentationDe(seance);
  const bouton = "w-full py-3.5 text-base";
  return (
    <Ecran>
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
      <h1 className="mt-3 font-display text-2xl font-bold text-navy">Séance terminée</h1>
      <p className="mt-2 text-muted-foreground">Merci d'avoir suivi « {pres.titre} ». Pour ancrer ce que tu as vu :</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link to="/formations/$slug" params={{ slug: pres.cours }} hash="diapositives" className={`${btnPrimary} ${bouton}`}>
          <Presentation className="h-5 w-5" /> Revoir les diapositives
        </Link>
        <Link to="/exercices" search={{ type: "qcm" }} className={`${btnSecondary} ${bouton}`}>
          <Target className="h-5 w-5" /> Faire le QCM
        </Link>
        <a href={pres.pdfUrl} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} ${bouton}`}>
          <BookOpen className="h-5 w-5" /> Lire le cours complet <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Ecran>
  );
}

/* ───────────────────────── Suivi en direct ───────────────────────── */

function Suivi({ seance, reconnexion }: { seance: SeanceDirect; reconnexion: boolean }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const pres = presentationDe(seance);
  const total = pres.slides.length;
  const courante = Math.min(seance.diapo_courante, total - 1);
  // null : on suit le formateur ; sinon diapositive précédente consultée par l'apprenant.
  const [vue, setVue] = useState<number | null>(null);
  const affiche = vue !== null && vue < courante ? vue : courante;
  const slide = pres.slides[affiche]!;
  const [question, setQuestion] = useState<string | null>(null); // null : formulaire fermé
  const [reponse, setReponse] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  // Le formateur est revenu avant la diapositive consultée : on reprend le suivi.
  useEffect(() => {
    if (vue !== null && vue >= courante) setVue(null);
  }, [vue, courante]);

  // Sens de l'animation : vers la droite quand on avance.
  const precedente = useRef(affiche);
  const sens = affiche >= precedente.current ? "slide-in-from-right-8" : "slide-in-from-left-8";
  useEffect(() => {
    precedente.current = affiche;
  }, [affiche]);

  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(t);
  }, [confirmation]);

  const miennes = useQuery({
    queryKey: cleReactions(seance.id),
    queryFn: async () => {
      const { data, error } = await sb.from("reactions_seance").select("*").eq("seance_id", seance.id);
      if (error) throw error;
      return data;
    },
  });
  const dejaPasCompris = (miennes.data ?? []).some((r) => r.type === "pas_compris" && r.diapo === affiche);
  const questionSalle = seance.question_texte && seance.question_diapo === courante ? seance.question_texte : null;
  const dejaRepondu = (miennes.data ?? []).some((r) => r.type === "reponse" && r.diapo === seance.question_diapo);

  const envoyer = useMutation({
    mutationFn: async ({ type, diapo, texte }: { type: TypeReaction; diapo: number; texte?: string }) => {
      const { error } = await sb.from("reactions_seance").insert({ seance_id: seance.id, diapo, type, texte: texte ?? null });
      // Doublon (déjà signalé / déjà répondu) : l'état voulu est atteint.
      if (error && error.code !== "23505") throw new Error("Envoi impossible. Vérifie ta connexion, puis réessaie.");
    },
    onSuccess: (_, { type }) => {
      void qc.invalidateQueries({ queryKey: cleReactions(seance.id) });
      if (type === "question") {
        setQuestion(null);
        setConfirmation("Question envoyée au formateur.");
      }
      if (type === "pas_compris") setConfirmation("Le formateur sait que ce point n'est pas clair.");
      if (type === "reponse") setReponse("");
    },
  });

  const aller = (n: number) => setVue(n >= courante ? null : Math.max(0, n));
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const debutToucher = (e: TouchEvent) => {
    const t = e.touches[0];
    toucher.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const finToucher = (e: TouchEvent) => {
    const d = toucher.current;
    const t = e.changedTouches[0];
    toucher.current = null;
    if (!d || !t) return;
    const dx = t.clientX - d.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(t.clientY - d.y)) aller(affiche + (dx < 0 ? 1 : -1));
  };

  const gros = "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition disabled:opacity-60";

  return (
    <div className="min-h-screen bg-muted pb-10">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link to="/mon-espace" aria-label="Quitter la séance" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tint-rose px-2.5 py-1 text-xs font-bold text-tint-rose-fg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> EN DIRECT
          </span>
          <p className="truncate font-semibold text-navy">{pres.titre}</p>
        </div>
        {reconnexion && (
          <p role="status" className="flex items-center justify-center gap-2 bg-tint-amber px-4 py-2 text-sm font-semibold text-tint-amber-fg">
            <RefreshCw className="h-4 w-4 animate-spin" /> Reconnexion…
          </p>
        )}
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-3 pt-4 sm:px-4">
        <div
          key={affiche}
          role="group"
          aria-roledescription="diapositive"
          aria-label={`${affiche + 1} sur ${total} : ${slide.titre}`}
          onTouchStart={debutToucher}
          onTouchEnd={finToucher}
          className={`@container overflow-hidden rounded-2xl border-2 bg-background shadow-card duration-300 animate-in fade-in ${sens} md:aspect-video ${affiche === courante ? "border-primary/40" : "border-border"}`}
        >
          {/* Diapositive en direct : l'analogie suit le formateur ; diapositive précédente : consultation libre. */}
          <ContenuSlide slide={slide} numero={affiche + 1} pdfUrl={pres.pdfUrl} analogie={affiche === courante ? { visible: seance.analogie_visible } : undefined} />
        </div>
        <p className="sr-only" aria-live="polite">Diapositive {affiche + 1} sur {total} : {slide.titre}</p>

        <div className="flex items-center justify-between gap-3">
          <button onClick={() => aller(affiche - 1)} disabled={affiche === 0} aria-label="Diapositive précédente" className="grid h-12 w-12 place-items-center rounded-full bg-card shadow-card disabled:opacity-40">
            <ChevronLeft className="h-6 w-6" />
          </button>
          {affiche < courante ? (
            <button onClick={() => setVue(null)} className={`${gros} flex-1 bg-primary text-primary-foreground shadow-card`}>
              Revenir au formateur ({courante + 1}/{total})
            </button>
          ) : (
            <span className="flex-1 text-center text-sm font-semibold tabular-nums text-navy">
              {affiche + 1} / {total} <span className="font-normal text-muted-foreground">· en direct</span>
            </span>
          )}
          <button onClick={() => aller(affiche + 1)} disabled={affiche >= courante} aria-label="Diapositive suivante (déjà présentée)" className="grid h-12 w-12 place-items-center rounded-full bg-card shadow-card disabled:opacity-40">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {questionSalle && (
          <section aria-label="Question du formateur" className="animate-rise rounded-2xl border-2 border-primary bg-card p-4 shadow-card">
            <p className="text-sm font-semibold text-primary">Question à la salle</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-navy">{questionSalle}</p>
            {dejaRepondu ? (
              <p className="mt-3 flex items-center gap-2 font-semibold text-success"><CheckCircle2 className="h-5 w-5" /> Réponse envoyée</p>
            ) : (
              <form
                className="mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reponse.trim()) envoyer.mutate({ type: "reponse", diapo: seance.question_diapo!, texte: reponse.trim() });
                }}
              >
                <label htmlFor="reponse-salle" className="sr-only">Ta réponse</label>
                <textarea
                  id="reponse-salle"
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Ta réponse en quelques mots…"
                  className="w-full rounded-xl border-2 border-border bg-background p-3 text-base outline-none focus:border-primary"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs tabular-nums text-muted-foreground">{reponse.length} / 300</span>
                  <button type="submit" disabled={!reponse.trim() || envoyer.isPending} className={`${gros} bg-primary text-primary-foreground`}>
                    <Send className="h-5 w-5" /> Envoyer
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => envoyer.mutate({ type: "pas_compris", diapo: affiche })}
            disabled={dejaPasCompris || envoyer.isPending}
            aria-pressed={dejaPasCompris}
            className={`${gros} ${dejaPasCompris ? "bg-tint-amber text-tint-amber-fg" : "bg-card text-navy shadow-card"}`}
          >
            <span aria-hidden="true">🤔</span> {dejaPasCompris ? "Signalé" : "Je n'ai pas compris"}
          </button>
          <button
            onClick={() => setQuestion(question === null ? "" : null)}
            aria-expanded={question !== null}
            aria-controls="poser-question"
            className={`${gros} ${question !== null ? "bg-secondary text-secondary-foreground" : "bg-card text-navy shadow-card"}`}
          >
            <span aria-hidden="true">✋</span> Poser une question
          </button>
        </div>

        {question !== null && (
          <form
            id="poser-question"
            className="rounded-2xl bg-card p-4 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) envoyer.mutate({ type: "question", diapo: affiche, texte: question.trim() });
            }}
          >
            <label htmlFor="question" className="text-sm font-semibold text-navy">Ta question sur la diapositive {affiche + 1}</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              rows={3}
              autoFocus
              placeholder="Ex. : comment vérifier un DOI ?"
              className="mt-2 w-full rounded-xl border-2 border-border bg-background p-3 text-base outline-none focus:border-primary"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs tabular-nums text-muted-foreground">{question.length} / 300</span>
              <button type="submit" disabled={!question.trim() || envoyer.isPending} className={`${gros} bg-primary text-primary-foreground`}>
                <Send className="h-5 w-5" /> Envoyer
              </button>
            </div>
          </form>
        )}

        {envoyer.isError && <Message ton="erreur">{envoyer.error.message}</Message>}
        {confirmation && <Message ton="succes">{confirmation}</Message>}
      </main>
    </div>
  );
}
