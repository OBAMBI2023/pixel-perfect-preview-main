-- Profil chercheur (sujet de recherche) et travaux des exercices personnalisés.
-- Données privées : seul le participant lit et modifie les siennes (ni les autres participants, ni le formateur).
-- Migration additive. Retour arrière :
--   drop table public.travaux_recherche;
--   drop table public.profils_chercheur;
--   drop function public.horodater_maj();

-- Met à jour updated_at (et termine_le pour les travaux) à chaque écriture.
create function public.horodater_maj()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_table_name = 'travaux_recherche' then
    new.termine_le := case
      when new.termine then coalesce(case when tg_op = 'UPDATE' then old.termine_le end, now())
    end;
  end if;
  return new;
end;
$$;

-- ───────────────────────── Profil chercheur ─────────────────────────

create table public.profils_chercheur (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  discipline text not null check (char_length(btrim(discipline)) between 2 and 120),
  niveau_etudes text not null check (niveau_etudes in ('licence', 'master', 'doctorat', 'postdoc', 'enseignant', 'autre')),
  etablissement text check (char_length(etablissement) <= 160),
  sujet text not null check (char_length(btrim(sujet)) between 5 and 300),
  problematique text check (char_length(problematique) <= 1000),
  objectif text not null check (char_length(btrim(objectif)) between 5 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profils_chercheur_maj before insert or update on public.profils_chercheur
  for each row execute function public.horodater_maj();

alter table public.profils_chercheur enable row level security;

create policy "profils_chercheur_select" on public.profils_chercheur for select to authenticated
  using (user_id = (select auth.uid()));
create policy "profils_chercheur_insert" on public.profils_chercheur for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "profils_chercheur_update" on public.profils_chercheur for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.profils_chercheur from anon;
revoke all on public.profils_chercheur from authenticated;
grant select on public.profils_chercheur to authenticated;
-- user_id n'est jamais fourni par le navigateur : valeur par défaut auth.uid().
grant insert (discipline, niveau_etudes, etablissement, sujet, problematique, objectif) on public.profils_chercheur to authenticated;
grant update (discipline, niveau_etudes, etablissement, sujet, problematique, objectif) on public.profils_chercheur to authenticated;

-- ───────────────────────── Travaux des exercices personnalisés ─────────────────────────

create table public.travaux_recherche (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  exercice text not null check (exercice in ('prompt', 'mots-cles', 'equation', 'references')),
  sujet text not null check (char_length(sujet) <= 300), -- sujet du profil au moment du travail
  contenu jsonb not null default '{}'
    check (jsonb_typeof(contenu) = 'object' and pg_column_size(contenu) <= 20000),
  termine boolean not null default false,
  termine_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercice)
);

create trigger travaux_recherche_maj before insert or update on public.travaux_recherche
  for each row execute function public.horodater_maj();

alter table public.travaux_recherche enable row level security;

create policy "travaux_recherche_select" on public.travaux_recherche for select to authenticated
  using (user_id = (select auth.uid()));
create policy "travaux_recherche_insert" on public.travaux_recherche for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "travaux_recherche_update" on public.travaux_recherche for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.travaux_recherche from anon;
revoke all on public.travaux_recherche from authenticated;
grant select on public.travaux_recherche to authenticated;
grant insert (exercice, sujet, contenu, termine) on public.travaux_recherche to authenticated;
-- exercice inclus : l'upsert de l'API réécrit toutes les colonnes envoyées.
grant update (exercice, sujet, contenu, termine) on public.travaux_recherche to authenticated;

revoke execute on function public.horodater_maj() from public, anon, authenticated;
