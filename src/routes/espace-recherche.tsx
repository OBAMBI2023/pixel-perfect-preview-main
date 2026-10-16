import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, CheckCircle2, Pencil, Target, Trophy, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { PageParticipant } from "@/components/espace/EspaceParticipant";
import { btnPrimary, formatDate, formatJour } from "@/components/espace/styles";
import { Carte, Message, Stat } from "@/components/espace/ui";
import { COURS_CHAPITRES, resumesChapitres } from "@/data/chapitres";
import { exerciceARendre } from "@/data/exercices-a-rendre";
import { etapesFaites, NB_ETAPES_ACCUEIL, useAccueil } from "@/lib/accueil";
import { labelNiveau } from "@/lib/progression";
import { NIVEAUX } from "@/lib/qcm-comprendre-ia";
import { useProgressionChapitres } from "@/lib/progression-chapitres";
import { EXERCICES_RECHERCHE, labelNiveauEtudes, useProfilChercheur, useTravauxRecherche } from "@/lib/recherche";
import { formatNote, LIBELLES_STATUT, useMesSoumissions } from "@/lib/soumissions";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/espace-recherche")({
  head: () => ({
    meta: [
      { title: "Mon espace de recherche — IA et la Recherche" },
      { name: "description", content: "Ton sujet, tes objectifs, tes exercices terminés, tes scores et tes prochaines activités." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PageParticipant titre="Mon espace de recherche" description="Ton sujet, tes objectifs, ce que tu as déjà fait et ce qui t'attend.">
      {({ user }) => <EspaceRecherche userId={user.id} />}
    </PageParticipant>
  ),
});

function EspaceRecherche({ userId }: { userId: string }) {
  const sb = getSupabase()!;
  const profil = useProfilChercheur(userId);
  const travaux = useTravauxRecherche(userId);
  const copies = useMesSoumissions(userId);
  const accueil = useAccueil(userId);
  const lecons = useProgressionChapitres();
  const progression = useQuery({
    queryKey: ["progression", userId],
    queryFn: async () => {
      const { data, error } = await sb.rpc("progression_apprenant", {});
      if (error) throw error;
      return data;
    },
  });
  const nbQcm = useQuery({
    queryKey: ["nb-tentatives", userId],
    queryFn: async () => {
      const { count, error } = await sb.from("tentatives").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const devoirs = useQuery({
    queryKey: ["mes-devoirs", userId],
    queryFn: async () => {
      const { data, error } = await sb.rpc("mes_devoirs", {});
      if (error) throw error;
      return data;
    },
  });

  const parNiveau = (progression.data ?? [])
    .filter((p) => p.dimension === "niveau")
    .sort((a, b) => NIVEAUX.findIndex((n) => n.id === a.cle) - NIVEAUX.findIndex((n) => n.id === b.cle));
  const nbReponses = parNiveau.reduce((s, p) => s + p.nb_tentatives, 0);
  const tauxGlobal = nbReponses ? parNiveau.reduce((s, p) => s + p.taux_reussite * p.nb_tentatives, 0) / nbReponses : null;
  const persoTermines = EXERCICES_RECHERCHE.filter((e) => travaux.data?.get(e.id)?.termine);
  const copiesNotees = (copies.data ?? []).filter((c) => c.statut === "corrige" && c.note !== null);
  const leconsTerminees = resumesChapitres.filter((r) => lecons[r.id]?.termine);
  const erreur = profil.isError || travaux.isError || progression.isError || copies.isError;

  // Prochaines activités : uniquement à partir de ce qui est réellement enregistré.
  const prochaines: { cle: string; texte: ReactNode; lien: ReactNode }[] = [];
  for (const d of (devoirs.data ?? []).filter((x) => !x.fait)) {
    prochaines.push({
      cle: `devoir-${d.id}`,
      texte: <>Travail assigné : <strong>{d.titre}</strong>{d.date_limite && <> · à faire pour le {formatJour(d.date_limite)}</>}</>,
      lien: <Link to="/mon-espace" className="text-sm font-semibold text-primary hover:underline">Voir</Link>,
    });
  }
  for (const c of (copies.data ?? []).filter((x) => x.statut === "a_refaire")) {
    prochaines.push({
      cle: `copie-${c.id}`,
      texte: <>Copie à refaire : <strong>{exerciceARendre(c.exercice_id)?.titre ?? c.exercice_id}</strong></>,
      lien: <Link to="/exercices/a-rendre/$id" params={{ id: c.exercice_id }} className="text-sm font-semibold text-primary hover:underline">Reprendre</Link>,
    });
  }
  if (accueil.isSuccess && etapesFaites(accueil.data).length < NB_ETAPES_ACCUEIL) {
    prochaines.push({ cle: "accueil", texte: <>Terminer le parcours de démarrage ({etapesFaites(accueil.data).length}/{NB_ETAPES_ACCUEIL})</>, lien: <Link to="/bienvenue" hash="demarrage" className="text-sm font-semibold text-primary hover:underline">Continuer</Link> });
  }
  if (profil.isSuccess && !profil.data) {
    prochaines.push({ cle: "profil", texte: <>Renseigner ton profil chercheur</>, lien: <Link to="/profil-chercheur" className="text-sm font-semibold text-primary hover:underline">Compléter</Link> });
  } else if (travaux.isSuccess) {
    const suivant = EXERCICES_RECHERCHE.find((e) => !travaux.data.get(e.id)?.termine);
    if (suivant) {
      prochaines.push({
        cle: "perso",
        texte: <>Exercice personnalisé : <strong>{suivant.titre}</strong></>,
        lien: <Link to="/mes-exercices" search={{ exercice: suivant.id }} className="text-sm font-semibold text-primary hover:underline">Commencer</Link>,
      });
    }
  }
  const leconSuivante = resumesChapitres.find((r) => !lecons[r.id]?.termine);
  if (leconSuivante) {
    prochaines.push({
      cle: "lecon",
      texte: <>Leçon {leconSuivante.numero} : <strong>{leconSuivante.titre}</strong></>,
      lien: <Link to="/formations/$slug/chapitres/$chapitre" params={{ slug: COURS_CHAPITRES, chapitre: leconSuivante.id }} className="text-sm font-semibold text-primary hover:underline">Ouvrir</Link>,
    });
  }

  return (
    <>
      {erreur && <Message ton="erreur">Une partie de tes données n'a pas pu être chargée. Vérifie ta connexion internet, puis recharge la page.</Message>}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Carte
          titre={<span className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Mon sujet et mes objectifs</span>}
          action={profil.data ? <Link to="/profil-chercheur" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"><Pencil className="h-4 w-4" /> Modifier</Link> : undefined}
        >
          {profil.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {profil.isSuccess && !profil.data && (
            <>
              <p className="text-sm text-muted-foreground">Tu n'as pas encore enregistré de sujet de recherche.</p>
              <Link to="/profil-chercheur" className={`${btnPrimary} mt-4`}><UserRound className="h-4 w-4" /> Créer mon profil chercheur</Link>
            </>
          )}
          {profil.data && (
            <dl className="space-y-3 text-sm">
              <Ligne terme="Sujet"><span className="font-semibold text-navy">{profil.data.sujet}</span></Ligne>
              {profil.data.problematique && <Ligne terme="Problématique">{profil.data.problematique}</Ligne>}
              <Ligne terme="Objectif de formation">{profil.data.objectif}</Ligne>
              <Ligne terme="Discipline">
                {profil.data.discipline} · {labelNiveauEtudes(profil.data.niveau_etudes)}
                {profil.data.etablissement && <> · {profil.data.etablissement}</>}
              </Ligne>
            </dl>
          )}
        </Carte>

        <Carte titre={<span className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary" /> Prochaines activités</span>}>
          {prochaines.length === 0 ? (
            <Message ton="succes">Tout est à jour : aucune activité en attente.</Message>
          ) : (
            <ul className="divide-y">
              {prochaines.map((p) => (
                <li key={p.cle} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="min-w-0">{p.texte}</span>
                  {p.lien}
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <section aria-labelledby="scores-titre" className="space-y-4">
        <h2 id="scores-titre" className="flex items-center gap-2 text-2xl font-bold text-navy"><Trophy className="h-6 w-6 text-primary" /> Mes scores</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Tentatives enregistrées" valeur={nbQcm.data ?? "—"} aide="Enregistrées dans ton compte" />
          <Stat label="Réussite moyenne" valeur={tauxGlobal === null ? "—" : `${Math.round(tauxGlobal)} %`} aide="Moyenne pondérée par tentative" />
          <Stat label="Copies notées" valeur={copiesNotees.length} aide="Exercices à rendre corrigés" />
          <Stat label="Leçons terminées" valeur={`${leconsTerminees.length} / ${resumesChapitres.length}`} aide="Sur cet appareil" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Carte titre="Réussite par niveau">
            {parNiveau.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réponse enregistrée pour l'instant.</p>
            ) : (
              <ul className="divide-y text-sm">
                {parNiveau.map((p) => (
                  <li key={p.cle} className="flex justify-between py-2"><span>{labelNiveau(p.cle)}</span><span className="tabular-nums text-muted-foreground">{Math.round(p.taux_reussite)} % · {p.nb_tentatives} tent.</span></li>
                ))}
              </ul>
            )}
            <Link to="/mon-espace" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Détail dans Ma progression <ArrowRight className="h-4 w-4" /></Link>
          </Carte>
          <Carte titre="Notes de mes copies">
            {copiesNotees.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune copie notée pour l'instant.</p>
            ) : (
              <ul className="divide-y text-sm">
                {copiesNotees.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0">{exerciceARendre(c.exercice_id)?.titre ?? c.exercice_id}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatNote(c.note)} / {formatNote(c.note_sur)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      </section>

      <Carte titre={<span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Exercices terminés</span>}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Exercices personnalisés</h3>
            {persoTermines.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aucun pour l'instant.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {persoTermines.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3">
                    <Link to="/mes-exercices" search={{ exercice: e.id }} className="font-medium hover:text-primary">{e.titre}</Link>
                    <span className="text-muted-foreground">{formatDate(travaux.data?.get(e.id)?.termine_le ?? null)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Auto-évalués à l'aide d'une grille : ils ne donnent pas de note.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Exercices à rendre</h3>
            {(copies.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aucune copie envoyée.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {(copies.data ?? []).map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <Link to="/exercices/a-rendre/$id" params={{ id: c.exercice_id }} className="font-medium hover:text-primary">{exerciceARendre(c.exercice_id)?.titre ?? c.exercice_id}</Link>
                    <span className="shrink-0 text-muted-foreground">{LIBELLES_STATUT[c.statut]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Carte>
    </>
  );
}

function Ligne({ terme, children }: { terme: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{terme}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
