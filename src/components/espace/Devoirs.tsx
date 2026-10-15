import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, ChevronDown, ChevronUp, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Confirmer } from "@/components/espace/Confirmer";
import { btnPrimary, formatDate, formatJour, formatPct, inputClass, jourDansNJours, joursAvant } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { rpc, SEUIL_DEVOIR_QCM, type Fn } from "@/lib/formateur";
import { labelNiveau, titreCategorie } from "@/lib/progression";
import { CATEGORIES, NIVEAUX, type Niveau } from "@/lib/qcm-comprendre-ia";
import { getSupabase, type Devoir, type TypeTentative } from "@/lib/supabase";

type LigneSuivi = Fn["suivi_devoirs"]["Returns"][number];

const selectClass = "w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary";

/** Badges type / catégorie / niveau d'un devoir (partagés avec l'espace apprenant). */
export function BadgesDevoir({ devoir }: { devoir: Pick<Devoir, "type" | "categorie" | "niveau"> }) {
  return (
    <span className="flex flex-wrap gap-1.5 text-xs">
      <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">{devoir.type === "qcm" ? "QCM" : "Exercices pratiques"}</span>
      <span className="rounded-full bg-muted px-2.5 py-0.5">{devoir.categorie ? titreCategorie(devoir.categorie) : "Toutes catégories"}</span>
      <span className="rounded-full bg-muted px-2.5 py-0.5">{devoir.niveau ? labelNiveau(devoir.niveau) : "Tous niveaux"}</span>
    </span>
  );
}

/** Fait / En cours (x/5, devoirs QCM) / Pas encore. */
export function EtatDevoir({ type, nbQuestions, fait }: { type: TypeTentative; nbQuestions: number; fait: boolean }) {
  if (fait) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-tint-green px-2.5 py-0.5 text-xs font-semibold text-tint-green-fg"><Check className="h-3 w-3" /> Fait</span>;
  }
  if (type === "qcm" && nbQuestions > 0) {
    return <span className="rounded-full bg-tint-amber px-2.5 py-0.5 text-xs font-semibold text-tint-amber-fg">En cours ({nbQuestions}/{SEUIL_DEVOIR_QCM})</span>;
  }
  return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Pas encore</span>;
}

/** « Pour le … », avec « en retard » / « aujourd'hui » quand c'est utile. */
export function Echeance({ jour, fait = false }: { jour: string | null; fait?: boolean }) {
  if (!jour) return <span className="text-muted-foreground">Sans date limite</span>;
  const reste = joursAvant(jour);
  const alerte = !fait && reste < 0 ? "En retard" : !fait && reste === 0 ? "Aujourd'hui" : null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <CalendarClock className="h-4 w-4 text-muted-foreground" /> Pour le {formatJour(jour)}
      {alerte && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${reste < 0 ? "bg-tint-rose text-tint-rose-fg" : "bg-tint-amber text-tint-amber-fg"}`}>{alerte}</span>}
    </span>
  );
}

export function DevoirsGroupe({ groupeId }: { groupeId: string }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const devoirs = useQuery({
    queryKey: ["devoirs", groupeId],
    queryFn: async () => {
      const { data, error } = await sb.from("devoirs").select("*").eq("groupe_id", groupeId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const suivi = useQuery({ queryKey: ["suivi_devoirs", groupeId], queryFn: () => rpc("suivi_devoirs", { p_groupe: groupeId }) });
  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("devoirs").delete().eq("id", id);
      if (error) throw new Error("Impossible de supprimer ce devoir.");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devoirs", groupeId] }),
  });

  const parDevoir = new Map<string, LigneSuivi[]>();
  for (const l of suivi.data ?? []) parDevoir.set(l.devoir_id, [...(parDevoir.get(l.devoir_id) ?? []), l]);

  return (
    <div className="space-y-6">
      <NouveauDevoir groupeId={groupeId} />
      <Carte titre={<span className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Travaux assignés</span>}>
        {(devoirs.error ?? suivi.error) && <Message ton="erreur">Impossible de charger les travaux assignés.</Message>}
        {supprimer.isError && <Message ton="erreur">{supprimer.error.message}</Message>}
        {devoirs.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {devoirs.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun travail assigné. Crée-en un ci-dessus : il apparaîtra dans « À faire » chez tes apprenants.</p>}
        <ul className="space-y-3">
          {devoirs.data?.map((d) => (
            <LigneDevoir key={d.id} devoir={d} suivi={parDevoir.get(d.id) ?? []} onSupprimer={() => supprimer.mutate(d.id)} />
          ))}
        </ul>
      </Carte>
    </div>
  );
}

function NouveauDevoir({ groupeId }: { groupeId: string }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeTentative>("qcm");
  const [categorie, setCategorie] = useState("");
  const [niveau, setNiveau] = useState<Niveau | "">("");
  const [dateLimite, setDateLimite] = useState(() => jourDansNJours(7));

  const creer = useMutation({
    mutationFn: async () => {
      const { error } = await sb.from("devoirs").insert({
        groupe_id: groupeId,
        titre: titre.trim(),
        type,
        categorie: categorie || null,
        niveau: niveau || null,
        date_limite: dateLimite || null,
      });
      if (error) throw new Error("Impossible de créer le devoir.");
    },
    onSuccess: () => {
      setTitre("");
      void qc.invalidateQueries({ queryKey: ["devoirs", groupeId] });
      void qc.invalidateQueries({ queryKey: ["suivi_devoirs", groupeId] });
    },
  });
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (titre.trim()) creer.mutate();
  };

  return (
    <Carte titre="Assigner un travail">
      <form onSubmit={soumettre} className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr_1fr_1fr]">
        <label className="text-sm font-medium md:col-span-2 lg:col-span-1">
          Titre
          <input required maxLength={120} placeholder="Ex. : Réviser les prompts avant jeudi" value={titre} onChange={(e) => { setTitre(e.target.value); creer.reset(); }} className={`${inputClass} mt-1`} />
        </label>
        <label className="text-sm font-medium">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as TypeTentative)} className={`${selectClass} mt-1`}>
            <option value="qcm">QCM</option>
            <option value="exercice">Exercices pratiques</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Catégorie
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={`${selectClass} mt-1`}>
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Niveau
          <select value={niveau} onChange={(e) => setNiveau(e.target.value as Niveau | "")} className={`${selectClass} mt-1`}>
            <option value="">Tous les niveaux</option>
            {NIVEAUX.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Date limite
          <input type="date" value={dateLimite} min={jourDansNJours(0)} onChange={(e) => setDateLimite(e.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2 lg:col-span-5">
          <button type="submit" disabled={!titre.trim() || creer.isPending} className={btnPrimary}><Plus className="h-4 w-4" /> Assigner au groupe</button>
          {creer.isSuccess && <span role="status" className="text-sm font-medium text-success">Travail assigné.</span>}
          {creer.isError && <span role="alert" className="text-sm text-destructive">{creer.error.message}</span>}
        </div>
      </form>
    </Carte>
  );
}

/** Seuls le titre et la date limite se modifient (GRANT update limité côté base). */
function ModifierDevoir({ devoir, onFermer }: { devoir: Devoir; onFermer: () => void }) {
  const qc = useQueryClient();
  const [titre, setTitre] = useState(devoir.titre);
  const [dateLimite, setDateLimite] = useState(devoir.date_limite ?? "");

  const modifier = useMutation({
    mutationFn: async () => {
      const { data, error } = await getSupabase()!
        .from("devoirs")
        .update({ titre: titre.trim(), date_limite: dateLimite || null })
        .eq("id", devoir.id)
        .select()
        .single();
      if (error) throw new Error("Impossible de modifier ce devoir.");
      return data;
    },
    onSuccess: (d) => {
      qc.setQueryData<Devoir[]>(["devoirs", devoir.groupe_id], (l) => l?.map((x) => (x.id === d.id ? d : x)));
      onFermer();
    },
  });
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (titre.trim()) modifier.mutate();
  };

  return (
    <form onSubmit={soumettre} className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[2fr_1fr]">
      <label className="text-sm font-medium">
        Titre
        <input required autoFocus maxLength={120} value={titre} onChange={(e) => setTitre(e.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        Date limite <span className="font-normal text-muted-foreground">(facultative)</span>
        <input type="date" value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button type="submit" disabled={!titre.trim() || modifier.isPending} className={btnPrimary}>Enregistrer</button>
        <button type="button" onClick={onFermer} className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">Annuler</button>
        <span className="text-xs text-muted-foreground">Le type, la catégorie et le niveau ne se modifient pas : supprime le devoir et crée-en un autre si besoin.</span>
        {modifier.isError && <span role="alert" className="text-sm text-destructive">{modifier.error.message}</span>}
      </div>
    </form>
  );
}

function LigneDevoir({ devoir, suivi, onSupprimer }: { devoir: Devoir; suivi: LigneSuivi[]; onSupprimer: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [edition, setEdition] = useState(false);
  const faits = suivi.filter((l) => l.fait);
  const enCours = suivi.filter((l) => !l.fait && l.nb_questions > 0).length;
  const rang = (l: LigneSuivi) => (l.fait ? 2 : l.nb_questions > 0 ? 1 : 0);
  const scores = faits.map((l) => l.score_moyen).filter((s): s is number => s !== null);
  const moyenne = scores.length ? scores.reduce((a, b) => a + Number(b), 0) / scores.length : null;

  return (
    <li className="rounded-xl border-2 border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {edition ? (
          <ModifierDevoir devoir={devoir} onFermer={() => setEdition(false)} />
        ) : (
          <div className="min-w-0 space-y-2">
            <h3 className="font-semibold text-navy">{devoir.titre}</h3>
            <BadgesDevoir devoir={devoir} />
            <p className="text-sm"><Echeance jour={devoir.date_limite} /></p>
          </div>
        )}
        <div className="flex shrink-0 items-start gap-4">
          <div className="text-right">
            <div className="font-display text-xl font-bold text-navy">{faits.length} / {suivi.length}</div>
            <div className="text-xs text-muted-foreground">l'ont fait</div>
            {enCours > 0 && <div className="text-xs text-tint-amber-fg">{enCours} en cours</div>}
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-bold text-navy">{formatPct(moyenne === null ? null : Math.round(moyenne * 10) / 10)}</div>
            <div className="text-xs text-muted-foreground">score moyen</div>
          </div>
          {!edition && (
            <button onClick={() => setEdition(true)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground">
              <Pencil className="h-4 w-4" /> Modifier
            </button>
          )}
          <Confirmer
            declencheur={<button className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Supprimer le devoir ${devoir.titre}`} title="Supprimer"><Trash2 className="h-4 w-4" /></button>}
            titre="Supprimer ce travail ?"
            description={<>« {devoir.titre} » disparaîtra de la liste « À faire » de tes apprenants. Leurs tentatives sont conservées.</>}
            libelle="Supprimer"
            onConfirmer={onSupprimer}
          />
        </div>
      </div>
      {suivi.length > 0 && (
        <button onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {ouvert ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} {ouvert ? "Masquer le détail" : "Qui l'a fait ?"}
        </button>
      )}
      {ouvert && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Apprenant</th>
                <th className="py-2 pr-3">État</th>
                <th className="py-2 pr-3 text-right">{devoir.type === "qcm" ? "Questions" : "Exercices"}</th>
                <th className="py-2 pr-3 text-right">Score</th>
                <th className="py-2 pr-3">Dernière fois</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...suivi].sort((a, b) => rang(b) - rang(a)).map((l) => (
                <tr key={l.apprenant_id}>
                  <td className="py-2 pr-3 font-medium">{l.nom_complet || "Sans nom"}</td>
                  <td className="py-2 pr-3"><EtatDevoir type={devoir.type} nbQuestions={l.nb_questions} fait={l.fait} /></td>
                  <td className="py-2 pr-3 text-right tabular-nums">{l.nb_questions}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatPct(l.score_moyen)}</td>
                  <td className="py-2 pr-3">{formatDate(l.derniere_tentative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}
