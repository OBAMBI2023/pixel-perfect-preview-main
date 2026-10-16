import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Clock, Play, Presentation, Printer } from "lucide-react";
import { useState } from "react";
import { useSeancesEnCours } from "@/components/espace/SeanceDirect";
import { btnPrimary, btnSecondary, formatDateHeure } from "@/components/espace/styles";
import { Carte, Message } from "@/components/espace/ui";
import { DUREE_TOTALE_MIN } from "@/data/notes-comprendre-ia";
import { PRESENTATIONS_DIRECT } from "@/lib/seance-direct";
import { getSupabase, type Groupe } from "@/lib/supabase";

/** Espace formateur, onglet « Présenter le cours ». */
export function PresenterCours({ userId, groupes }: { userId: string; groupes: Groupe[] }) {
  const sb = getSupabase()!;
  const navigate = useNavigate();
  const actifs = groupes.filter((g) => !g.archive_le);
  const [groupeId, setGroupeId] = useState("");
  const choisi = actifs.find((g) => g.id === groupeId) ?? actifs[0];
  const seances = useSeancesEnCours(`formateur-${userId}`);
  const enCours = (seances.data ?? []).find((s) => s.groupe_id === choisi?.id);
  const pres = PRESENTATIONS_DIRECT["comprendre-ia"]!;

  const demarrer = useMutation({
    mutationFn: async (gid: string) => {
      const { data, error } = await sb.from("seances_direct").insert({ groupe_id: gid, presentation: "comprendre-ia" }).select("id").single();
      if (error) {
        if (error.code === "23505") throw new Error("Une séance est déjà en cours pour ce groupe : reprends-la.");
        throw new Error("Impossible de démarrer la séance. Réessaie.");
      }
      return data.id;
    },
    onSuccess: (id) => void navigate({ to: "/formateur/seance-direct/$id", params: { id } }),
  });

  return (
    <Carte titre={<span className="flex items-center gap-2"><Presentation className="h-5 w-5 text-primary" /> Présenter le cours</span>}>
      <div className="rounded-2xl bg-muted p-5">
        <h3 className="text-lg font-bold text-navy">{pres.titre}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {pres.slides.length} diapositives · environ {DUREE_TOTALE_MIN} min
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Tes apprenants suivent sur leur téléphone : la diapositive change chez eux quand tu avances. Ils peuvent signaler un point pas compris, poser une question et répondre à tes questions.
        </p>
      </div>

      {actifs.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Crée d'abord un groupe et invite tes apprenants pour démarrer une séance.</p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex items-center gap-3 text-sm font-medium">
            Groupe
            <select
              value={choisi?.id ?? ""}
              onChange={(e) => { setGroupeId(e.target.value); demarrer.reset(); }}
              className="rounded-full bg-card px-4 py-2 text-sm font-medium shadow-card"
            >
              {actifs.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
          </label>
          {enCours ? (
            <Link to="/formateur/seance-direct/$id" params={{ id: enCours.id }} className={btnPrimary}>
              <Play className="h-4 w-4" /> Reprendre la séance en direct
            </Link>
          ) : (
            <button onClick={() => choisi && demarrer.mutate(choisi.id)} disabled={!choisi || demarrer.isPending} className={btnPrimary}>
              <Play className="h-4 w-4" /> {demarrer.isPending ? "Démarrage…" : "Démarrer la séance en direct"}
            </button>
          )}
          <Link to="/formateur/notes-cours" className={btnSecondary}>
            <Printer className="h-4 w-4" /> Imprimer mes notes
          </Link>
        </div>
      )}
      {enCours && <p className="mt-3 text-sm text-muted-foreground">Séance en cours depuis le {formatDateHeure(enCours.debut_le)}.</p>}
      {demarrer.isError && <div className="mt-3"><Message ton="erreur">{demarrer.error.message}</Message></div>}
    </Carte>
  );
}
