import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Archive, Pencil, UserMinus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Confirmer } from "@/components/espace/Confirmer";
import { Invitation } from "@/components/espace/Invitation";
import { btnPrimary, formatDate, inputClass } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { invaliderGroupe, useMembres } from "@/lib/formateur";
import { getSupabase, type Groupe } from "@/lib/supabase";

/** Met à jour un groupe dans la liste en cache, sans attendre le rechargement. */
const majCache = (qc: QueryClient, g: Groupe) =>
  qc.setQueryData<Groupe[]>(["groupes-formateur", g.formateur_id], (l) => l?.map((x) => (x.id === g.id ? g : x)));

const btnDiscret = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50";

export function EnteteGroupe({ groupe }: { groupe: Groupe }) {
  const sb = getSupabase()!;
  const qc = useQueryClient();
  const membres = useMembres(groupe.id);
  const [ouvert, setOuvert] = useState(false);
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(groupe.nom);

  const renommer = useMutation({
    mutationFn: async (n: string) => {
      const { data, error } = await sb.from("groupes").update({ nom: n }).eq("id", groupe.id).select().single();
      if (error) throw new Error("Impossible de renommer le groupe.");
      return data;
    },
    onSuccess: (g) => {
      majCache(qc, g);
      setEdition(false);
    },
  });
  const archiver = useMutation({
    mutationFn: async () => {
      const { data, error } = await sb.from("groupes").update({ archive_le: new Date().toISOString() }).eq("id", groupe.id).select().single();
      if (error) throw new Error("Impossible d'archiver le groupe.");
      return data;
    },
    onSuccess: (g) => majCache(qc, g),
  });
  const retirer = useMutation({
    mutationFn: async (apprenantId: string) => {
      const { data, error } = await sb.from("membres_groupe").delete().eq("groupe_id", groupe.id).eq("apprenant_id", apprenantId).select();
      if (error || data.length === 0) throw new Error("Impossible de retirer ce membre.");
    },
    onSuccess: () => invaliderGroupe(qc, groupe.id),
  });

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    const n = nom.trim();
    if (!n || n === groupe.nom) return setEdition(false);
    renommer.mutate(n);
  };
  const erreur = renommer.error ?? archiver.error ?? retirer.error;
  const nbMembres = membres.data?.length;

  return (
    <Carte>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {edition ? (
          <form onSubmit={soumettre} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <input aria-label="Nouveau nom du groupe" autoFocus maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
            <div className="flex shrink-0 gap-2">
              <button type="submit" disabled={!nom.trim() || renommer.isPending} className={btnPrimary}>Enregistrer</button>
              <button type="button" onClick={() => { setNom(groupe.nom); setEdition(false); }} className={btnDiscret}>Annuler</button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-navy">{groupe.nom}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Créé le {formatDate(groupe.created_at)} · {nbMembres ?? "…"} membre{(nbMembres ?? 0) > 1 ? "s" : ""}</p>
          </div>
        )}
        {!edition && (
          <div className="flex flex-wrap gap-1">
            <button onClick={() => { setNom(groupe.nom); setEdition(true); }} className={btnDiscret}><Pencil className="h-4 w-4" /> Renommer</button>
            <Confirmer
              declencheur={<button disabled={archiver.isPending} className={btnDiscret}><Archive className="h-4 w-4" /> Archiver</button>}
              titre={`Archiver « ${groupe.nom} » ?`}
              description="Le groupe disparaît de ta liste et n'accepte plus de nouveaux membres. Les résultats sont conservés : tu pourras le désarchiver à tout moment."
              libelle="Archiver"
              onConfirmer={() => archiver.mutate()}
            />
          </div>
        )}
      </div>

      <div className="mt-4"><Invitation groupe={groupe} /></div>
      {erreur && <div className="mt-3"><Message ton="erreur">{erreur.message}</Message></div>}

      {!!nbMembres && (
        <>
          <button onClick={() => setOuvert(!ouvert)} className="mt-4 text-sm font-semibold text-primary hover:underline" aria-expanded={ouvert}>
            {ouvert ? "Masquer les membres" : `Voir les membres (${nbMembres})`}
          </button>
          {ouvert && (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {membres.data?.map((m) => {
                const nomMembre = m.profil?.nom_complet || "Sans nom";
                return (
                  <li key={m.apprenant_id} className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{nomMembre}</span>
                      <span className="block text-xs text-muted-foreground">depuis le {formatDate(m.joined_at)}</span>
                    </span>
                    <Confirmer
                      declencheur={
                        <button className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-card hover:text-destructive" aria-label={`Retirer ${nomMembre} du groupe`} title="Retirer du groupe">
                          <UserMinus className="h-4 w-4" />
                        </button>
                      }
                      titre={`Retirer ${nomMembre} du groupe ?`}
                      description="Tu ne verras plus ses résultats dans ce groupe. Ses tentatives restent dans son espace. Le code actuel lui permet de revenir dans le groupe : génère un nouveau code pour l'éviter."
                      libelle="Retirer du groupe"
                      onConfirmer={() => retirer.mutate(m.apprenant_id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Carte>
  );
}
