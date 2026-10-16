import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Demande confirmation avant une action irréversible ou gênante (le déclencheur ouvre la boîte de dialogue). */
export function Confirmer({ declencheur, titre, description, libelle, onConfirmer, destructif = true }: {
  declencheur: ReactNode;
  titre: string;
  description: ReactNode;
  libelle: string;
  onConfirmer: () => void;
  /** false : bouton de confirmation aux couleurs principales (ex. envoi d'une copie). */
  destructif?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{declencheur}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy">{titre}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmer}
            className={`rounded-full ${destructif ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {libelle}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
