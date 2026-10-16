import { CheckCircle2, ChevronDown, ExternalLink, RotateCcw, X, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { btnPrimary, btnSecondary, formatDate, formatDateHeure, formatPct, inputClass } from "@/components/espace/styles";
import { Carte, Message, Stat } from "@/components/espace/ui";
import { PointsRetour } from "@/components/espace/RetourFormateur";
import { CourbeHebdo } from "@/components/espace/CourbeHebdo";
import { CorrectionCopie } from "@/components/rendre/CopiesACorriger";
import { APPRECIATIONS, articlePertinence, CRITERES, PERTINENCES, POINTS_A_VERIFIER, type Appreciation, type CritereId } from "@/data/articles-pertinence";
import { exerciceARendre } from "@/data/exercices-a-rendre";
import { DECISIONS } from "@/lib/pertinence";
import { infoQuestion } from "@/lib/progression";
import { labelNiveauEtudes, lireContenu } from "@/lib/recherche";
import { formatNote } from "@/lib/soumissions";
import {
  progressionLecons,
  serieHebdomadaire,
  statutTravail,
  tauxReussite,
  travauxApprenant,
  TYPES_TRAVAIL,
  useEnregistrerRetour,
  type DonneesSuivi,
  type MembreSuivi,
  type TravailSuivi,
} from "@/lib/suivi";
import type { CopieFormateur } from "@/lib/formateur";
import type { AnalysePertinence, ObjetRetour, RetourFormateur, TravailRecherche } from "@/lib/supabase";

export function BadgeStatut({ t }: { t: TravailSuivi }) {
  const s = statutTravail(t.statut);
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.classe}`}>{s.label}</span>;
}

/* ───────── Formulaire de retour (exercices personnalisés et analyses) ───────── */

function FormulaireRetour({ apprenantId, objet, objetId, retour, indication }: { apprenantId: string; objet: ObjetRetour; objetId: string; retour: RetourFormateur | undefined; indication?: string }) {
  const enregistrer = useEnregistrerRetour();
  const [note, setNote] = useState(retour?.note !== null && retour?.note !== undefined ? String(retour.note) : "");
  const [sur, setSur] = useState(retour?.note_sur ? String(retour.note_sur) : "20");
  const [appreciation, setAppreciation] = useState(retour?.appreciation ?? "");
  const [acquis, setAcquis] = useState(retour?.points_acquis ?? "");
  const [ameliorer, setAmeliorer] = useState(retour?.points_a_ameliorer ?? "");
  const [fait, setFait] = useState<"corrige" | "a_refaire" | null>(null);

  const n = note.trim() === "" ? null : Number(note.replace(",", "."));
  const s = Number(sur.replace(",", "."));
  const noteInvalide = n !== null && (!Number.isFinite(n) || !Number.isFinite(s) || s <= 0 || s > 100 || n < 0 || n > s);
  const maj = <T,>(f: (v: T) => void) => (v: T) => { f(v); setFait(null); enregistrer.reset(); };

  const envoyer = (statut: "corrige" | "a_refaire") =>
    enregistrer.mutate(
      {
        p_apprenant: apprenantId,
        p_objet: objet,
        p_objet_id: objetId,
        p_note: n,
        p_note_sur: n === null ? null : s,
        p_appreciation: appreciation,
        p_points_acquis: acquis,
        p_points_a_ameliorer: ameliorer,
        p_statut: statut,
      },
      { onSuccess: () => setFait(statut) },
    );

  return (
    <div className="mt-4 rounded-xl border-2 border-primary/30 p-4">
      <h4 className="font-semibold text-navy">{retour ? "Modifier mon retour" : "Mon retour"}</h4>
      {indication && <p className="mt-1 text-xs text-muted-foreground">{indication}</p>}
      <div className="mt-3 flex flex-wrap items-end gap-2 text-sm">
        <label className="font-medium">
          Note <span className="font-normal text-muted-foreground">(facultative)</span>
          <input inputMode="decimal" value={note} onChange={(e) => maj(setNote)(e.target.value)} aria-invalid={noteInvalide} className={`mt-1 block w-24 rounded-lg border-2 bg-background px-2 py-1.5 text-right tabular-nums ${noteInvalide ? "border-destructive" : "border-border"}`} />
        </label>
        <span className="pb-2">sur</span>
        <label>
          <span className="sr-only">Barème</span>
          <input inputMode="decimal" value={sur} onChange={(e) => maj(setSur)(e.target.value)} className="block w-20 rounded-lg border-2 border-border bg-background px-2 py-1.5 text-right tabular-nums" />
        </label>
      </div>
      {noteInvalide && <p className="mt-1 text-xs text-destructive">La note doit être comprise entre 0 et le barème (100 au plus).</p>}
      <label className="mt-3 block text-sm font-medium">
        Appréciation
        <textarea rows={3} maxLength={2000} value={appreciation} onChange={(e) => maj(setAppreciation)(e.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Points acquis<textarea rows={3} maxLength={2000} value={acquis} onChange={(e) => maj(setAcquis)(e.target.value)} className={`${inputClass} mt-1`} /></label>
        <label className="block text-sm font-medium">Points à améliorer<textarea rows={3} maxLength={2000} value={ameliorer} onChange={(e) => maj(setAmeliorer)(e.target.value)} className={`${inputClass} mt-1`} /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => envoyer("corrige")} disabled={noteInvalide || enregistrer.isPending} className={btnPrimary}><CheckCircle2 className="h-4 w-4" /> Marquer comme corrigé</button>
        <button type="button" onClick={() => envoyer("a_refaire")} disabled={noteInvalide || !(appreciation.trim() || ameliorer.trim()) || enregistrer.isPending} className={btnSecondary}>
          <RotateCcw className="h-4 w-4" /> Demander une nouvelle soumission
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">L'apprenant voit ton retour dans son espace. Son travail n'est pas modifié.</p>
      <div className="mt-2">
        {enregistrer.isError && <Message ton="erreur">{enregistrer.error.message}</Message>}
        {fait && <Message ton="succes">{fait === "corrige" ? "Retour enregistré : le travail est marqué comme corrigé." : "Retour enregistré : l'apprenant est invité à reprendre son travail."}</Message>}
      </div>
    </div>
  );
}

/* ───────── Contenu des travaux, tel qu'enregistré ───────── */

const Bloc = ({ titre, children }: { titre: string; children: ReactNode }) => (
  <div className="mt-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titre}</p>
    <div className="mt-1 text-sm">{children}</div>
  </div>
);
const vide = <span className="text-muted-foreground">Non renseigné</span>;

function VueTravailRecherche({ t }: { t: TravailRecherche }) {
  const c = t.contenu;
  return (
    <div>
      <p className="text-xs text-muted-foreground">Sujet utilisé : « {t.sujet} » · {t.termine ? `terminé le ${formatDate(t.termine_le)}` : "en cours"} · modifié le {formatDateHeure(t.updated_at)}</p>
      {t.exercice === "prompt" && (() => {
        const p = lireContenu.prompt(c);
        return (
          <>
            <Bloc titre="Prompt rédigé"><pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 font-sans">{p.prompt || "—"}</pre></Bloc>
            <Bloc titre="Auto-évaluation">{p.criteres.length} élément(s) sur 6 cochés par l'apprenant.</Bloc>
          </>
        );
      })()}
      {t.exercice === "mots-cles" && (
        <Bloc titre="Concepts">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead className="text-xs text-muted-foreground"><tr><th className="py-1 pr-3">Français</th><th className="py-1 pr-3">Anglais</th><th className="py-1">Synonymes</th></tr></thead>
              <tbody className="divide-y">{lireContenu.motsCles(c).concepts.map((k, i) => <tr key={i}><td className="py-1 pr-3">{k.fr || "—"}</td><td className="py-1 pr-3">{k.en || "—"}</td><td className="py-1">{k.synonymes || "—"}</td></tr>)}</tbody>
            </table>
          </div>
        </Bloc>
      )}
      {t.exercice === "equation" && <Bloc titre="Équation"><code className="block break-words rounded-xl bg-muted p-3">{lireContenu.equation(c).equation || "—"}</code></Bloc>}
      {t.exercice === "references" && (
        <Bloc titre="Références vérifiées">
          <ul className="space-y-2">
            {lireContenu.references(c).references.map((r, i) => (
              <li key={i} className="rounded-xl bg-muted p-3">
                <p className="font-medium">{r.titre || "(sans titre)"}</p>
                <p className="text-xs text-muted-foreground">{[r.auteurs, r.annee, r.doi && `DOI ${r.doi}`].filter(Boolean).join(" · ") || "—"}</p>
                <p className="mt-1 text-xs">
                  Vérification Crossref : {r.verification ? (r.verification.statut === "trouve" ? `DOI trouvé (« ${r.verification.titre} »)` : r.verification.statut === "introuvable" ? "DOI introuvable" : "DOI au format invalide") : "non effectuée"} · {r.criteres.length}/4 critères cochés
                </p>
              </li>
            ))}
          </ul>
        </Bloc>
      )}
    </div>
  );
}

const lAppreciation = (a: unknown) => APPRECIATIONS.find((x) => x.id === a)?.label ?? "—";

function VueAnalyse({ a }: { a: AnalysePertinence }) {
  const c = a.contenu as { jugement?: string; justification?: string; criteres?: Partial<Record<CritereId, Appreciation>>; aVerifier?: string[]; comparaison?: Record<string, string> };
  const exemple = a.mode === "corrige" ? articlePertinence(a.article_id) : undefined;
  const info = a.article as { titre?: string; auteurs?: string; annee?: string; revue?: string; doi?: string | null } | null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {a.mode === "corrige" ? "Entraînement corrigé (article d'exemple fictif)" : "Avec son sujet"} · sujet : « {a.sujet} » · {a.nb_analyses} enregistrement(s), le dernier le {formatDateHeure(a.updated_at)}
      </p>
      {!exemple && info && (
        <Bloc titre="Article analysé">
          {info.titre} {info.annee && `(${info.annee})`} {info.revue && `· ${info.revue}`}
          {info.doi && <a href={`https://doi.org/${info.doi}`} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 text-primary hover:underline">DOI <ExternalLink className="h-3 w-3" /></a>}
        </Bloc>
      )}
      <Bloc titre="Jugement">
        {PERTINENCES.find((p) => p.id === c.jugement)?.label ?? "—"}
        {exemple && <span className="text-muted-foreground"> · appréciation attendue : {PERTINENCES.find((p) => p.id === exemple.pertinence)?.label}</span>}
      </Bloc>
      <Bloc titre="Justification"><p className="whitespace-pre-wrap">{c.justification || "—"}</p></Bloc>
      <Bloc titre="Critères">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead className="text-xs text-muted-foreground"><tr><th className="py-1 pr-3">Critère</th><th className="py-1 pr-3">Réponse</th>{exemple && <th className="py-1">Attendu</th>}</tr></thead>
            <tbody className="divide-y">
              {CRITERES.map((k) => (
                <tr key={k.id}><td className="py-1 pr-3">{k.titre}</td><td className="py-1 pr-3">{lAppreciation(c.criteres?.[k.id])}</td>{exemple && <td className="py-1 text-muted-foreground">{lAppreciation(exemple.criteres[k.id].attendu)}</td>}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloc>
      <Bloc titre="À vérifier selon l'apprenant">{c.aVerifier?.length ? c.aVerifier.map((v) => POINTS_A_VERIFIER.find((p) => p.id === v)?.label ?? v).join(" ; ") : "Rien de coché"}</Bloc>
      {c.comparaison && (c.comparaison["decision"] || c.comparaison["pourquoi"]) && (
        <Bloc titre="Comparaison avec l'IA et décision">
          <ul className="space-y-1">
            {c.comparaison["oublis"] && <li><strong>Éléments oubliés repérés par l'IA :</strong> {c.comparaison["oublis"]}</li>}
            {c.comparaison["nonJustifie"] && <li><strong>Conclusions peu justifiées de l'IA :</strong> {c.comparaison["nonJustifie"]}</li>}
            {c.comparaison["aVerifierTexte"] && <li><strong>À vérifier dans le texte intégral :</strong> {c.comparaison["aVerifierTexte"]}</li>}
            <li><strong>Décision :</strong> {DECISIONS.find((d) => d.id === c.comparaison?.["decision"])?.label ?? "—"} {c.comparaison["pourquoi"] && `— ${c.comparaison["pourquoi"]}`}</li>
          </ul>
        </Bloc>
      )}
    </div>
  );
}

/* ───────── Un travail dans la fiche ───────── */

function LigneTravail({ t, membre, formateurId, ouvert, onBasculer }: { t: TravailSuivi; membre: MembreSuivi; formateurId: string; ouvert: boolean; onBasculer: () => void }) {
  const [corriger, setCorriger] = useState(false);
  const exo = t.soumission ? exerciceARendre(t.soumission.exercice_id) : undefined;
  return (
    <li className="rounded-xl border-2 border-border">
      <button type="button" onClick={onBasculer} aria-expanded={ouvert} disabled={t.statut === "non_commence"} className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left disabled:cursor-default">
        <span className="min-w-0">
          <span className="block font-medium text-navy">{t.titre}</span>
          <span className="block text-xs text-muted-foreground">{TYPES_TRAVAIL.find((x) => x.id === t.type)?.label}{t.date && ` · ${formatDateHeure(t.date)}`}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold tabular-nums">{t.evaluation}</span>
          <BadgeStatut t={t} />
          {t.statut !== "non_commence" && <ChevronDown className={`h-4 w-4 transition ${ouvert ? "rotate-180" : ""}`} />}
        </span>
      </button>
      {ouvert && (
        <div className="border-t p-3">
          {t.soumission && exo && (corriger ? (
            <CorrectionCopie
              userId={formateurId}
              copie={{ ...t.soumission, apprenant: { nom_complet: membre.nom } } as CopieFormateur}
              exo={exo}
              nomGroupe={membre.groupes.find((g) => g.id === t.soumission!.groupe_id)?.nom ?? "Groupe"}
              position={null}
              onSuivante={undefined}
              onRetour={() => setCorriger(false)}
            />
          ) : (
            <>
              <Bloc titre={`Copie rendue le ${formatDateHeure(t.soumission.soumis_le)}`}><div className="whitespace-pre-wrap rounded-xl bg-muted p-3 leading-relaxed">{t.soumission.contenu}</div></Bloc>
              {t.soumission.statut !== "soumis" && (
                <Bloc titre={`Correction du ${formatDate(t.soumission.corrige_le)}`}>
                  {t.soumission.note !== null && <p className="font-semibold">{formatNote(t.soumission.note)} / {formatNote(t.soumission.note_sur)}</p>}
                  {t.soumission.commentaire && <p className="mt-1 whitespace-pre-wrap">{t.soumission.commentaire}</p>}
                  <PointsRetour acquis={t.soumission.points_acquis} ameliorer={t.soumission.points_a_ameliorer} />
                </Bloc>
              )}
              <button type="button" onClick={() => setCorriger(true)} className={`${btnPrimary} mt-4`}>{t.soumission.statut === "soumis" ? "Corriger cette copie" : "Modifier la correction"}</button>
            </>
          ))}
          {t.travail && (
            <>
              <VueTravailRecherche t={t.travail} />
              {!t.travail.termine && <p className="mt-3 text-xs text-muted-foreground">L'apprenant n'a pas encore marqué ce travail comme terminé.</p>}
              <FormulaireRetour key={t.retour?.updated_at ?? "nouveau"} apprenantId={membre.id} objet="travail_recherche" objetId={t.travail.exercice} retour={t.retour} />
            </>
          )}
          {t.analyse && (
            <>
              <VueAnalyse a={t.analyse} />
              <FormulaireRetour
                key={t.retour?.updated_at ?? "nouveau"}
                apprenantId={membre.id}
                objet="analyse_pertinence"
                objetId={t.analyse.article_id}
                retour={t.retour}
                {...(t.analyse.mode === "corrige" && t.analyse.premier_score !== null && {
                  indication: `Score automatique enregistré : ${t.analyse.premier_score}/100. Il est indicatif (justification estimée par des indices) : confirme-le ou remplace-le par ta propre note.`,
                })}
              />
            </>
          )}
        </div>
      )}
    </li>
  );
}

/* ───────── Fiche ───────── */

export function FicheSuivi({ membre, donnees, formateurId, focus, onFermer }: { membre: MembreSuivi; donnees: DonneesSuivi; formateurId: string; focus: string | null; onFermer: () => void }) {
  const [ouvert, setOuvert] = useState<string | null>(focus);
  const [limite, setLimite] = useState(30);
  const profil = donnees.profils.find((p) => p.user_id === membre.id);
  const tentatives = donnees.tentatives.filter((t) => t.user_id === membre.id);
  const lecons = progressionLecons(tentatives.flatMap((t) => t.reponses));
  const taux = tauxReussite(tentatives);
  const serie = serieHebdomadaire(tentatives);
  const travaux = travauxApprenant(membre.id, donnees);
  const compte = (...s: TravailSuivi["statut"][]) => travaux.filter((t) => s.includes(t.statut)).length;

  return (
    <Carte
      titre={`Suivi de ${membre.nom}`}
      action={<button type="button" onClick={onFermer} className="rounded-full p-2 hover:bg-muted" aria-label="Fermer la fiche"><X className="h-5 w-5" /></button>}
      className="border-2 border-primary"
    >
      <p className="text-sm text-muted-foreground">{membre.groupes.map((g) => g.nom).join(", ")} · membre depuis le {formatDate(membre.depuis)}</p>

      <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profil chercheur</p>
        {profil ? (
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            <div className="sm:col-span-2"><dt className="inline font-semibold">Sujet : </dt><dd className="inline">{profil.sujet}</dd></div>
            <div className="sm:col-span-2"><dt className="inline font-semibold">Problématique : </dt><dd className="inline">{profil.problematique || vide}</dd></div>
            <div><dt className="inline font-semibold">Discipline : </dt><dd className="inline">{profil.discipline}</dd></div>
            <div><dt className="inline font-semibold">Niveau : </dt><dd className="inline">{labelNiveauEtudes(profil.niveau_etudes)}</dd></div>
            <div><dt className="inline font-semibold">Établissement : </dt><dd className="inline">{profil.etablissement || vide}</dd></div>
            <div className="sm:col-span-2"><dt className="inline font-semibold">Objectif de formation : </dt><dd className="inline">{profil.objectif}</dd></div>
          </dl>
        ) : <p className="mt-1">L'apprenant n'a pas encore renseigné son profil chercheur.</p>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Réponses enregistrées" valeur={tentatives.length} aide="QCM, leçons, exercices pratiques" />
        <Stat label="Taux de réussite" valeur={formatPct(taux)} aide="Sur ces réponses (indicateur)" />
        <Stat label="Leçons réussies" valeur={`${lecons.reussies} / ${lecons.total}`} aide={`${lecons.commencees} commencée(s), d'après les réponses enregistrées`} />
        <Stat label="Travaux corrigés" valeur={`${compte("corrige")} / ${compte("a_corriger", "a_refaire", "corrige")}`} aide={`${compte("a_corriger")} à corriger`} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-navy">Évolution des résultats</h3>
        <CourbeHebdo serie={serie} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-navy">Travaux</h3>
        <ul className="mt-2 space-y-2">
          {travaux
            .sort((a, b) => ordreStatut(a) - ordreStatut(b) || (b.date ?? "").localeCompare(a.date ?? ""))
            .map((t) => <LigneTravail key={t.cle} t={t} membre={membre} formateurId={formateurId} ouvert={ouvert === t.cle} onBasculer={() => setOuvert(ouvert === t.cle ? null : t.cle)} />)}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-navy">Réponses aux QCM, leçons et exercices pratiques</h3>
        {tentatives.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucune réponse enregistrée.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Question / exercice</th><th className="py-2 pr-3">Réponse donnée</th><th className="py-2 text-right">Résultat</th></tr></thead>
              <tbody className="divide-y">
                {tentatives.slice(0, limite).map((t) => {
                  const r = t.reponses[0];
                  const info = r ? infoQuestion(r.question_id) : undefined;
                  const reussi = t.score === t.total;
                  return (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">{formatDateHeure(t.created_at)}</td>
                      <td className="py-2 pr-3"><span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{info?.genre ?? (t.type === "qcm" ? "QCM" : "Exercice")}</span>{info?.enonce ?? r?.question_id ?? "—"}</td>
                      <td className="py-2 pr-3">{r ? (info ? info.lireReponse(r.reponse_donnee) : (r.reponse_donnee ?? "—")) : "—"}</td>
                      <td className="whitespace-nowrap py-2 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${reussi ? "text-success" : "text-destructive"}`}>
                          {reussi ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {t.score} / {t.total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {tentatives.length > limite && <button type="button" onClick={() => setLimite(limite + 50)} className="mt-2 text-sm font-semibold text-primary hover:underline">Afficher plus ({tentatives.length - limite} restantes)</button>}
          </div>
        )}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Ces indicateurs décrivent l'activité enregistrée ; ils ne certifient pas le niveau de maîtrise de l'apprenant.</p>
    </Carte>
  );
}

const ORDRE: Record<TravailSuivi["statut"], number> = { a_corriger: 0, a_refaire: 1, en_cours: 2, corrige: 3, non_commence: 4 };
const ordreStatut = (t: TravailSuivi) => ORDRE[t.statut];
