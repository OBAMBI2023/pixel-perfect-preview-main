import { Link, useNavigate } from "@tanstack/react-router";
import { Brain, Search, User, Menu, X, Home, GraduationCap, PenLine, BookOpen, Wrench, LogOut, Users, ChevronDown, Compass } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PAGES_PARTICIPANT } from "@/components/espace/EspaceParticipant";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { seDeconnecter, useAuth } from "@/lib/auth";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/formations", label: "Formations" },
  { to: "/exercices", label: "Exercices" },
  { to: "/ressources", label: "Ressources" },
  { to: "/outils-ia", label: "Outils IA" },
  { to: "/actualites", label: "Actualités" },
  { to: "/a-propos", label: "À propos" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const formateur = profile?.role === "formateur";
  const deconnexion = async () => {
    setOpen(false);
    await seDeconnecter();
    void navigate({ to: "/" });
  };
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <Brain className="h-11 w-11 text-primary" strokeWidth={1.6} />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold text-navy md:text-2xl">
              <span className="text-primary">IA</span> ET LA RECHERCHE
            </div>
            <div className="text-xs text-muted-foreground md:text-sm">Comprendre • Explorer • Innover</div>
          </div>
        </Link>
        <nav className="ml-auto hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="relative py-2 text-sm font-medium text-foreground transition-colors hover:text-primary data-[status=active]:text-primary data-[status=active]:after:absolute data-[status=active]:after:inset-x-0 data-[status=active]:after:-bottom-1 data-[status=active]:after:h-0.5 data-[status=active]:after:rounded-full data-[status=active]:after:bg-primary"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:ml-6">
          <Link to="/ressources" aria-label="Rechercher" className="rounded-full p-2 hover:bg-muted">
            <Search className="h-5 w-5" />
          </Link>
          {user ? (
            <>
              {formateur ? (
                <Link to="/formateur" className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 sm:flex">
                  <Users className="h-4 w-4" /> Espace formateur
                </Link>
              ) : (
                <MenuParticipant />
              )}
              <button onClick={deconnexion} className="hidden items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted sm:flex">
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            </>
          ) : (
            <Link to="/connexion" className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 sm:flex">
              <User className="h-4 w-4" /> Se connecter
            </Link>
          )}
          <button className="rounded-full p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-card px-4 py-3 lg:hidden">
          {[
            ...nav,
            ...(!user
              ? [{ to: "/connexion", label: "Se connecter" } as const]
              : formateur
                ? [{ to: "/mon-espace", label: "Mon espace" } as const, { to: "/formateur", label: "Espace formateur" } as const]
                : []),
          ].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted data-[status=active]:text-primary">
              {n.label}
            </Link>
          ))}
          {user && !formateur && (
            <div className="mt-2 border-t pt-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mon espace</p>
              {PAGES_PARTICIPANT.map(({ to, label, icone: Icone }) => (
                <Link key={to} to={to} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted data-[status=active]:text-primary">
                  <Icone className="h-4 w-4" /> {label}
                </Link>
              ))}
            </div>
          )}
          {user && (
            <button onClick={deconnexion} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

/** Menu du compte participant : ses pages personnelles et le parcours de démarrage. */
function MenuParticipant() {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 sm:flex">
        <User className="h-4 w-4" /> Mon espace <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {PAGES_PARTICIPANT.map(({ to, label, icone: Icone }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to} className="flex cursor-pointer items-center gap-2"><Icone className="h-4 w-4 text-primary" /> {label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/bienvenue" className="flex cursor-pointer items-center gap-2"><Compass className="h-4 w-4 text-primary" /> Démarrage et consignes</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Banner() {
  return (
    <section className="bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-4 py-6 text-center">
        <Brain className="hidden h-10 w-10 shrink-0 text-sky sm:block" strokeWidth={1.4} />
        <p className="font-display text-base font-semibold md:text-lg">
          Ensemble, faisons de l'IA un levier pour une recherche <span className="text-sky">plus ouverte, plus rapide et plus impactante.</span>
        </p>
      </div>
    </section>
  );
}

const mobileNav = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/formations", label: "Formations", icon: GraduationCap },
  { to: "/exercices", label: "Exercices", icon: PenLine },
  { to: "/ressources", label: "Ressources", icon: BookOpen },
  { to: "/outils-ia", label: "Outils", icon: Wrench },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Banner />
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card lg:hidden">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} activeOptions={{ exact: to === "/" }} className="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground data-[status=active]:text-primary">
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHero({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <span className="inline-block rounded-full bg-secondary px-4 py-1 text-sm font-medium text-secondary-foreground">{badge}</span>
        <h1 className="mt-4 text-4xl font-bold text-navy md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
