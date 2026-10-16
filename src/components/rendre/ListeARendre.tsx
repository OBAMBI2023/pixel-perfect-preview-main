import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, LogIn } from "lucide-react";
import { BadgeCopie, BadgesExercice } from "@/components/rendre/communs";
import { exercicesARendre } from "@/data/exercices-a-rendre";
import { useAuth } from "@/lib/auth";
import { derniereCopie, formatNote, useMesSoumissions } from "@/lib/soumissions";

/** Onglet « À rendre » de /exercices : les exercices rédigés, avec l'état de la copie de l'apprenant. */
export function ListeARendre() {
  const { status, configured, user } = useAuth();
  const copies = useMesSoumissions(user?.id);

  return (
    <div>
      <p className="max-w-3xl text-muted-foreground">
        Des réponses courtes à rédiger (10 à 15 minutes chacune), corrigées par ton formateur avec un barème. Tu retrouves la note et son commentaire ici et dans ton espace.
      </p>
      {status === "ready" && configured && !user && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm text-secondary-foreground">
          <LogIn className="h-4 w-4" /> Connecte-toi et rejoins le groupe de ton formateur pour rendre ces exercices.
          <Link to="/connexion" className="font-semibold underline">Se connecter</Link>
        </p>
      )}
      <ul className="mt-6 grid gap-5 md:grid-cols-2">
        {exercicesARendre.map((exo) => {
          const copie = user ? derniereCopie(copies.data ?? [], exo.id) : undefined;
          return (
            <li key={exo.id}>
              <Link
                to="/exercices/a-rendre/$id"
                params={{ id: exo.id }}
                className="group flex h-full flex-col rounded-2xl bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <BadgesExercice exo={exo} />
                  {user && <BadgeCopie copie={copie} />}
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">{exo.titre}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{exo.consigne}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" /> 10–15 min · {exo.minMots}–{exo.maxMots} mots · noté sur {formatNote(exo.noteSur)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    {copie?.statut === "a_refaire" ? "Reprendre" : copie ? "Voir" : "Rédiger"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
