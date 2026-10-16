import { describe, expect, it } from "vitest";
import { traduireErreur } from "@/lib/auth";

describe("messages d'erreur de connexion et d'inscription", () => {
  it.each([
    ["Invalid login credentials", "E-mail ou mot de passe incorrect."],
    ["User already registered", "Un compte existe déjà avec cette adresse e-mail."],
    ["Password should be at least 8 characters.", "Le mot de passe est trop court."],
    ["Password is known to be weak and easy to guess, please choose a different one.", "Ce mot de passe est trop courant ou a déjà été divulgué : choisis-en un autre."],
    ["Signups not allowed for this instance", "Les inscriptions sont fermées pour le moment. Contacte ton formateur."],
    ["Failed to fetch", "Connexion internet indisponible. Vérifie ta connexion, puis réessaie."],
    ["Email rate limit exceeded", "Trop de tentatives. Réessaie dans quelques minutes."],
  ])("« %s »", (message, attendu) => {
    expect(traduireErreur(message)).toBe(attendu);
  });

  it("garde un message générique, sans détail technique, pour les cas inconnus", () => {
    expect(traduireErreur("Database error saving new user")).toBe("Une erreur est survenue. Réessaie.");
  });
});
