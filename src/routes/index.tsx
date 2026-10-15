import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileText, GraduationCap, Laptop, Lightbulb, Network, Search, Users } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IA et la Recherche — L'IA au service de la recherche" },
      { name: "description", content: "Plateforme pédagogique pour apprendre l'intelligence artificielle appliquée à la recherche scientifique." },
      { property: "og:title", content: "IA et la Recherche" },
      { property: "og:description", content: "Comprendre, explorer et innover avec l'IA dans la recherche." },
    ],
  }),
  component: Index,
});

const floating = [
  { icon: Search, label: "Analyse de données" },
  { icon: FileText, label: "Rédaction assistée" },
  { icon: Lightbulb, label: "Nouvelles perspectives" },
  { icon: Network, label: "Innovation" },
];

const cards = [
  { icon: BookOpen, title: "Comprendre l'IA", text: "Découvre les fondamentaux de l'intelligence artificielle et ses applications dans la recherche.", action: "Explorer", to: "/formations", slug: "comprendre-ia", bg: "bg-tint-green", fg: "text-tint-green-fg" },
  { icon: Search, title: "Méthodes de recherche", text: "Apprends à utiliser l'IA pour mieux collecter, analyser et exploiter les données scientifiques.", action: "Voir les cours", to: "/formations", bg: "bg-tint-purple", fg: "text-tint-purple-fg" },
  { icon: Laptop, title: "Outils et ressources", text: "Accède aux meilleurs outils IA, aux guides pratiques et aux ressources utiles pour tes projets.", action: "Découvrir", to: "/outils-ia", bg: "bg-tint-blue", fg: "text-tint-blue-fg" },
  { icon: Lightbulb, title: "Cas pratiques", text: "Explore des exemples concrets d'utilisation de l'IA dans différents domaines de recherche.", action: "Voir les cas", to: "/exercices", bg: "bg-tint-amber", fg: "text-tint-amber-fg" },
  { icon: Users, title: "Communauté", text: "Échange avec d'autres apprenants, chercheurs et experts autour de l'IA et de la recherche.", action: "Rejoindre", to: "/a-propos", bg: "bg-tint-rose", fg: "text-tint-rose-fg" },
] as const;

function Index() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Chercheuse travaillant avec l'IA dans un laboratoire" width={1920} height={800} className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl items-center px-4 py-16 md:px-8">
          <div className="max-w-xl animate-rise">
            <span className="inline-block rounded-full bg-secondary px-4 py-1 font-medium text-secondary-foreground">Site pédagogique</span>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-navy md:text-7xl">
              L'IA au service <span className="block text-primary">de la recherche</span>
            </h1>
            <p className="mt-6 text-lg text-foreground md:text-xl">
              Découvrez comment l'intelligence artificielle transforme la recherche, de la collecte de données à la valorisation des résultats.
            </p>
            <Link to="/formations" className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-card transition hover:-translate-y-0.5">
              <GraduationCap className="h-5 w-5" /> Commencer à apprendre <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-6 xl:flex">
            {floating.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-4 text-navy-foreground">
                <span className="grid h-14 w-14 place-items-center rounded-xl border border-sky/60 bg-navy/40 backdrop-blur"><Icon className="h-7 w-7" /></span>
                <span className="w-24 text-sm font-medium drop-shadow">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:grid-cols-2 md:px-8 lg:grid-cols-5">
        {cards.map((card) => {
          const { icon: Icon, title, text, action, to, bg, fg } = card;
          const linkClass = `mt-5 inline-flex items-center gap-2 text-sm font-semibold ${fg}`;
          return (
            <div key={title} className="flex flex-col rounded-2xl bg-card p-7 shadow-card transition hover:-translate-y-1">
              <span className={`grid h-16 w-16 place-items-center rounded-full ${bg}`}><Icon className={`h-8 w-8 ${fg}`} /></span>
              <h3 className="mt-5 text-lg font-bold text-navy">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              {"slug" in card ? (
                <Link to="/formations/$slug" params={{ slug: card.slug }} className={linkClass}>{action} <ArrowRight className="h-4 w-4" /></Link>
              ) : (
                <Link to={to} className={linkClass}>{action} <ArrowRight className="h-4 w-4" /></Link>
              )}
            </div>
          );
        })}
      </section>
    </SiteLayout>
  );
}
