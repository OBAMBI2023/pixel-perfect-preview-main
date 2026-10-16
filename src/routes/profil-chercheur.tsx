import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PageParticipant } from "@/components/espace/EspaceParticipant";
import { btnPrimary, btnSecondary, formatDateHeure, inputClass } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { NIVEAUX_ETUDES, useEnregistrerProfil, useProfilChercheur, type ProfilSaisi } from "@/lib/recherche";
import type { NiveauEtudes } from "@/lib/supabase";

export const Route = createFileRoute("/profil-chercheur")({
  head: () => ({
    meta: [
      { title: "Mon profil chercheur — IA et la Recherche" },
      { name: "description", content: "Ta discipline, ton sujet de recherche et tes objectifs de formation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PageParticipant titre="Mon profil chercheur" description="Ton sujet de recherche sert de point de départ à tes exercices personnalisés.">
      {({ user }) => <FormulaireProfil userId={user.id} />}
    </PageParticipant>
  ),
});

type Champs = { discipline: string; niveau_etudes: NiveauEtudes | ""; etablissement: string; sujet: string; problematique: string; objectif: string };
const VIDE: Champs = { discipline: "", niveau_etudes: "", etablissement: "", sujet: "", problematique: "", objectif: "" };

function FormulaireProfil({ userId }: { userId: string }) {
  const profil = useProfilChercheur(userId);
  const enregistrer = useEnregistrerProfil(userId);
  const [champs, setChamps] = useState<Champs>(VIDE);
  const [modifie, setModifie] = useState(false);

  // Remplit le formulaire avec le profil enregistré (au chargement et après chaque sauvegarde).
  useEffect(() => {
    const p = profil.data;
    if (!p) return;
    setChamps({
      discipline: p.discipline,
      niveau_etudes: p.niveau_etudes,
      etablissement: p.etablissement ?? "",
      sujet: p.sujet,
      problematique: p.problematique ?? "",
      objectif: p.objectif,
    });
  }, [profil.data]);

  const maj = (cle: keyof Champs) => (e: { target: { value: string } }) => {
    setChamps((c) => ({ ...c, [cle]: e.target.value }));
    setModifie(true);
    enregistrer.reset();
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (!champs.niveau_etudes) return;
    const facultatif = (v: string) => v.trim() || null;
    const saisie: ProfilSaisi = {
      discipline: champs.discipline.trim(),
      niveau_etudes: champs.niveau_etudes,
      etablissement: facultatif(champs.etablissement),
      sujet: champs.sujet.trim(),
      problematique: facultatif(champs.problematique),
      objectif: champs.objectif.trim(),
    };
    enregistrer.mutate(saisie, { onSuccess: () => setModifie(false) });
  };

  if (profil.isLoading) return <p className="text-muted-foreground">Chargement de ton profil…</p>;
  if (profil.isError) {
    return (
      <Message ton="erreur">
        Impossible de charger ton profil. Vérifie ta connexion internet.{" "}
        <button type="button" onClick={() => void profil.refetch()} className="font-semibold underline">Réessayer</button>
      </Message>
    );
  }

  const label = "block text-sm font-medium";
  const aide = "mt-1 block text-xs font-normal text-muted-foreground";

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
      <Carte titre={profil.data ? "Modifier mon profil" : "Créer mon profil"}>
        <form onSubmit={soumettre} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={label}>
              Discipline ou domaine scientifique *
              <input required minLength={2} maxLength={120} value={champs.discipline} onChange={maj("discipline")} placeholder="Ex. : économie du développement" className={`${inputClass} mt-1`} />
            </label>
            <label className={label}>
              Niveau d'études *
              <select required value={champs.niveau_etudes} onChange={maj("niveau_etudes")} className={`${inputClass} mt-1`}>
                <option value="" disabled>Choisir…</option>
                {NIVEAUX_ETUDES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </label>
          </div>
          <label className={label}>
            Établissement <span className="font-normal text-muted-foreground">(facultatif)</span>
            <input maxLength={160} value={champs.etablissement} onChange={maj("etablissement")} placeholder="Université, école, laboratoire…" className={`${inputClass} mt-1`} />
          </label>
          <label className={label}>
            Sujet de recherche *
            <span className={aide}>Une phrase courte et précise : elle sera reprise dans tes exercices.</span>
            <input required minLength={5} maxLength={300} value={champs.sujet} onChange={maj("sujet")} placeholder="Ex. : l'effet du microcrédit sur l'emploi des femmes au Sénégal" className={`${inputClass} mt-1`} />
          </label>
          <label className={label}>
            Question ou problématique <span className="font-normal text-muted-foreground">(facultative)</span>
            <textarea maxLength={1000} rows={3} value={champs.problematique} onChange={maj("problematique")} className={`${inputClass} mt-1`} />
          </label>
          <label className={label}>
            Objectif personnel de formation *
            <span className={aide}>Ce que tu veux savoir faire à la fin de la formation.</span>
            <textarea required minLength={5} maxLength={1000} rows={3} value={champs.objectif} onChange={maj("objectif")} className={`${inputClass} mt-1`} />
          </label>

          {enregistrer.isError && <Message ton="erreur">{enregistrer.error.message}</Message>}
          {enregistrer.isSuccess && !modifie && <Message ton="succes">Ton profil a bien été enregistré.</Message>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="submit" disabled={enregistrer.isPending} className={btnPrimary}>
              <Save className="h-4 w-4" /> {enregistrer.isPending ? "Enregistrement…" : "Enregistrer mon profil"}
            </button>
            {profil.data && <span className="text-xs text-muted-foreground">Dernier enregistrement : {formatDateHeure(profil.data.updated_at)}</span>}
          </div>
        </form>
      </Carte>

      <div className="space-y-6">
        <Carte titre={<span className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> Confidentialité</span>}>
          <p className="text-sm text-muted-foreground">
            Toi seul peux modifier ton profil chercheur et tes exercices personnalisés. Ils sont visibles uniquement par toi et par le formateur des groupes que tu as rejoints, pour suivre ton travail et te faire des retours. Les autres participants n'y ont jamais accès.
          </p>
        </Carte>
        {profil.data && (
          <Carte titre="Et maintenant ?">
            <p className="text-sm text-muted-foreground">Tes exercices personnalisés utilisent le sujet enregistré.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/mes-exercices" className={btnPrimary}>Mes exercices <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/espace-recherche" className={btnSecondary}>Mon espace de recherche</Link>
            </div>
          </Carte>
        )}
      </div>
    </div>
  );
}
