import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Download, MessageSquarePlus, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { btnPrimary, btnSecondary, formatDateHeure, inputClass } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { Bareme, BadgeCopie, BadgesExercice } from "@/components/rendre/communs";
import { exerciceARendre, exercicesARendre, type ExerciceARendre } from "@/data/exercices-a-rendre";
import { rpc, slugFichier, telechargerCsv, useCopiesFormateur, useMembres, type CopieFormateur } from "@/lib/formateur";
import { compterMots, formatNote, LIBELLES_STATUT } from "@/lib/soumissions";
import type { Groupe, StatutSoumission } from "@/lib/supabase";

const selectClass = "rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card";
const nomApprenant = (c: CopieFormateur) => c.apprenant?.nom_complet || "Ancien membre";

/* ───────── Commentaires rapides ───────── */

const COMMENTAIRES_COMMUNS = [
  "Bon travail, la consigne est respectée.",
  "Réponse trop générale : appuie-toi sur ton propre sujet.",
  "Relis la consigne : un élément demandé manque.",
];
const COMMENTAIRES_EXERCICE: Record<string, string[]> = {
  ar1: ["Il manque les critères de qualité.", "Précise le contexte de ton mémoire (discipline, terrain, niveau).", "Ajoute l'interdiction d'inventer des références."],
  ar2: ["Mets OR entre les synonymes et AND entre les concepts.", "Il manque les mots-clés en anglais.", "Utilise des guillemets pour les expressions."],
  ar3: ["Indique la version de l'outil ou la date d'utilisation.", "Décris plus précisément la tâche confiée à l'IA.", "Explique le contrôle que tu as exercé sur le résultat."],
  ar4: ["Vérifie le DOI dans Crossref.", "La référence est incomplète (volume, pages…).", "Argumente ton jugement final sur la fiabilité."],
  ar5: ["Vérifie le DOI dans Crossref.", "Précise l'erreur repérée (auteur, année, revue, DOI).", "Ta conclusion sur l'usage de l'IA manque."],
  ar6: ["Organise ta synthèse par idées et non auteur par auteur.", "La divergence n'apparaît pas clairement.", "Cite les auteurs au format (Auteur, année)."],
};

const cleCommentaires = (userId: string) => `iar-commentaires-rapides-${userId}`;
function lireCommentairesPerso(userId: string): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(cleCommentaires(userId)) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function ecrireCommentairesPerso(userId: string, liste: string[]) {
  try { localStorage.setItem(cleCommentaires(userId), JSON.stringify(liste)); } catch { /* stockage indisponible */ }
}

/* ───────── Liste ───────── */

type FiltreStatut = StatutSoumission | "";

/** Onglet « Copies à corriger » : toutes les copies des groupes du formateur, filtrables, puis écran de correction. */
export function CopiesACorriger({ userId, groupes }: { userId: string; groupes: Groupe[] }) {
  const copies = useCopiesFormateur(userId);
  const [groupeId, setGroupeId] = useState("");
  const [exerciceId, setExerciceId] = useState("");
  const [statut, setStatut] = useState<FiltreStatut>("soumis");
  const [ouverte, setOuverte] = useState<string | null>(null);

  const nomGroupe = (id: string) => groupes.find((g) => g.id === id)?.nom ?? "Groupe";
  const filtrees = useMemo(
    () =>
      (copies.data ?? []).filter(
        (c) => (!groupeId || c.groupe_id === groupeId) && (!exerciceId || c.exercice_id === exerciceId) && (!statut || c.statut === statut),
      ),
    [copies.data, groupeId, exerciceId, statut],
  );
  // La copie ouverte reste affichée même si sa correction la fait sortir du filtre « En attente ».
  const copie = ouverte ? copies.data?.find((c) => c.id === ouverte) : undefined;

  if (copie) {
    const exo = exerciceARendre(copie.exercice_id);
    const index = filtrees.findIndex((c) => c.id === copie.id);
    const suivante = [...filtrees.slice(index + 1), ...filtrees.slice(0, Math.max(index, 0))].find((c) => c.id !== copie.id);
    return exo ? (
      <Correction
        key={copie.id}
        userId={userId}
        copie={copie}
        exo={exo}
        nomGroupe={nomGroupe(copie.groupe_id)}
        position={index >= 0 ? `${index + 1} / ${filtrees.length}` : null}
        onSuivante={suivante ? () => setOuverte(suivante.id) : undefined}
        onRetour={() => setOuverte(null)}
      />
    ) : (
      <Message ton="erreur">Exercice inconnu : {copie.exercice_id}.</Message>
    );
  }

  return (
    <div className="space-y-6">
      <Carte titre="Copies à corriger" action={groupes.length > 0 && <ExportNotes groupes={groupes} copies={copies.data ?? []} />}>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Filtrer par groupe" value={groupeId} onChange={(e) => setGroupeId(e.target.value)} className={selectClass}>
            <option value="">Tous les groupes</option>
            {groupes.map((g) => <option key={g.id} value={g.id}>{g.nom}{g.archive_le ? " (archivé)" : ""}</option>)}
          </select>
          <select aria-label="Filtrer par exercice" value={exerciceId} onChange={(e) => setExerciceId(e.target.value)} className={selectClass}>
            <option value="">Tous les exercices</option>
            {exercicesARendre.map((e) => <option key={e.id} value={e.id}>{e.titre}</option>)}
          </select>
          <select aria-label="Filtrer par statut" value={statut} onChange={(e) => setStatut(e.target.value as FiltreStatut)} className={selectClass}>
            <option value="">Tous les statuts</option>
            {(Object.keys(LIBELLES_STATUT) as StatutSoumission[]).map((s) => <option key={s} value={s}>{LIBELLES_STATUT[s]}</option>)}
          </select>
        </div>

        <div className="mt-5">
          {copies.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {copies.isError && <Message ton="erreur">Impossible de charger les copies.</Message>}
          {copies.data && filtrees.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {statut === "soumis" && !groupeId && !exerciceId ? "Aucune copie en attente : tout est corrigé." : "Aucune copie pour ces filtres."}
            </p>
          )}
          {filtrees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-semibold">Apprenant</th>
                    <th className="py-2 pr-4 font-semibold">Exercice</th>
                    <th className="py-2 pr-4 font-semibold">Groupe</th>
                    <th className="py-2 pr-4 font-semibold">Rendue le</th>
                    <th className="py-2 pr-4 font-semibold">État</th>
                    <th className="py-2"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrees.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 font-medium text-navy">{nomApprenant(c)}</td>
                      <td className="py-3 pr-4">{exerciceARendre(c.exercice_id)?.titre ?? c.exercice_id}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{nomGroupe(c.groupe_id)}</td>
                      <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">{formatDateHeure(c.soumis_le)}</td>
                      <td className="py-3 pr-4"><BadgeCopie copie={c} /></td>
                      <td className="py-3 text-right">
                        <button onClick={() => setOuverte(c.id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold text-primary hover:bg-muted">
                          {c.statut === "soumis" ? "Corriger" : "Revoir"} <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Carte>
    </div>
  );
}

/* ───────── Correction ───────── */

function Correction({ userId, copie, exo, nomGroupe, position, onSuivante, onRetour }: {
  userId: string;
  copie: CopieFormateur;
  exo: ExerciceARendre;
  nomGroupe: string;
  position: string | null;
  onSuivante: (() => void) | undefined;
  onRetour: () => void;
}) {
  const qc = useQueryClient();
  // Note par critère (texte saisi) ; seule la note totale est enregistrée.
  const [points, setPoints] = useState<string[]>(() => exo.bareme.map(() => ""));
  const [commentaire, setCommentaire] = useState(copie.commentaire ?? "");
  const [perso, setPerso] = useState(() => lireCommentairesPerso(userId));
  const [fait, setFait] = useState<StatutSoumission | null>(null);

  const valeurs = points.map((p) => (p.trim() === "" ? null : Number(p.replace(",", "."))));
  const invalides = valeurs.map((v, i) => v !== null && (!Number.isFinite(v) || v < 0 || v > exo.bareme[i]!.points));
  const complet = valeurs.every((v) => v !== null) && !invalides.some(Boolean);
  const saisie = valeurs.some((v) => v !== null);
  const total = valeurs.reduce<number>((s, v) => s + (v ?? 0), 0);

  const corriger = useMutation({
    mutationFn: (statut: "corrige" | "a_refaire") =>
      rpc("corriger_soumission", { p_id: copie.id, p_note: saisie ? total : null, p_commentaire: commentaire, p_statut: statut }),
    onSuccess: (_, statut) => {
      setFait(statut);
      void qc.invalidateQueries({ queryKey: ["copies-formateur"] });
    },
  });

  const ajouterCommentaire = (texte: string) => {
    setCommentaire((c) => (c.trim() ? `${c.trimEnd()}\n${texte}` : texte));
    setFait(null);
  };
  const enregistrerRapide = () => {
    const t = commentaire.trim();
    if (!t || perso.includes(t)) return;
    const l = [...perso, t];
    setPerso(l);
    ecrireCommentairesPerso(userId, l);
  };
  const retirerRapide = (t: string) => {
    const l = perso.filter((x) => x !== t);
    setPerso(l);
    ecrireCommentairesPerso(userId, l);
  };

  const rapides = [...(COMMENTAIRES_EXERCICE[exo.id] ?? []), ...COMMENTAIRES_COMMUNS];
  const mots = compterMots(copie.contenu);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onRetour} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Toutes les copies
        </button>
        {position && <span className="text-sm text-muted-foreground">Copie {position}</span>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gauche : consigne et copie */}
        <div className="space-y-6">
          <Carte titre={exo.titre}>
            <BadgesExercice exo={exo} />
            <p className="mt-4 leading-relaxed">{exo.consigne}</p>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-semibold text-primary">Éléments attendus</summary>
              <p className="mt-2 leading-relaxed text-muted-foreground">{exo.attendu}</p>
            </details>
          </Carte>
          <Carte titre={nomApprenant(copie)} action={<BadgeCopie copie={copie} />}>
            <p className="text-sm text-muted-foreground">
              {nomGroupe} · rendue le {formatDateHeure(copie.soumis_le)} · {mots} mot{mots > 1 ? "s" : ""}
            </p>
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-muted p-4 text-sm leading-relaxed">{copie.contenu}</div>
          </Carte>
        </div>

        {/* Droite : barème, commentaire, actions */}
        <Carte titre="Correction">
          <ul className="divide-y text-sm">
            {exo.bareme.map((c, i) => (
              <li key={c.critere} className="flex items-center justify-between gap-4 py-2.5">
                <label htmlFor={`critere-${i}`}>{c.critere}</label>
                <span className="flex shrink-0 items-center gap-1.5">
                  <input
                    id={`critere-${i}`}
                    inputMode="decimal"
                    value={points[i]}
                    onChange={(e) => { setPoints(points.map((p, j) => (j === i ? e.target.value : p))); setFait(null); }}
                    aria-invalid={invalides[i]}
                    className={`w-16 rounded-lg border-2 bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-primary ${invalides[i] ? "border-destructive" : "border-border"}`}
                  />
                  <span className="w-10 tabular-nums text-muted-foreground">/ {formatNote(c.points)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t-2 border-navy pt-2 font-semibold text-navy">
            <span>Total</span>
            <span className="tabular-nums">{saisie ? formatNote(total) : "—"} / {formatNote(exo.noteSur)}</span>
          </div>
          {invalides.some(Boolean) && <p className="mt-2 text-xs text-destructive">Chaque note doit être comprise entre 0 et le maximum du critère.</p>}
          {copie.note !== null && !saisie && (
            <p className="mt-2 text-xs text-muted-foreground">Note précédente : {formatNote(copie.note)} / {formatNote(copie.note_sur)}</p>
          )}

          <label htmlFor="commentaire" className="mt-6 block font-semibold text-navy">Commentaire</label>
          <textarea
            id="commentaire"
            value={commentaire}
            onChange={(e) => { setCommentaire(e.target.value); setFait(null); }}
            rows={5}
            maxLength={2000}
            placeholder="Ce qui est réussi, ce qui manque, comment progresser…"
            className={`${inputClass} mt-2 leading-relaxed`}
          />
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Commentaires rapides</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {rapides.map((t) => (
                <button key={t} type="button" onClick={() => ajouterCommentaire(t)} className="rounded-full bg-muted px-3 py-1 text-xs font-medium hover:bg-secondary">{t}</button>
              ))}
              {perso.map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                  <button type="button" onClick={() => ajouterCommentaire(t)} className="max-w-64 truncate py-1 pl-3 pr-1" title={t}>{t}</button>
                  <button type="button" onClick={() => retirerRapide(t)} aria-label={`Retirer « ${t} »`} className="rounded-full p-1 pr-2 hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={enregistrerRapide}
              disabled={!commentaire.trim() || perso.includes(commentaire.trim())}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Garder ce commentaire comme commentaire rapide
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => corriger.mutate("corrige")} disabled={!complet || corriger.isPending} className={btnPrimary}>
              <CheckCircle2 className="h-4 w-4" /> Valider la correction
            </button>
            <button onClick={() => corriger.mutate("a_refaire")} disabled={!commentaire.trim() || invalides.some(Boolean) || corriger.isPending} className={btnSecondary}>
              <RotateCcw className="h-4 w-4" /> Demander à refaire
            </button>
            <button onClick={onSuivante} disabled={!onSuivante} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-primary hover:bg-muted disabled:opacity-50">
              Copie suivante <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {!complet && !invalides.some(Boolean) && <p className="mt-2 text-xs text-muted-foreground">Note chaque critère pour valider. « Demander à refaire » demande un commentaire.</p>}
          <div className="mt-3">
            {corriger.isError && <Message ton="erreur">{corriger.error.message}</Message>}
            {fait && <Message ton="succes">{fait === "corrige" ? "Correction enregistrée : l'apprenant voit sa note." : "Copie renvoyée à l'apprenant pour être refaite."}</Message>}
          </div>

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-semibold text-primary">Barème vu par l'apprenant</summary>
            <div className="mt-2"><Bareme exo={exo} /></div>
          </details>
        </Carte>
      </div>
    </div>
  );
}

/* ───────── Export CSV ───────── */

/** Notes d'un groupe : une ligne par membre, une colonne par exercice (note, ou état si non corrigé). */
function ExportNotes({ groupes, copies }: { groupes: Groupe[]; copies: CopieFormateur[] }) {
  const [groupeId, setGroupeId] = useState(groupes.find((g) => !g.archive_le)?.id ?? groupes[0]!.id);
  const membres = useMembres(groupeId);
  const groupe = groupes.find((g) => g.id === groupeId);

  const exporter = () => {
    if (!groupe || !membres.data) return;
    const duGroupe = copies.filter((c) => c.groupe_id === groupeId);
    const ids = [...new Set([...membres.data.map((m) => m.apprenant_id), ...duGroupe.map((c) => c.apprenant_id)])];
    const nom = (id: string) =>
      membres.data.find((m) => m.apprenant_id === id)?.profil?.nom_complet || duGroupe.find((c) => c.apprenant_id === id)?.apprenant?.nom_complet || "Ancien membre";
    const entete = ["Apprenant", ...exercicesARendre.map((e) => `${e.titre} (/${e.noteSur})`), "Total", "Sur"];
    const corps = ids
      .map((id) => {
        let total = 0;
        let sur = 0;
        const cellules = exercicesARendre.map((e) => {
          const c = duGroupe.find((x) => x.apprenant_id === id && x.exercice_id === e.id);
          if (!c) return "Non rendu";
          if (c.statut !== "corrige") return LIBELLES_STATUT[c.statut];
          total += Number(c.note);
          sur += Number(c.note_sur);
          return formatNote(c.note);
        });
        return [nom(id), ...cellules, sur ? formatNote(total) : "", sur ? formatNote(sur) : ""];
      })
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), "fr"));
    telechargerCsv(`notes-${slugFichier(groupe.nom)}-${new Date().toISOString().slice(0, 10)}.csv`, [entete, ...corps]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Groupe à exporter" value={groupeId} onChange={(e) => setGroupeId(e.target.value)} className={selectClass}>
        {groupes.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
      </select>
      <button onClick={exporter} disabled={!membres.data} className={btnSecondary}>
        <Download className="h-4 w-4" /> Exporter les notes (CSV)
      </button>
    </div>
  );
}
