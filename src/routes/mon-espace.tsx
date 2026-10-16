import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, History, LogIn, Play, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHero, SiteLayout } from "@/components/SiteLayout";
import { BadgesDevoir, Echeance, EtatDevoir } from "@/components/espace/Devoirs";
import { CopiesCorrigees } from "@/components/rendre/CopiesCorrigees";
import { TableHistorique } from "@/components/espace/TableHistorique";
import { btnPrimary, btnSecondary, formatDate, inputClass } from "@/components/espace/styles";
import { Barres, Carte, Message, Stat } from "@/components/espace/ui";
import { useAuth } from "@/lib/auth";
import { SEUIL_DEVOIR_QCM } from "@/lib/formateur";
import { erreurRejoindre } from "@/lib/invitation";
import { useMesGroupes } from "@/lib/soumissions";
import { labelNiveau, titreCategorie } from "@/lib/progression";
import { NIVEAUX } from "@/lib/qcm-comprendre-ia";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/mon-espace")({
  head: () => ({
    meta: [
      { title: "Mon espace — IA et la Recherche" },
      { name: "description", content: "Votre progression, vos groupes et l'historique de vos exercices." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MonEspace,
});

function MonEspace() {
  const { status, configured, user, profile } = useAuth();

  if (status === "loading") return <Coquille><p className="text-muted-foreground">Chargement…</p></Coquille>;
  if (!configured || !user) {
    return (
      <Coquille>
        <Carte>
          <p className="text-muted-foreground">
            {configured ? "Connecte-toi pour retrouver ta progression et rejoindre le groupe de ton formateur." : "Les comptes ne sont pas encore configurés sur ce site."}
          </p>
          {configured && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/connexion" className={btnPrimary}><LogIn className="h-4 w-4" /> Se connecter</Link>
              <Link to="/inscription" className={btnSecondary}><UserPlus className="h-4 w-4" /> Créer un compte</Link>
            </div>
          )}
        </Carte>
      </Coquille>
    );
  }
  return <Espace userId={user.id} nom={profile?.nom_complet || user.email || ""} />;
}

function Coquille({ children, titre = "Mon espace" }: { children: React.ReactNode; titre?: string }) {
  return (
    <SiteLayout>
      <PageHero badge="Espace apprenant" title={titre} description="Ta progression, tes groupes et l'historique de tes exercices." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">{children}</div>
    </SiteLayout>
  );
}

function Espace({ userId, nom }: { userId: string; nom: string }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();

  const groupes = useMesGroupes(userId);
  const progression = useQuery({
    queryKey: ["progression", userId],
    queryFn: async () => {
      const { data, error } = await sb.rpc("progression_apprenant", {});
      if (error) throw error;
      return data;
    },
  });
  const historique = useQuery({
    queryKey: ["historique", userId],
    queryFn: async () => {
      const { data, error, count } = await sb
        .from("tentatives")
        .select("id, type, categorie, niveau, score, total, created_at, reponses(question_id)", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return { lignes: data, total: count ?? data.length };
    },
  });

  const [code, setCode] = useState("");
  const rejoindre = useMutation({
    mutationFn: async (c: string) => {
      const { data, error } = await sb.rpc("rejoindre_groupe", { p_code: c });
      if (error) throw new Error(erreurRejoindre(error.message));
      return data[0];
    },
    onSuccess: () => {
      setCode("");
      void qc.invalidateQueries({ queryKey: ["mes-groupes", userId] });
      void qc.invalidateQueries({ queryKey: ["mes-devoirs", userId] });
    },
  });
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) rejoindre.mutate(code.trim());
  };

  const parCategorie = (progression.data ?? []).filter((p) => p.dimension === "categorie");
  const parNiveau = (progression.data ?? []).filter((p) => p.dimension === "niveau")
    .sort((a, b) => NIVEAUX.findIndex((n) => n.id === a.cle) - NIVEAUX.findIndex((n) => n.id === b.cle));
  const nbTentatives = historique.data?.total ?? 0;
  const tauxGlobal = parNiveau.length
    ? parNiveau.reduce((s, p) => s + p.taux_reussite * p.nb_tentatives, 0) / parNiveau.reduce((s, p) => s + p.nb_tentatives, 0)
    : null;

  return (
    <Coquille titre={nom ? `Bonjour ${nom.split(" ")[0]}` : "Mon espace"}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Tentatives enregistrées" valeur={nbTentatives} />
        <Stat label="Réussite moyenne" valeur={tauxGlobal === null ? "—" : `${Math.round(tauxGlobal)} %`} aide="Moyenne pondérée par tentative" />
        <Stat label="Groupes rejoints" valeur={groupes.data?.length ?? 0} />
      </div>

      <AFaire userId={userId} />
      <CopiesCorrigees userId={userId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre={<span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Mes groupes</span>}>
          <form onSubmit={soumettre} className="flex flex-col gap-3 sm:flex-row">
            <input
              aria-label="Code d'invitation"
              placeholder="Code d'invitation (6 caractères)"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={`${inputClass} font-mono tracking-widest uppercase`}
            />
            <button type="submit" disabled={code.trim().length !== 6 || rejoindre.isPending} className={`${btnPrimary} shrink-0`}>Rejoindre</button>
          </form>
          <div className="mt-3 space-y-2">
            {rejoindre.isError && <Message ton="erreur">{rejoindre.error.message}</Message>}
            {rejoindre.isSuccess && rejoindre.data && <Message ton="succes">Tu as rejoint « {rejoindre.data.nom} ». Ton formateur peut maintenant suivre ta progression.</Message>}
          </div>
          <ul className="mt-4 divide-y">
            {groupes.data?.map((g) => (
              <li key={g.groupe?.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium">{g.groupe?.nom}</span>
                <span className="text-muted-foreground">depuis le {formatDate(g.joined_at)}</span>
              </li>
            ))}
            {groupes.data?.length === 0 && <li className="py-2 text-sm text-muted-foreground">Tu n'as rejoint aucun groupe pour l'instant.</li>}
          </ul>
        </Carte>

        <Carte titre="Progression par niveau">
          <Barres
            lignes={parNiveau.map((p) => ({ cle: p.cle, label: labelNiveau(p.cle), taux: p.taux_reussite, detail: `${p.nb_tentatives} tent.` }))}
            vide="Fais quelques QCM ou exercices pour voir ta progression."
          />
        </Carte>
      </div>

      <Carte titre="Progression par catégorie">
        <Barres lignes={parCategorie.map((p) => ({ cle: p.cle, label: titreCategorie(p.cle), taux: p.taux_reussite, detail: `${p.nb_tentatives} tent.` }))} vide="Pas encore de tentative enregistrée." />
        <Link to="/exercices" className={`${btnSecondary} mt-5`}>S'exercer</Link>
      </Carte>

      <Carte titre={<span className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Historique</span>} action={nbTentatives > 30 ? <span className="text-xs text-muted-foreground">30 plus récentes sur {nbTentatives}</span> : undefined}>
        {historique.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {historique.isError && <Message ton="erreur">Impossible de charger l'historique.</Message>}
        {historique.data?.lignes.length === 0 && <p className="text-sm text-muted-foreground">Aucune tentative enregistrée pour l'instant.</p>}
        {!!historique.data?.lignes.length && <TableHistorique lignes={historique.data.lignes} />}
      </Carte>
    </Coquille>
  );
}

/** Travaux assignés par les formateurs : à faire d'abord, puis ceux déjà faits. */
function AFaire({ userId }: { userId: string }) {
  const devoirs = useQuery({
    queryKey: ["mes-devoirs", userId],
    queryFn: async () => {
      const { data, error } = await getSupabase()!.rpc("mes_devoirs", {});
      if (error) throw error;
      return data;
    },
  });
  const liste = devoirs.data ?? [];
  if (devoirs.isLoading || (!devoirs.isError && liste.length === 0)) return null;
  const aFaire = liste.filter((d) => !d.fait);
  const faits = liste.filter((d) => d.fait);

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> À faire</span>}
      action={liste.length > 0 ? <span className="text-xs text-muted-foreground">{faits.length} / {liste.length} fait{faits.length > 1 ? "s" : ""}</span> : undefined}
    >
      {devoirs.isError && <Message ton="erreur">Impossible de charger tes travaux à faire.</Message>}
      {liste.length > 0 && aFaire.length === 0 && <Message ton="succes">Bravo, tous tes travaux sont faits.</Message>}
      <ul className="space-y-3">
        {[...aFaire, ...faits].map((d) => (
          <li key={d.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 p-4 ${d.fait ? "border-border opacity-75" : "border-primary/40"}`}>
            <div className="min-w-0 space-y-1.5">
              <p className="font-semibold text-navy">{d.titre}</p>
              <p className="text-xs text-muted-foreground">Groupe « {d.groupe_nom} »</p>
              <BadgesDevoir devoir={d} />
              <p className="text-sm"><Echeance jour={d.date_limite} fait={d.fait} /></p>
              {d.type === "qcm" && !d.fait && <p className="text-xs text-muted-foreground">Réponds à au moins {SEUIL_DEVOIR_QCM} questions de cette sélection.</p>}
            </div>
            {d.fait ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tint-green px-3 py-1.5 text-sm font-semibold text-tint-green-fg"><CheckCircle2 className="h-4 w-4" /> Fait</span>
            ) : (
              <span className="flex shrink-0 flex-wrap items-center gap-2">
                {d.nb_questions > 0 && <EtatDevoir type={d.type} nbQuestions={d.nb_questions} fait={false} />}
                <Link
                  to="/exercices"
                  search={{ type: d.type, ...(d.categorie && { categorie: d.categorie }), ...(d.niveau && { niveau: d.niveau }) }}
                  hash={d.type === "qcm" ? "qcm" : "exercices-pratiques"}
                  className={btnPrimary}
                >
                  <Play className="h-4 w-4" /> {d.nb_questions > 0 ? "Continuer" : "Commencer"}
                </Link>
              </span>
            )}
          </li>
        ))}
      </ul>
    </Carte>
  );
}
