import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, CircleHelp, Clock, HelpCircle, Megaphone, MessageSquare, Square, Users, Wifi, WifiOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Confirmer } from "@/components/espace/Confirmer";
import { btnPrimary, btnSecondary, formatDateHeure } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { ContenuSlide } from "@/components/SlidesPresentation";
import { DUREE_TOTALE_MIN, notesComprendreIA } from "@/data/notes-comprendre-ia";
import { useGardeFormateur } from "@/lib/auth";
import { useMembres } from "@/lib/formateur";
import { cleReactions, cleSeance, formatDuree, presentationDe, useCanalSeance, useMaintenant, useSeance } from "@/lib/seance-direct";
import { getSupabase, type Database, type SeanceDirect } from "@/lib/supabase";

type MajSeance = Database["public"]["Tables"]["seances_direct"]["Update"];

export const Route = createFileRoute("/formateur_/seance-direct/$id")({
  head: () => ({
    meta: [
      { title: "Séance en direct — Formateur — IA et la Recherche" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PageSeanceFormateur,
});

function PageSeanceFormateur() {
  const { status, user } = useGardeFormateur();
  const { id } = Route.useParams();
  if (!user) return <p className="p-10 text-muted-foreground">{status === "loading" ? "Chargement…" : "Redirection…"}</p>;
  return <VueFormateur seanceId={id} userId={user.id} />;
}

function VueFormateur({ seanceId, userId }: { seanceId: string; userId: string }) {
  const seance = useSeance(seanceId);
  const { etat, presents } = useCanalSeance({ seanceId, userId, role: "formateur" });

  if (seance.isLoading) return <p className="p-10 text-muted-foreground">Chargement de la séance…</p>;
  if (seance.isError) return <div className="p-10"><Message ton="erreur">Impossible de charger la séance. Recharge la page.</Message></div>;
  if (!seance.data) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <Message ton="erreur">Séance introuvable, ou réservée au formateur du groupe.</Message>
        <Link to="/formateur" className={`${btnSecondary} mt-4`}><ArrowLeft className="h-4 w-4" /> Espace formateur</Link>
      </div>
    );
  }
  return <Pupitre seance={seance.data} presents={presents} connecte={etat === "connecte"} />;
}

/* ───────────────────────── Pupitre ───────────────────────── */

function Pupitre({ seance, presents, connecte }: { seance: SeanceDirect; presents: number; connecte: boolean }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const pres = presentationDe(seance);
  const total = pres.slides.length;
  const i = Math.min(seance.diapo_courante, total - 1);
  const slide = pres.slides[i]!;
  const suivante = pres.slides[i + 1];
  const note = notesComprendreIA.find((n) => n.id === slide.id);
  const enCours = seance.statut === "en_cours";
  const maintenant = useMaintenant(enCours);
  const membres = useMembres(seance.groupe_id);
  const [erreur, setErreur] = useState<string | null>(null);
  const cible = useRef(seance.diapo_courante);

  const groupe = useQuery({
    queryKey: ["groupe", seance.groupe_id],
    queryFn: async () => {
      const { data, error } = await sb.from("groupes").select("nom").eq("id", seance.groupe_id).single();
      if (error) throw error;
      return data;
    },
  });
  const reactions = useQuery({
    queryKey: cleReactions(seance.id),
    queryFn: async () => {
      const { data, error } = await sb
        .from("reactions_seance")
        .select("*, apprenant:profiles!reactions_seance_apprenant_id_fkey(nom_complet)")
        .eq("seance_id", seance.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  /** Met à jour la séance tout de suite à l'écran, puis en base (les apprenants suivent via Realtime). */
  const ecrire = async (maj: MajSeance, optimiste: Partial<SeanceDirect>) => {
    const avant = qc.getQueryData<SeanceDirect>(cleSeance(seance.id));
    if (avant) qc.setQueryData(cleSeance(seance.id), { ...avant, ...optimiste });
    setErreur(null);
    const { data, error } = await sb.from("seances_direct").update(maj).eq("id", seance.id).select().single();
    if (error) {
      if (avant) qc.setQueryData(cleSeance(seance.id), avant);
      setErreur("La mise à jour n'a pas été enregistrée. Vérifie ta connexion, puis réessaie.");
      return;
    }
    // Ignore une réponse dépassée si le formateur a déjà changé de diapositive entre-temps.
    if (data.diapo_courante === cible.current) qc.setQueryData(cleSeance(seance.id), data);
  };

  const aller = (n: number) => {
    if (!enCours || n < 0 || n >= total || n === cible.current) return;
    cible.current = n;
    void ecrire({ diapo_courante: n }, { diapo_courante: n, diapo_depuis: new Date().toISOString(), question_diapo: null, question_texte: null, analogie_visible: false });
  };
  // `aller` change à chaque rendu ; le raccourci clavier lit toujours la dernière version.
  const allerRef = useRef(aller);
  allerRef.current = aller;

  useEffect(() => {
    cible.current = seance.diapo_courante;
  }, [seance.diapo_courante]);

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Les télécommandes de présentation envoient PageDown / PageUp.
      if (e.key === "ArrowRight" || e.key === "PageDown") allerRef.current(cible.current + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") allerRef.current(cible.current - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, []);

  const questionPosee = seance.question_diapo === i && !!seance.question_texte;
  const poserQuestion = () => {
    if (!note?.question) return;
    void ecrire({ question_diapo: i, question_texte: note.question }, { question_diapo: i, question_texte: note.question });
  };
  const retirerQuestion = () => void ecrire({ question_diapo: null, question_texte: null }, { question_diapo: null, question_texte: null });
  // Analogie de la cuisine (diapositive à cartes) : affichée chez tous les apprenants en même temps.
  const basculerAnalogie = () => void ecrire({ analogie_visible: !seance.analogie_visible }, { analogie_visible: !seance.analogie_visible });
  const terminer = () => void ecrire({ statut: "terminee" }, { statut: "terminee", fin_le: new Date().toISOString(), question_diapo: null, question_texte: null, analogie_visible: false });

  const lignes = reactions.data ?? [];
  const pasCompris = lignes.filter((r) => r.type === "pas_compris" && r.diapo === i).length;
  const questions = lignes.filter((r) => r.type === "question");
  const reponses = lignes.filter((r) => r.type === "reponse" && r.diapo === i);
  const nom = (r: (typeof lignes)[number]) => r.apprenant?.nom_complet || "Apprenant";

  const ecouleSeance = (seance.fin_le ? new Date(seance.fin_le).getTime() : maintenant) - new Date(seance.debut_le).getTime();
  const ecouleDiapo = maintenant - new Date(seance.diapo_depuis).getTime();
  const depasse = !!note && ecouleDiapo > note.dureeMin * 60_000;
  const totalMembres = membres.data?.length ?? 0;

  if (!enCours) {
    return (
      <div className="min-h-screen bg-muted px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Carte titre="Séance terminée">
            <p className="text-muted-foreground">
              {pres.titre} · {groupe.data?.nom ?? "Groupe"} · durée {formatDuree(ecouleSeance)}
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              <li className="rounded-xl bg-muted p-4"><div className="font-display text-2xl font-bold text-navy">{lignes.filter((r) => r.type === "pas_compris").length}</div><div className="text-sm text-muted-foreground">« Je n'ai pas compris »</div></li>
              <li className="rounded-xl bg-muted p-4"><div className="font-display text-2xl font-bold text-navy">{questions.length}</div><div className="text-sm text-muted-foreground">Questions reçues</div></li>
              <li className="rounded-xl bg-muted p-4"><div className="font-display text-2xl font-bold text-navy">{lignes.filter((r) => r.type === "reponse").length}</div><div className="text-sm text-muted-foreground">Réponses à la salle</div></li>
            </ul>
            {questions.length > 0 && (
              <>
                <h3 className="mt-6 font-semibold text-navy">Questions à reprendre</h3>
                <ListeMessages lignes={questions} nom={nom} avecDiapo />
              </>
            )}
            <Link to="/formateur" className={`${btnPrimary} mt-6`}><ArrowLeft className="h-4 w-4" /> Retour à l'espace formateur</Link>
          </Carte>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Barre du haut */}
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/formateur" aria-label="Retour à l'espace formateur (la séance continue)" className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-rose px-2.5 py-1 text-xs font-bold text-tint-rose-fg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> EN DIRECT
            </span>
            <p className="truncate font-semibold text-navy">{pres.titre} <span className="font-normal text-muted-foreground">· {groupe.data?.nom ?? "…"}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground" title="Durée de la séance">
              <Clock className="h-4 w-4" /> {formatDuree(ecouleSeance)} <span className="hidden sm:inline">/ {DUREE_TOTALE_MIN} min</span>
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${connecte ? "text-success" : "text-destructive"}`}>
              {connecte ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />} {connecte ? "Connecté" : "Reconnexion…"}
            </span>
            <Confirmer
              declencheur={<button className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"><Square className="h-4 w-4" /> Terminer la séance</button>}
              titre="Terminer la séance ?"
              description="Les apprenants verront l'écran de fin. Une séance terminée ne peut pas être reprise."
              libelle="Terminer"
              onConfirmer={terminer}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {erreur && <Message ton="erreur">{erreur}</Message>}
          <div role="group" aria-roledescription="diapositive" aria-label={`Diapositive en cours, ${i + 1} sur ${total} : ${slide.titre}`} className="@container aspect-video overflow-hidden rounded-xl border-2 border-border bg-background shadow-card">
            <ContenuSlide key={slide.id} slide={slide} numero={i + 1} pdfUrl={pres.pdfUrl} analogie={{ visible: seance.analogie_visible, basculer: basculerAnalogie }} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => aller(i - 1)} aria-disabled={i === 0} aria-label="Diapositive précédente" className="grid h-12 w-12 place-items-center rounded-full bg-card shadow-card hover:bg-secondary aria-disabled:opacity-40">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <span className="min-w-16 text-center font-semibold tabular-nums text-navy">{i + 1} / {total}</span>
              <button onClick={() => aller(i + 1)} aria-disabled={i === total - 1} aria-label="Diapositive suivante" className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-card hover:opacity-90 aria-disabled:opacity-40">
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="hidden text-xs text-muted-foreground md:inline">← → ou télécommande</span>
            </div>
            {note && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${depasse ? "bg-tint-amber text-tint-amber-fg" : "bg-card text-navy"}`}
                title="Temps passé sur cette diapositive / durée conseillée"
              >
                <Clock className="h-4 w-4" /> {formatDuree(ecouleDiapo)} / {note.dureeMin} min{depasse && " · durée dépassée"}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
            <Carte titre="Notes orales">
              <ul className="space-y-2 text-sm leading-relaxed">
                {(note?.notes ?? []).map((n) => (
                  <li key={n} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />{n}</li>
                ))}
              </ul>
              {note && (
                <dl className="mt-4 space-y-2 text-sm">
                  <div><dt className="inline font-semibold text-navy">Exemple : </dt><dd className="inline">{note.exemple}</dd></div>
                  <div><dt className="inline font-semibold text-navy">Transition : </dt><dd className="inline italic">{note.transition}</dd></div>
                </dl>
              )}
              {note?.question && (
                <div className="mt-4 rounded-xl bg-muted p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-navy"><CircleHelp className="h-4 w-4 text-primary" /> Question à la salle</p>
                  <p className="mt-1 text-sm">{note.question}</p>
                  {questionPosee ? (
                    <button onClick={retirerQuestion} className={`${btnSecondary} mt-3`}><X className="h-4 w-4" /> Retirer la question des écrans</button>
                  ) : (
                    <button onClick={poserQuestion} className={`${btnPrimary} mt-3`}><Megaphone className="h-4 w-4" /> Poser la question à la salle</button>
                  )}
                </div>
              )}
            </Carte>
            <div>
              <p className="mb-2 text-sm font-semibold text-muted-foreground">{suivante ? "Suivante" : "Dernière diapositive"}</p>
              {suivante ? (
                <div inert aria-label={`Diapositive suivante : ${suivante.titre}`} className="@container aspect-video overflow-hidden rounded-lg border-2 border-border bg-background">
                  <ContenuSlide slide={suivante} numero={i + 2} pdfUrl={pres.pdfUrl} analogie={{ visible: false }} />
                </div>
              ) : (
                <p className="rounded-lg bg-card p-4 text-sm text-muted-foreground shadow-card">Fin de la présentation : pense à terminer la séance.</p>
              )}
            </div>
          </div>
        </div>

        {/* Panneau en direct */}
        <aside className="space-y-4" aria-label="En direct">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" /> Connectés</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums text-navy" aria-live="polite">{presents} / {totalMembres}</div>
            </div>
            <div className={`rounded-2xl p-4 shadow-card ${pasCompris > 0 ? "bg-tint-amber text-tint-amber-fg" : "bg-card"}`}>
              <div className="flex items-center gap-2 text-sm"><HelpCircle className="h-4 w-4" /> Pas compris</div>
              <div className="mt-1 font-display text-2xl font-bold tabular-nums" aria-live="polite">{pasCompris}</div>
              <div className="text-xs opacity-80">sur cette diapositive</div>
            </div>
          </div>

          {(questionPosee || reponses.length > 0) && (
            <Carte titre={<span className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Réponses ({reponses.length})</span>}>
              {questionPosee && <p className="mb-3 text-sm text-muted-foreground">{seance.question_texte}</p>}
              {reponses.length === 0 ? <p className="text-sm text-muted-foreground">En attente des réponses…</p> : <ListeMessages lignes={reponses} nom={nom} />}
            </Carte>
          )}

          <Carte titre={<span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Questions reçues ({questions.length})</span>}>
            {reactions.isError && <Message ton="erreur">Impossible de charger les questions.</Message>}
            {questions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune question pour l'instant.</p> : <ListeMessages lignes={questions} nom={nom} avecDiapo />}
          </Carte>
        </aside>
      </main>
    </div>
  );
}

function ListeMessages<T extends { id: string; texte: string | null; diapo: number; created_at: string }>({ lignes, nom, avecDiapo = false }: {
  lignes: T[];
  nom: (r: T) => string;
  avecDiapo?: boolean;
}) {
  return (
    <ul className="max-h-96 space-y-2 overflow-y-auto" aria-live="polite">
      {lignes.map((r) => (
        <li key={r.id} className="animate-rise rounded-xl bg-muted p-3 text-sm">
          <p className="leading-snug">{r.texte}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {nom(r)}{avecDiapo && ` · diapositive ${r.diapo + 1}`} · {formatDateHeure(r.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
