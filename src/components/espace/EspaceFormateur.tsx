import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArchiveRestore, ArrowDown, ArrowUp, BarChart3, BookOpen, Download, Plus, Printer, Search, Share2, UserPlus, Users, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ComparaisonGroupes } from "@/components/espace/ComparaisonGroupes";
import { DevoirsGroupe } from "@/components/espace/Devoirs";
import { EnteteGroupe } from "@/components/espace/GestionGroupe";
import { TableHistorique } from "@/components/espace/TableHistorique";
import { CopiesACorriger } from "@/components/rendre/CopiesACorriger";
import { btnPrimary, btnSecondary, formatDate, formatPct, inputClass } from "@/components/espace/styles";
import { Barres, Carte, Message, Stat } from "@/components/espace/ui";
import {
  chipClass,
  construireFiltres,
  joursInactif,
  JOURS_INACTIVITE,
  PERIODES,
  rpc,
  slugFichier,
  telechargerCsv,
  useCopiesFormateur,
  useMembres,
  type Filtres,
  type Fn,
  type PeriodeId,
} from "@/lib/formateur";
import { infoQuestion, labelNiveau, titreCategorie } from "@/lib/progression";
import { NIVEAUX, type Niveau } from "@/lib/qcm-comprendre-ia";
import { getSupabase, type Groupe } from "@/lib/supabase";

type LigneApprenant = Fn["resultats_apprenants"]["Returns"][number];

function ChapitreLien({ cours, chapitre }: { cours: string; chapitre: string }) {
  return (
    <Link to="/formations/$slug" params={{ slug: cours }} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
      <BookOpen className="h-3.5 w-3.5" /> Chapitre {chapitre}
    </Link>
  );
}

/* ───────────────────────── Page ───────────────────────── */

const COMPARER = "comparer";

export function EspaceFormateur({ userId }: { userId: string }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const [vue, setVue] = useState<string | null>(null); // id du groupe affiché, ou COMPARER
  const [nom, setNom] = useState("");
  const [cree, setCree] = useState<string | null>(null);
  const [voirArchives, setVoirArchives] = useState(false);
  const [rubrique, setRubrique] = useState<"suivi" | "copies">("suivi");
  const copies = useCopiesFormateur(userId);
  const aCorriger = (copies.data ?? []).filter((c) => c.statut === "soumis").length;

  const groupes = useQuery({
    queryKey: ["groupes-formateur", userId],
    queryFn: async () => {
      const { data, error } = await sb.from("groupes").select("*").eq("formateur_id", userId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const creer = useMutation({
    mutationFn: async (n: string) => {
      const { data, error } = await sb.from("groupes").insert({ nom: n }).select().single();
      if (error) throw new Error("Impossible de créer le groupe.");
      return data;
    },
    onSuccess: (g) => {
      // Ajout direct au cache : le nouveau groupe s'ouvre sans attendre le rechargement de la liste.
      qc.setQueryData<Groupe[]>(["groupes-formateur", userId], (l) => [...(l ?? []), g]);
      setNom("");
      setVue(g.id);
      setCree(g.nom);
    },
  });
  const desarchiver = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await sb.from("groupes").update({ archive_le: null }).eq("id", id).select().single();
      if (error) throw new Error("Impossible de désarchiver le groupe.");
      return data;
    },
    onSuccess: (g) => {
      qc.setQueryData<Groupe[]>(["groupes-formateur", userId], (l) => l?.map((x) => (x.id === g.id ? g : x)));
      setVue(g.id);
    },
  });
  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    if (nom.trim()) creer.mutate(nom.trim());
  };

  useEffect(() => {
    if (!cree) return;
    const t = setTimeout(() => setCree(null), 5000);
    return () => clearTimeout(t);
  }, [cree]);

  const actifs = (groupes.data ?? []).filter((g) => !g.archive_le);
  const archives = (groupes.data ?? []).filter((g) => g.archive_le);
  const comparer = vue === COMPARER && actifs.length >= 2;
  const groupe = comparer ? undefined : actifs.find((g) => g.id === vue) ?? actifs[0];

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Rubriques de l'espace formateur" className="flex w-fit flex-wrap gap-1 rounded-full bg-muted p-1">
        {([["suivi", "Suivi des groupes"], ["copies", "Copies à corriger"]] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={rubrique === id}
            onClick={() => setRubrique(id)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${rubrique === id ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
            {id === "copies" && aCorriger > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" aria-label={`${aCorriger} en attente`}>{aCorriger}</span>
            )}
          </button>
        ))}
      </div>
      {rubrique === "copies" ? <CopiesACorriger userId={userId} groupes={groupes.data ?? []} /> : <>
      <Carte titre={<span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Mes groupes</span>}>
        <div className="flex flex-wrap gap-2">
          {actifs.map((g) => (
            <button key={g.id} onClick={() => setVue(g.id)} className={chipClass(g.id === groupe?.id)}>{g.nom}</button>
          ))}
          {actifs.length >= 2 && (
            <button onClick={() => setVue(COMPARER)} className={`${chipClass(comparer)} inline-flex items-center gap-1.5`}><BarChart3 className="h-4 w-4" /> Comparer</button>
          )}
          {groupes.isLoading && <span className="text-sm text-muted-foreground">Chargement…</span>}
          {groupes.data && actifs.length === 0 && <span className="text-sm text-muted-foreground">Crée ton premier groupe pour obtenir un lien d'invitation.</span>}
        </div>
        <form onSubmit={soumettre} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input aria-label="Nom du nouveau groupe" placeholder="Ex. : Master 1 — Promotion 2026" maxLength={120} value={nom} onChange={(e) => { setNom(e.target.value); setCree(null); }} className={inputClass} />
          <button type="submit" disabled={!nom.trim() || creer.isPending} className={`${btnPrimary} shrink-0`}><Plus className="h-4 w-4" /> Créer le groupe</button>
        </form>
        {creer.isError && <div className="mt-3"><Message ton="erreur">{creer.error.message}</Message></div>}
        {cree && <div className="mt-3"><Message ton="succes">Groupe créé : « {cree} ». Partage maintenant le lien d'invitation à tes apprenants.</Message></div>}
        {archives.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <button onClick={() => setVoirArchives(!voirArchives)} aria-expanded={voirArchives} className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
              {voirArchives ? "Masquer les groupes archivés" : `Groupes archivés (${archives.length})`}
            </button>
            {voirArchives && (
              <ul className="mt-2 divide-y">
                {archives.map((g) => (
                  <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span><span className="font-medium">{g.nom}</span> <span className="text-muted-foreground">· archivé le {formatDate(g.archive_le)}</span></span>
                    <button onClick={() => desarchiver.mutate(g.id)} disabled={desarchiver.isPending} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-primary hover:bg-muted disabled:opacity-50">
                      <ArchiveRestore className="h-4 w-4" /> Désarchiver
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {desarchiver.isError && <div className="mt-2"><Message ton="erreur">{desarchiver.error.message}</Message></div>}
          </div>
        )}
      </Carte>

      {comparer && <ComparaisonGroupes groupes={actifs} />}
      {groupe && <TableauGroupe key={groupe.id} groupe={groupe} />}
      </>}
    </div>
  );
}

/* ───────────────────────── Groupe ───────────────────────── */

const ONGLETS = [
  ["ensemble", "Vue d'ensemble"],
  ["apprenants", "Résultats par apprenant"],
  ["questions", "Questions les plus ratées"],
  ["devoirs", "Travaux assignés"],
] as const;
type Onglet = (typeof ONGLETS)[number][0];

function TableauGroupe({ groupe }: { groupe: Groupe }) {
  const membres = useMembres(groupe.id);

  return (
    <div className="space-y-6">
      <EnteteGroupe groupe={groupe} />
      {membres.isError && <Message ton="erreur">Impossible de charger les membres du groupe.</Message>}
      {membres.data?.length === 0 && <GuideDemarrage />}
      {!!membres.data?.length && <SuiviGroupe groupe={groupe} />}
    </div>
  );
}

/** État vide : tant que personne n'a rejoint le groupe, on explique la marche à suivre. */
function GuideDemarrage() {
  const etapes = [
    { icone: Share2, titre: "Partage le lien d'invitation", texte: "Copie le lien, envoie-le sur WhatsApp ou projette le QR code en séance." },
    { icone: UserPlus, titre: "Tes apprenants rejoignent le groupe", texte: "Ils se connectent ou créent leur compte, puis rejoignent le groupe automatiquement." },
    { icone: BarChart3, titre: "Leurs résultats apparaissent ici", texte: "Statistiques, réussite par catégorie, questions ratées et travaux assignés, dès le premier membre." },
  ];
  return (
    <Carte titre="Pour bien démarrer">
      <ol className="grid gap-4 md:grid-cols-3">
        {etapes.map(({ icone: Icone, titre, texte }, i) => (
          <li key={titre} className="rounded-2xl bg-muted p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">{i + 1}</span>
              <Icone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mt-3 font-semibold text-navy">{i + 1}. {titre}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{texte}</p>
          </li>
        ))}
      </ol>
    </Carte>
  );
}

function SuiviGroupe({ groupe }: { groupe: Groupe }) {
  const [periode, setPeriode] = useState<PeriodeId>("tout");
  const [niveau, setNiveau] = useState<Niveau | "">("");
  const [onglet, setOnglet] = useState<Onglet>("ensemble");
  const [apprenant, setApprenant] = useState<LigneApprenant | null>(null);

  const filtres = useMemo<Filtres>(() => construireFiltres(groupe.id, periode, niveau), [groupe.id, periode, niveau]);

  const stats = useQuery({ queryKey: ["stats_groupe", filtres], queryFn: () => rpc("stats_groupe", filtres) });
  const categories = useQuery({ queryKey: ["reussite_par_categorie", filtres], queryFn: () => rpc("reussite_par_categorie", filtres) });
  const ratees = useQuery({ queryKey: ["questions_ratees", filtres], queryFn: () => rpc("questions_ratees", { ...filtres, p_min_reponses: 3 }) });
  const s = stats.data?.[0];
  const erreur = stats.error ?? categories.error ?? ratees.error;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {PERIODES.map((p) => (
          <button key={p.id} onClick={() => setPeriode(p.id)} className={chipClass(p.id === periode)}>{p.label}</button>
        ))}
        <select aria-label="Niveau" value={niveau} onChange={(e) => setNiveau(e.target.value as Niveau | "")} className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card">
          <option value="">Tous les niveaux</option>
          {NIVEAUX.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <span className="ml-auto inline-flex flex-wrap items-center gap-2">
          <Link
            to="/formateur/seance/$groupeId"
            params={{ groupeId: groupe.id }}
            search={{ periode, ...(niveau && { niveau }) }}
            target="_blank"
            className={btnSecondary}
          >
            <Printer className="h-4 w-4" /> Fiche de séance
          </Link>
          <ExportCsv groupe={groupe} filtres={filtres} />
        </span>
      </div>

      {erreur && <Message ton="erreur">Impossible de charger les résultats : {erreur.message}</Message>}

      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {ONGLETS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${onglet === id ? "bg-card text-navy shadow-card" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {onglet === "ensemble" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Membres" valeur={s?.nb_membres ?? "—"} />
            <Stat label="Apprenants actifs" valeur={s?.nb_actifs ?? "—"} aide="Au moins une tentative sur la période" />
            <Stat label="Tentatives" valeur={s?.nb_tentatives ?? "—"} />
            <Stat label="Score moyen" valeur={formatPct(s?.score_moyen)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <Carte titre="Taux de réussite par catégorie">
              <Barres
                lignes={(categories.data ?? []).map((c) => ({ cle: c.categorie, label: titreCategorie(c.categorie), taux: c.taux_reussite, detail: `${c.nb_tentatives} tent.` }))}
                vide="Aucune tentative sur cette période."
              />
            </Carte>
            <ARevoir categories={categories.data ?? []} ratees={ratees.data ?? []} />
          </div>
        </>
      )}

      {onglet === "apprenants" && (
        <>
          {apprenant && <FicheApprenant apprenant={apprenant} onFermer={() => setApprenant(null)} />}
          <ResultatsApprenants groupeId={groupe.id} filtres={filtres} onChoisir={setApprenant} />
        </>
      )}

      {onglet === "questions" && <QuestionsRatees lignes={ratees.data} chargement={ratees.isLoading} />}

      {onglet === "devoirs" && <DevoirsGroupe groupeId={groupe.id} />}
    </>
  );
}

function ARevoir({ categories, ratees }: { categories: Fn["reussite_par_categorie"]["Returns"]; ratees: Fn["questions_ratees"]["Returns"] }) {
  const cats = categories.slice(0, 3); // déjà triées du taux le plus faible au plus fort
  const questions = ratees.slice(0, 5);
  return (
    <Carte titre={<span className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-tint-amber-fg" /> À revoir en séance</span>} className="border-2 border-tint-amber">
      {cats.length === 0 && questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Pas encore assez de réponses pour dégager des priorités.</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div>
            <h3 className="font-semibold text-navy">Catégories les plus fragiles</h3>
            <ol className="mt-2 space-y-1.5">
              {cats.map((c, i) => (
                <li key={c.categorie} className="flex items-baseline justify-between gap-3">
                  <span>{i + 1}. {titreCategorie(c.categorie)}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatPct(c.taux_reussite)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-navy">Questions les plus ratées</h3>
            {questions.length === 0 && <p className="mt-2 text-muted-foreground">Aucune question avec au moins 3 réponses.</p>}
            <ol className="mt-2 space-y-2.5">
              {questions.map((q, i) => {
                const info = infoQuestion(q.question_id);
                return (
                  <li key={q.question_id}>
                    <p>{i + 1}. {info?.enonce ?? q.question_id}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{formatPct(q.taux_echec)} d'échec</span>
                      {info && <ChapitreLien cours={info.cours} chapitre={info.chapitre} />}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </Carte>
  );
}

/* ───────────────────────── Résultats par apprenant ───────────────────────── */

type Tri = "nom_complet" | "nb_tentatives" | "score_moyen" | "derniere_activite" | "categorie_faible";

function ResultatsApprenants({ groupeId, filtres, onChoisir }: { groupeId: string; filtres: Filtres; onChoisir: (a: LigneApprenant) => void }) {
  const resultats = useQuery({ queryKey: ["resultats_apprenants", filtres], queryFn: () => rpc("resultats_apprenants", filtres) });
  // Inactivité calculée sur toute l'activité, indépendamment des filtres de période et de niveau.
  const activite = useQuery({ queryKey: ["activite_membres", groupeId], queryFn: () => rpc("activite_membres", { p_groupe: groupeId }) });
  const [recherche, setRecherche] = useState("");
  const [aRelancer, setARelancer] = useState(false);
  const [tri, setTri] = useState<{ col: Tri; asc: boolean }>({ col: "nom_complet", asc: true });

  const inactifs = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of activite.data ?? []) {
      const j = joursInactif(a.derniere_activite, a.joined_at);
      if (j !== null) m.set(a.apprenant_id, j);
    }
    return m;
  }, [activite.data]);

  const lignes = useMemo(() => {
    const q = recherche.trim().toLocaleLowerCase("fr");
    const filtrees = (resultats.data ?? []).filter((l) => (!q || l.nom_complet.toLocaleLowerCase("fr").includes(q)) && (!aRelancer || inactifs.has(l.apprenant_id)));
    const val = (l: LigneApprenant): string | number | null => (tri.col === "categorie_faible" ? (l.categorie_faible ? titreCategorie(l.categorie_faible) : null) : l[tri.col]);
    return [...filtrees].sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va === vb) return 0;
      if (va === null) return 1; // valeurs vides toujours en bas
      if (vb === null) return -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "fr");
      return tri.asc ? cmp : -cmp;
    });
  }, [resultats.data, recherche, tri, aRelancer, inactifs]);

  const Entete = ({ col, children, droite }: { col: Tri; children: ReactNode; droite?: boolean }) => (
    <th className={`py-2 pr-3 ${droite ? "text-right" : ""}`} aria-sort={tri.col === col ? (tri.asc ? "ascending" : "descending") : "none"}>
      <button onClick={() => setTri({ col, asc: tri.col === col ? !tri.asc : col === "nom_complet" || col === "categorie_faible" })} className="inline-flex items-center gap-1 uppercase hover:text-foreground">
        {children}
        {tri.col === col && (tri.asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <Carte
      titre="Résultats par apprenant"
      action={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            onClick={() => setARelancer(!aRelancer)}
            aria-pressed={aRelancer}
            title={`Aucune tentative depuis au moins ${JOURS_INACTIVITE} jours`}
            className={`${chipClass(aRelancer)} shrink-0`}
          >
            À relancer ({inactifs.size})
          </button>
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label="Rechercher un apprenant" placeholder="Rechercher un apprenant" value={recherche} onChange={(e) => setRecherche(e.target.value)} className={`${inputClass} pl-9`} />
          </label>
        </div>
      }
    >
      {resultats.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {resultats.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun membre dans ce groupe pour l'instant.</p>}
      {!!resultats.data?.length && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <Entete col="nom_complet">Apprenant</Entete>
                <Entete col="nb_tentatives" droite>Tentatives</Entete>
                <Entete col="score_moyen" droite>Score moyen</Entete>
                <Entete col="derniere_activite">Dernière activité</Entete>
                <Entete col="categorie_faible">Catégorie la plus faible</Entete>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lignes.map((l) => (
                <tr key={l.apprenant_id} onClick={() => onChoisir(l)} className="cursor-pointer hover:bg-muted">
                  <td className="py-2.5 pr-3">
                    <button onClick={(e) => { e.stopPropagation(); onChoisir(l); }} className="font-semibold text-navy hover:underline">{l.nom_complet || "Sans nom"}</button>
                    {inactifs.has(l.apprenant_id) && (
                      <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-tint-amber px-2 py-0.5 text-xs font-semibold text-tint-amber-fg">
                        Inactif depuis {inactifs.get(l.apprenant_id)} jours
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{l.nb_tentatives}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{formatPct(l.score_moyen)}</td>
                  <td className="py-2.5 pr-3">{formatDate(l.derniere_activite)}</td>
                  <td className="py-2.5 pr-3">{titreCategorie(l.categorie_faible)}</td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    {aRelancer && !recherche.trim() ? `Personne à relancer : tous les membres ont été actifs ces ${JOURS_INACTIVITE} derniers jours.` : `Aucun apprenant ne correspond à « ${recherche} »${aRelancer ? " parmi ceux à relancer" : ""}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Carte>
  );
}

function FicheApprenant({ apprenant, onFermer }: { apprenant: LigneApprenant; onFermer: () => void }) {
  const sb = getSupabase()!;
  const progression = useQuery({
    queryKey: ["progression", apprenant.apprenant_id],
    queryFn: () => rpc("progression_apprenant", { p_apprenant: apprenant.apprenant_id }),
  });
  const historique = useQuery({
    queryKey: ["historique", apprenant.apprenant_id],
    queryFn: async () => {
      const { data, error } = await sb
        .from("tentatives")
        .select("id, type, categorie, niveau, score, total, created_at, reponses(question_id)")
        .eq("user_id", apprenant.apprenant_id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
  const cats = (progression.data ?? []).filter((p) => p.dimension === "categorie").sort((a, b) => a.taux_reussite - b.taux_reussite);

  return (
    <Carte
      titre={`Fiche de ${apprenant.nom_complet || "l'apprenant"}`}
      action={<button onClick={onFermer} className="rounded-full p-2 hover:bg-muted" aria-label="Fermer la fiche"><X className="h-5 w-5" /></button>}
      className="border-2 border-primary"
    >
      <p className="text-sm text-muted-foreground">
        {apprenant.nb_tentatives} tentative(s) · score moyen {formatPct(apprenant.score_moyen)} · dernière activité {formatDate(apprenant.derniere_activite)}
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div>
          <h3 className="mb-3 font-semibold text-navy">Réussite par catégorie</h3>
          <Barres lignes={cats.map((c) => ({ cle: c.cle, label: titreCategorie(c.cle), taux: c.taux_reussite, detail: `${c.nb_tentatives} tent.` }))} vide="Aucune tentative." />
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-navy">Historique (30 dernières tentatives)</h3>
          {historique.data?.length ? <TableHistorique lignes={historique.data} /> : <p className="text-sm text-muted-foreground">{historique.isLoading ? "Chargement…" : "Aucune tentative."}</p>}
        </div>
      </div>
    </Carte>
  );
}

/* ───────────────────────── Questions les plus ratées ───────────────────────── */

function QuestionsRatees({ lignes, chargement }: { lignes: Fn["questions_ratees"]["Returns"] | undefined; chargement: boolean }) {
  return (
    <Carte titre="Questions les plus ratées" action={<span className="text-xs text-muted-foreground">Au moins 3 réponses pour figurer</span>}>
      {chargement && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {lignes?.length === 0 && <p className="text-sm text-muted-foreground">Aucune question ratée avec au moins 3 réponses sur cette période.</p>}
      <ol className="space-y-3">
        {lignes?.map((q, i) => {
          const info = infoQuestion(q.question_id);
          return (
            <li key={q.question_id} className="rounded-xl border-2 border-border p-4">
              <div className="flex items-start gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{info?.enonce ?? `Question inconnue (${q.question_id})`}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {info && <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold text-secondary-foreground">{info.genre}</span>}
                    {info && <span className="rounded-full bg-muted px-2.5 py-0.5">{titreCategorie(info.categorie)}</span>}
                    {info && <span className="rounded-full bg-muted px-2.5 py-0.5">{labelNiveau(info.niveau)}</span>}
                    {info && <ChapitreLien cours={info.cours} chapitre={info.chapitre} />}
                  </div>
                  {q.reponse_frequente && (
                    <p className="mt-2 text-sm"><strong>Mauvaise réponse la plus choisie :</strong> {info ? info.lireReponse(q.reponse_frequente) : q.reponse_frequente}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-xl font-bold text-destructive">{formatPct(q.taux_echec)}</div>
                  <div className="text-xs text-muted-foreground">{q.nb_echecs} échec(s) / {q.nb_reponses}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Carte>
  );
}

/* ───────────────────────── Export CSV ───────────────────────── */

function ExportCsv({ groupe, filtres }: { groupe: Groupe; filtres: Filtres }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);
  const exporter = async () => {
    setEnCours(true);
    setErreur(false);
    try {
      const lignes = await rpc("tentatives_groupe", filtres);
      const entete = ["Apprenant", "Date", "Type", "Catégorie", "Niveau", "Score", "Total", "Réussite (%)"];
      const corps = lignes.map((l) => [
        l.nom_complet,
        new Date(l.created_at).toLocaleString("fr-FR"),
        l.type === "qcm" ? "QCM" : "Exercice",
        titreCategorie(l.categorie),
        labelNiveau(l.niveau),
        l.score,
        l.total,
        Math.round((100 * l.score) / l.total),
      ]);
      telechargerCsv(`resultats-${slugFichier(groupe.nom)}-${new Date().toISOString().slice(0, 10)}.csv`, [entete, ...corps]);
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  };
  return (
    <span className="ml-auto inline-flex items-center gap-2">
      {erreur && <span className="text-xs text-destructive">Export impossible</span>}
      <button onClick={exporter} disabled={enCours} className={btnSecondary}><Download className="h-4 w-4" /> {enCours ? "Export…" : "Exporter en CSV"}</button>
    </span>
  );
}
