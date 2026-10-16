import { ClipboardCheck, Search, Users } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { BadgeStatut, FicheSuivi } from "@/components/espace/FicheSuivi";
import { CourbeHebdo } from "@/components/espace/CourbeHebdo";
import { formatDate, formatDateHeure, formatPct, inputClass } from "@/components/espace/styles";
import { Carte, Message, Stat } from "@/components/espace/ui";
import { chipClass, PERIODES, type PeriodeId } from "@/lib/formateur";
import {
  progressionLecons,
  serieHebdomadaire,
  STATUTS_TRAVAIL,
  tauxReussite,
  travauxApprenant,
  TYPES_TRAVAIL,
  useDonneesSuivi,
  type StatutTravail,
  type TravailSuivi,
  type TypeTravail,
} from "@/lib/suivi";
import type { Groupe } from "@/lib/supabase";

const selectClass = "rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card";
const SOUMIS: StatutTravail[] = ["a_corriger", "a_refaire", "corrige"];

/** Rubrique « Suivi des apprenants » : membres de tous les groupes actifs du formateur. */
export function SuiviApprenants({ userId, groupes }: { userId: string; groupes: Groupe[] }) {
  const actifs = useMemo(() => groupes.filter((g) => !g.archive_le), [groupes]);
  const donnees = useDonneesSuivi(userId, actifs);
  const [recherche, setRecherche] = useState("");
  const [groupeId, setGroupeId] = useState("");
  const [type, setType] = useState<TypeTravail | "">("");
  const [statut, setStatut] = useState<StatutTravail | "">("");
  const [periode, setPeriode] = useState<PeriodeId>("tout");
  const [fiche, setFiche] = useState<{ id: string; focus: string | null } | null>(null);
  const haut = useRef<HTMLDivElement>(null);

  const debut = useMemo(() => {
    const jours = PERIODES.find((p) => p.id === periode)?.jours ?? null;
    return jours === null ? null : new Date(new Date().setHours(0, 0, 0, 0) - jours * 86_400_000).toISOString();
  }, [periode]);
  const dansPeriode = (d: string | null) => !debut || (d !== null && d >= debut);

  const vue = useMemo(() => {
    const d = donnees.data;
    if (!d) return null;
    const q = recherche.trim().toLocaleLowerCase("fr");
    const lignes = d.membres
      .filter((m) => (!groupeId || m.groupes.some((g) => g.id === groupeId)) && (!q || m.nom.toLocaleLowerCase("fr").includes(q)))
      .map((m) => {
        const tentatives = d.tentatives.filter((t) => t.user_id === m.id);
        const tentativesPeriode = tentatives.filter((t) => dansPeriode(t.created_at));
        const travaux = travauxApprenant(m.id, d).filter(
          (t) => (!type || t.type === type) && (t.statut === "non_commence" || dansPeriode(t.date)),
        );
        const dates = [tentatives[0]?.created_at ?? null, ...travaux.map((t) => t.date)].filter((x): x is string => !!x).sort();
        return {
          membre: m,
          tentativesPeriode,
          taux: tauxReussite(tentativesPeriode),
          lecons: progressionLecons(tentatives.flatMap((t) => t.reponses)),
          travaux,
          realises: travaux.filter((t) => SOUMIS.includes(t.statut)).length,
          aCorriger: travaux.filter((t) => t.statut === "a_corriger").length,
          corriges: travaux.filter((t) => t.statut === "corrige").length,
          derniere: dates[dates.length - 1] ?? null,
        };
      })
      .filter((l) => !statut || l.travaux.some((t) => t.statut === statut));
    const tous = lignes.flatMap((l) => l.travaux);
    const tentatives = lignes.flatMap((l) => l.tentativesPeriode);
    return {
      lignes,
      nbActifs: lignes.filter((l) => l.tentativesPeriode.length > 0 || l.travaux.some((t) => t.statut !== "non_commence" && dansPeriode(t.date))).length,
      nbSoumis: tous.filter((t) => SOUMIS.includes(t.statut)).length,
      aCorriger: tous.filter((t) => t.statut === "a_corriger").sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")),
      taux: tauxReussite(tentatives),
      serie: serieHebdomadaire(tentatives),
    };
    // dansPeriode dépend de debut
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnees.data, recherche, groupeId, type, statut, debut]);

  const ouvrir = (id: string, focus: string | null = null) => {
    setFiche({ id, focus });
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const nom = (id: string) => donnees.data?.membres.find((m) => m.id === id)?.nom ?? "Apprenant";
  const membreFiche = fiche && donnees.data?.membres.find((m) => m.id === fiche.id);

  if (actifs.length === 0) return <Message>Crée un groupe et partage son lien d'invitation : les apprenants qui le rejoignent apparaîtront ici.</Message>;
  if (donnees.isLoading) return <p className="text-muted-foreground">Chargement du suivi…</p>;
  if (donnees.isError) {
    return (
      <Message ton="erreur">
        Impossible de charger le suivi des apprenants.{" "}
        <button type="button" onClick={() => void donnees.refetch()} className="font-semibold underline">Réessayer</button>
      </Message>
    );
  }
  if (!vue || donnees.data!.membres.length === 0) return <Message>Aucun apprenant n'a encore rejoint tes groupes actifs.</Message>;

  return (
    <div ref={haut} className="scroll-mt-24 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODES.map((p) => <button key={p.id} type="button" onClick={() => setPeriode(p.id)} className={chipClass(p.id === periode)}>{p.label}</button>)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input aria-label="Rechercher un apprenant par son nom" placeholder="Rechercher par nom" value={recherche} onChange={(e) => setRecherche(e.target.value)} className={`${inputClass} pl-9`} />
          </label>
          <select aria-label="Groupe" value={groupeId} onChange={(e) => setGroupeId(e.target.value)} className={selectClass}>
            <option value="">Tous les groupes</option>
            {actifs.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
          <select aria-label="Type d'exercice" value={type} onChange={(e) => setType(e.target.value as TypeTravail | "")} className={selectClass}>
            <option value="">Tous les travaux</option>
            {TYPES_TRAVAIL.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select aria-label="Statut" value={statut} onChange={(e) => setStatut(e.target.value as StatutTravail | "")} className={selectClass}>
            <option value="">Tous les statuts</option>
            {STATUTS_TRAVAIL.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {membreFiche && <FicheSuivi key={membreFiche.id} membre={membreFiche} donnees={donnees.data!} formateurId={userId} focus={fiche.focus} onFermer={() => setFiche(null)} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Apprenants suivis" valeur={vue.lignes.length} />
        <Stat label="Apprenants actifs" valeur={vue.nbActifs} aide="Au moins une activité enregistrée sur la période" />
        <Stat label="Travaux soumis" valeur={vue.nbSoumis} aide="Sur la période" />
        <Stat label="À corriger" valeur={vue.aCorriger.length} />
        <Stat label="Taux de réussite" valeur={formatPct(vue.taux)} aide="QCM, leçons et exercices auto-corrigés" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Carte titre="Évolution des résultats">
          <CourbeHebdo serie={vue.serie} />
          <p className="mt-2 text-xs text-muted-foreground">Taux de réussite hebdomadaire (courbe) et nombre de réponses (barres) des apprenants affichés.</p>
        </Carte>
        <Carte titre={<span className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> À corriger</span>}>
          {vue.aCorriger.length === 0 ? (
            <Message ton="succes">Aucun travail en attente de correction.</Message>
          ) : (
            <ul className="divide-y text-sm">
              {vue.aCorriger.slice(0, 8).map((t: TravailSuivi) => (
                <li key={`${t.apprenantId}-${t.cle}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">{nom(t.apprenantId)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t.titre} · {t.date ? formatDateHeure(t.date) : "—"}</span>
                  </span>
                  <button type="button" onClick={() => ouvrir(t.apprenantId, t.cle)} className="text-sm font-semibold text-primary hover:underline">Corriger</button>
                </li>
              ))}
            </ul>
          )}
          {vue.aCorriger.length > 8 && <p className="mt-2 text-xs text-muted-foreground">et {vue.aCorriger.length - 8} autre(s), les plus anciens d'abord.</p>}
        </Carte>
      </div>

      <Carte titre={<span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Apprenants</span>}>
        {vue.lignes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun apprenant ne correspond à ces filtres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Apprenant</th>
                  <th className="py-2 pr-3 text-right">Réponses</th>
                  <th className="py-2 pr-3 text-right">Réussite</th>
                  <th className="py-2 pr-3">Leçons réussies</th>
                  <th className="py-2 pr-3 text-right">Travaux soumis</th>
                  <th className="py-2 pr-3 text-right">À corriger</th>
                  <th className="py-2 pr-3 text-right">Corrigés</th>
                  <th className="py-2">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vue.lignes.map((l) => (
                  <tr key={l.membre.id} onClick={() => ouvrir(l.membre.id)} className="cursor-pointer hover:bg-muted">
                    <td className="py-2.5 pr-3">
                      <button type="button" onClick={(e) => { e.stopPropagation(); ouvrir(l.membre.id); }} className="font-semibold text-navy hover:underline">{l.membre.nom}</button>
                      <span className="block text-xs text-muted-foreground">{l.membre.groupes.map((g) => g.nom).join(", ")}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{l.tentativesPeriode.length}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{formatPct(l.taux)}</td>
                    <td className="py-2.5 pr-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-20 overflow-hidden rounded-full bg-muted" role="presentation"><span className="block h-full rounded-full bg-primary" style={{ width: `${(l.lecons.reussies / l.lecons.total) * 100}%` }} /></span>
                        <span className="tabular-nums">{l.lecons.reussies}/{l.lecons.total}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{l.realises}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{l.aCorriger > 0 ? <span className="rounded-full bg-tint-amber px-2 py-0.5 font-semibold text-tint-amber-fg">{l.aCorriger}</span> : 0}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{l.corriges}</td>
                    <td className="py-2.5">{formatDate(l.derniere)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Indicateurs pédagogiques issus des données enregistrées : le nombre de travaux terminés ne mesure pas la maîtrise, et le taux de réussite n'est pas une certification de niveau.
          Les leçons sont comptées comme réussies quand au moins 75 % des questions de leur quiz ont été réussies au moins une fois avec le compte connecté.
        </p>
      </Carte>

      {statut && (
        <Carte titre={`Travaux « ${STATUTS_TRAVAIL.find((s) => s.id === statut)?.label} »`}>
          <ul className="divide-y text-sm">
            {vue.lignes.flatMap((l) => l.travaux.filter((t) => t.statut === statut)).map((t) => (
              <li key={`${t.apprenantId}-${t.cle}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0"><span className="font-medium">{nom(t.apprenantId)}</span> · {t.titre}</span>
                <span className="flex items-center gap-2"><BadgeStatut t={t} /><button type="button" onClick={() => ouvrir(t.apprenantId, t.cle)} className="text-sm font-semibold text-primary hover:underline">Ouvrir</button></span>
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </div>
  );
}
