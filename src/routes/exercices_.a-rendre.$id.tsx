import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LogIn, MessageSquare, PenLine, Send, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Confirmer } from "@/components/espace/Confirmer";
import { btnPrimary, btnSecondary, formatDate, formatDateHeure } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { Bareme, BadgeCopie, BadgesExercice, LienChapitre } from "@/components/rendre/communs";
import { exerciceARendre, type ExerciceARendre } from "@/data/exercices-a-rendre";
import { useAuth } from "@/lib/auth";
import {
  compterMots,
  ecrireBrouillon,
  effacerBrouillon,
  formatNote,
  lireBrouillon,
  useMesGroupes,
  useMesSoumissions,
} from "@/lib/soumissions";
import { getSupabase, type Soumission } from "@/lib/supabase";

export const Route = createFileRoute("/exercices_/a-rendre/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${exerciceARendre(params.id)?.titre ?? "Exercice à rendre"} — IA et la Recherche` },
      { name: "description", content: "Exercice à rédiger et à rendre à ton formateur." },
    ],
  }),
  component: PageExercice,
});

const MAX_CARACTERES = 5000;

function PageExercice() {
  const { id } = Route.useParams();
  const exo = exerciceARendre(id);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <Link to="/exercices" search={{ onglet: "a-rendre" }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Exercices à rendre
        </Link>
        {!exo ? (
          <Carte className="mt-6"><p className="text-muted-foreground">Cet exercice n'existe pas.</p></Carte>
        ) : (
          <>
            <header className="mt-4">
              <BadgesExercice exo={exo} />
              <h1 className="mt-3 text-3xl font-bold text-navy md:text-4xl">{exo.titre}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                10 à 15 minutes · entre {exo.minMots} et {exo.maxMots} mots · noté sur {formatNote(exo.noteSur)}
              </p>
            </header>
            <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-6">
                <Carte titre="Consigne">
                  <p className="leading-relaxed">{exo.consigne}</p>
                  <p className="mt-4 text-sm"><LienChapitre exo={exo} /></p>
                </Carte>
                <Copie exo={exo} />
              </div>
              <aside className="space-y-6">
                <Carte titre="Barème">
                  <Bareme exo={exo} />
                </Carte>
              </aside>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

/** Zone de l'apprenant : connexion, choix du groupe, rédaction ou résultat selon l'état de la copie. */
function Copie({ exo }: { exo: ExerciceARendre }) {
  const { status, configured, user } = useAuth();
  const groupes = useMesGroupes(user?.id);
  const copies = useMesSoumissions(user?.id);
  const [groupeChoisi, setGroupeChoisi] = useState<string | null>(null);
  const [edition, setEdition] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);

  if (status === "loading" || (user && (groupes.isLoading || copies.isLoading))) {
    return <Carte><p className="text-sm text-muted-foreground">Chargement…</p></Carte>;
  }
  if (!configured || !user) {
    return (
      <Carte titre="Ta réponse">
        <p className="text-sm text-muted-foreground">
          {configured ? "Connecte-toi pour rédiger ta réponse et l'envoyer à ton formateur." : "Les comptes ne sont pas encore configurés sur ce site."}
        </p>
        {configured && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/connexion" className={btnPrimary}><LogIn className="h-4 w-4" /> Se connecter</Link>
            <Link to="/inscription" className={btnSecondary}><UserPlus className="h-4 w-4" /> Créer un compte</Link>
          </div>
        )}
      </Carte>
    );
  }
  if (groupes.isError || copies.isError) return <Message ton="erreur">Impossible de charger ta copie. Recharge la page.</Message>;

  const actifs = (groupes.data ?? []).flatMap((m) => (m.groupe && !m.groupe.archive_le ? [m.groupe] : []));
  const mesCopies = (copies.data ?? []).filter((c) => c.exercice_id === exo.id);
  if (actifs.length === 0 && mesCopies.length === 0) {
    return (
      <Carte titre="Ta réponse">
        <p className="text-sm text-muted-foreground">Pour rendre cet exercice, rejoins d'abord le groupe de ton formateur avec son lien ou son code d'invitation.</p>
        <Link to="/mon-espace" className={`${btnPrimary} mt-4`}>Rejoindre un groupe</Link>
      </Carte>
    );
  }

  // Groupe par défaut : celui de la copie la plus récente, sinon le premier groupe actif.
  const groupesPossibles = [...actifs, ...mesCopies.map((c) => ({ id: c.groupe_id, nom: (groupes.data ?? []).find((m) => m.groupe?.id === c.groupe_id)?.groupe?.nom ?? "Groupe" }))]
    .filter((g, i, l) => l.findIndex((x) => x.id === g.id) === i);
  const groupeId = groupeChoisi ?? mesCopies[0]?.groupe_id ?? actifs[0]!.id;
  const copie = mesCopies.find((c) => c.groupe_id === groupeId);
  const peutEcrire = !copie ? actifs.some((g) => g.id === groupeId) : copie.statut !== "corrige";
  const ecrire = peutEcrire && (!copie || copie.statut === "a_refaire" || edition);

  return (
    <div className="space-y-6">
      {groupesPossibles.length > 1 && (
        <label className="flex flex-wrap items-center gap-3 text-sm font-medium">
          Groupe
          <select
            value={groupeId}
            onChange={(e) => { setGroupeChoisi(e.target.value); setEdition(false); setEnvoyee(false); }}
            className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card"
          >
            {groupesPossibles.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </label>
      )}
      {envoyee && copie?.statut === "soumis" && (
        <Message ton="succes"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Copie envoyée à ton formateur.</Message>
      )}
      {copie && copie.statut !== "soumis" && <Resultat exo={exo} copie={copie} />}
      {copie?.statut === "soumis" && !edition && (
        <Carte titre="Ta copie" action={<BadgeCopie copie={copie} />}>
          <p className="text-sm text-muted-foreground">Envoyée le {formatDateHeure(copie.soumis_le)}. Tu peux encore la modifier tant que ton formateur ne l'a pas corrigée.</p>
          <TexteCopie texte={copie.contenu} />
          <button onClick={() => setEdition(true)} className={`${btnSecondary} mt-4`}><PenLine className="h-4 w-4" /> Modifier ma copie</button>
        </Carte>
      )}
      {ecrire && (
        <Redaction
          key={`${groupeId}-${copie?.statut ?? "nouveau"}`}
          exo={exo}
          groupeId={groupeId}
          copie={copie}
          onEnvoye={() => { setEdition(false); setEnvoyee(true); }}
          onAnnuler={copie?.statut === "soumis" ? () => setEdition(false) : undefined}
        />
      )}
    </div>
  );
}

function TexteCopie({ texte }: { texte: string }) {
  return <div className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed">{texte}</div>;
}

/** Note, commentaire et barème ; marque la correction comme consultée. */
function Resultat({ exo, copie }: { exo: ExerciceARendre; copie: Soumission }) {
  const qc = useQueryClient();
  const marque = useRef(false);
  const [voirCopie, setVoirCopie] = useState(copie.statut === "corrige");

  useEffect(() => {
    if (copie.consulte_le || marque.current) return;
    marque.current = true;
    void getSupabase()!
      .rpc("marquer_copie_consultee", { p_id: copie.id })
      .then(({ error }) => { if (!error) void qc.invalidateQueries({ queryKey: ["mes-soumissions"] }); });
  }, [copie.id, copie.consulte_le, qc]);

  const corrige = copie.statut === "corrige";
  return (
    <Carte
      titre={corrige ? "Ta copie corrigée" : "Copie à reprendre"}
      action={<BadgeCopie copie={copie} />}
      className={corrige ? "border-2 border-tint-green" : "border-2 border-tint-rose"}
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        {copie.note !== null && (
          <div>
            <div className="font-display text-4xl font-bold text-navy">{formatNote(copie.note)}<span className="text-xl text-muted-foreground"> / {formatNote(copie.note_sur)}</span></div>
            <div className="text-sm text-muted-foreground">{corrige ? "Note" : "Note provisoire"}</div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">Corrigée le {formatDate(copie.corrige_le)}</p>
      </div>
      {copie.commentaire && (
        <div className="mt-5 rounded-xl bg-muted p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy"><MessageSquare className="h-4 w-4" /> Commentaire de ton formateur</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{copie.commentaire}</p>
        </div>
      )}
      {!corrige && <p className="mt-4 text-sm font-medium">Modifie ta réponse ci-dessous en tenant compte du commentaire, puis renvoie-la.</p>}
      {corrige && (
        <>
          <h3 className="mt-6 font-semibold text-navy">Barème</h3>
          <div className="mt-2"><Bareme exo={exo} note={copie.note} /></div>
          <h3 className="mt-6 font-semibold text-navy">Éléments attendus</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{exo.attendu}</p>
        </>
      )}
      <button onClick={() => setVoirCopie(!voirCopie)} aria-expanded={voirCopie} className="mt-5 text-sm font-semibold text-primary hover:underline">
        {voirCopie ? "Masquer ma copie" : "Voir ma copie"}
      </button>
      {voirCopie && <TexteCopie texte={copie.contenu} />}
    </Carte>
  );
}

/** Rédaction avec compteur de mots, brouillon local et envoi confirmé. */
function Redaction({ exo, groupeId, copie, onEnvoye, onAnnuler }: {
  exo: ExerciceARendre;
  groupeId: string;
  copie: Soumission | undefined;
  onEnvoye: () => void;
  onAnnuler: (() => void) | undefined;
}) {
  const qc = useQueryClient();
  const [texte, setTexte] = useState(() => lireBrouillon(exo.id, groupeId) ?? copie?.contenu ?? "");
  const mots = compterMots(texte);
  const tropCourt = mots < exo.minMots;
  const tropLong = mots > exo.maxMots || texte.length > MAX_CARACTERES;
  const brouillon = texte.trim() !== "" && texte !== (copie?.contenu ?? "");

  const envoyer = useMutation({
    mutationFn: async () => {
      const sb = getSupabase()!;
      const contenu = texte.trim();
      const { error } = copie
        ? await sb.from("soumissions").update({ contenu }).eq("id", copie.id).select().single()
        : await sb.from("soumissions").insert({ exercice_id: exo.id, groupe_id: groupeId, contenu }).select().single();
      if (error) {
        // Mise à jour refusée par la RLS : la copie a été corrigée entre-temps (aucune ligne renvoyée).
        if (copie && error.code === "PGRST116") throw new Error("Ta copie vient d'être corrigée : elle ne peut plus être modifiée. Recharge la page pour voir la correction.");
        throw new Error("Envoi impossible. Vérifie que tu es toujours membre du groupe, puis réessaie.");
      }
    },
    onSuccess: () => {
      effacerBrouillon(exo.id, groupeId);
      void qc.invalidateQueries({ queryKey: ["mes-soumissions"] });
      onEnvoye();
    },
  });

  const changer = (v: string) => {
    setTexte(v);
    envoyer.reset();
    ecrireBrouillon(exo.id, groupeId, v);
  };

  const compteurClasse = tropCourt || tropLong ? "text-destructive" : "text-success";
  return (
    <Carte titre={copie?.statut === "a_refaire" ? "Nouvelle version" : copie ? "Modifier ma copie" : "Ta réponse"}>
      <label htmlFor="reponse" className="sr-only">Ta réponse</label>
      <textarea
        id="reponse"
        value={texte}
        onChange={(e) => changer(e.target.value)}
        rows={12}
        maxLength={MAX_CARACTERES}
        placeholder="Rédige ta réponse ici…"
        className="w-full rounded-xl border-2 border-border bg-background p-4 text-sm leading-relaxed outline-none transition focus:border-primary"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={`font-semibold tabular-nums ${compteurClasse}`} aria-live="polite">
          {mots} mot{mots > 1 ? "s" : ""} <span className="font-normal text-muted-foreground">· entre {exo.minMots} et {exo.maxMots}</span>
        </span>
        {brouillon && <span className="text-xs text-muted-foreground">Brouillon enregistré sur cet appareil</span>}
      </div>
      {tropCourt && mots > 0 && <p className="mt-1 text-xs text-muted-foreground">Encore {exo.minMots - mots} mot{exo.minMots - mots > 1 ? "s" : ""} au minimum.</p>}
      {tropLong && <p className="mt-1 text-xs text-destructive">Ta réponse dépasse la limite : raccourcis-la.</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Confirmer
          declencheur={
            <button disabled={tropCourt || tropLong || envoyer.isPending} className={btnPrimary}>
              <Send className="h-4 w-4" /> {envoyer.isPending ? "Envoi…" : copie ? "Soumettre à nouveau" : "Soumettre"}
            </button>
          }
          titre={copie ? "Envoyer cette nouvelle version ?" : "Soumettre ta copie ?"}
          description="Ton formateur pourra la lire et la corriger. Tu pourras encore la modifier tant qu'elle n'est pas corrigée."
          libelle="Soumettre"
          destructif={false}
          onConfirmer={() => envoyer.mutate()}
        />
        {onAnnuler && <button onClick={onAnnuler} className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">Annuler</button>}
      </div>
      {envoyer.isError && <div className="mt-3"><Message ton="erreur">{envoyer.error.message}</Message></div>}
    </Carte>
  );
}
