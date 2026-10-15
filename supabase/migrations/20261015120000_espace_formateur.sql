-- Espace formateur : profils, groupes, tentatives et réponses aux QCM / exercices.
-- Le rôle « formateur » s'attribue uniquement à la main (SQL Editor) :
--   update public.profiles set role = 'formateur' where id = (select id from auth.users where email = '...');

-- ───────────────────────── Tables ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom_complet text not null default '' check (char_length(nom_complet) <= 120),
  role text not null default 'apprenant' check (role in ('apprenant', 'formateur')),
  created_at timestamptz not null default now()
);

create table public.groupes (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(btrim(nom)) between 1 and 120),
  formateur_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  code_invitation text not null unique check (code_invitation ~ '^[A-Z0-9]{6}$'),
  created_at timestamptz not null default now()
);

create table public.membres_groupe (
  groupe_id uuid not null references public.groupes (id) on delete cascade,
  apprenant_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (groupe_id, apprenant_id)
);

create table public.tentatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  cours text not null default 'comprendre-ia',
  type text not null check (type in ('qcm', 'exercice')),
  categorie text,
  niveau text check (niveau in ('debutant', 'intermediaire', 'avance')),
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  created_at timestamptz not null default now(),
  check (score <= total)
);

create table public.reponses (
  id uuid primary key default gen_random_uuid(),
  tentative_id uuid not null references public.tentatives (id) on delete cascade,
  question_id text not null,
  correcte boolean not null,
  reponse_donnee text check (char_length(reponse_donnee) <= 2000),
  created_at timestamptz not null default now()
);

create index reponses_question_id_idx on public.reponses (question_id);
create index reponses_tentative_id_idx on public.reponses (tentative_id);
create index tentatives_user_id_created_at_idx on public.tentatives (user_id, created_at desc);
create index membres_groupe_apprenant_id_idx on public.membres_groupe (apprenant_id);
create index groupes_formateur_id_idx on public.groupes (formateur_id);

-- ───────────────────────── Profil créé à l'inscription ─────────────────────────

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nom_complet)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'nom_complet', ''), 120));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Code d'invitation ─────────────────────────

-- SECURITY DEFINER : l'unicité doit être vérifiée sur tous les groupes, pas seulement ceux visibles.
create function public.generer_code_invitation()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sans 0/O ni 1/I
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.groupes g where g.code_invitation = code);
  end loop;
  return code;
end;
$$;

alter table public.groupes alter column code_invitation set default public.generer_code_invitation();

-- ───────────────────────── Fonctions d'autorisation ─────────────────────────
-- SECURITY DEFINER pour éviter la récursion entre les politiques RLS.

create function public.est_formateur()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'formateur');
$$;

-- Vrai si l'apprenant est membre d'un groupe du formateur connecté.
create function public.est_formateur_de(apprenant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.est_formateur() and exists (
    select 1
    from public.membres_groupe m
    join public.groupes g on g.id = m.groupe_id
    where m.apprenant_id = apprenant and g.formateur_id = auth.uid()
  );
$$;

create function public.est_formateur_du_groupe(groupe uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.est_formateur() and exists (
    select 1 from public.groupes g where g.id = groupe and g.formateur_id = auth.uid()
  );
$$;

create function public.est_membre_de(groupe uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.membres_groupe m where m.groupe_id = groupe and m.apprenant_id = auth.uid()
  );
$$;

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles enable row level security;
alter table public.groupes enable row level security;
alter table public.membres_groupe enable row level security;
alter table public.tentatives enable row level security;
alter table public.reponses enable row level security;

-- profiles : chacun lit son profil ; un formateur lit ceux des apprenants de ses groupes.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.est_formateur_de(id));
-- Mise à jour de son propre profil, limitée à la colonne nom_complet (voir les GRANT plus bas) :
-- personne ne peut changer son rôle depuis le site.
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- groupes : le formateur gère les siens ; un membre voit le groupe qu'il a rejoint.
create policy "groupes_select" on public.groupes for select to authenticated
  using (formateur_id = (select auth.uid()) or public.est_membre_de(id));
create policy "groupes_insert" on public.groupes for insert to authenticated
  with check (formateur_id = (select auth.uid()) and public.est_formateur());
create policy "groupes_update" on public.groupes for update to authenticated
  using (formateur_id = (select auth.uid()) and public.est_formateur())
  with check (formateur_id = (select auth.uid()));
create policy "groupes_delete" on public.groupes for delete to authenticated
  using (formateur_id = (select auth.uid()) and public.est_formateur());

-- membres_groupe : l'adhésion passe par rejoindre_groupe() ; on peut quitter un groupe,
-- et le formateur peut retirer un membre de ses groupes.
create policy "membres_select" on public.membres_groupe for select to authenticated
  using (apprenant_id = (select auth.uid()) or public.est_formateur_du_groupe(groupe_id));
create policy "membres_delete" on public.membres_groupe for delete to authenticated
  using (apprenant_id = (select auth.uid()) or public.est_formateur_du_groupe(groupe_id));

-- tentatives : l'apprenant lit et écrit les siennes ; le formateur lit celles de ses apprenants.
create policy "tentatives_select" on public.tentatives for select to authenticated
  using (user_id = (select auth.uid()) or public.est_formateur_de(user_id));
create policy "tentatives_insert" on public.tentatives for insert to authenticated
  with check (user_id = (select auth.uid()));

-- reponses : mêmes règles, via la tentative associée.
create policy "reponses_select" on public.reponses for select to authenticated
  using (exists (
    select 1 from public.tentatives t
    where t.id = tentative_id and (t.user_id = (select auth.uid()) or public.est_formateur_de(t.user_id))
  ));
create policy "reponses_insert" on public.reponses for insert to authenticated
  with check (exists (
    select 1 from public.tentatives t where t.id = tentative_id and t.user_id = (select auth.uid())
  ));

-- ───────────────────────── Droits ─────────────────────────

revoke all on public.profiles, public.groupes, public.membres_groupe, public.tentatives, public.reponses from anon;
revoke all on public.profiles, public.groupes, public.membres_groupe, public.tentatives, public.reponses from authenticated;

grant select on public.profiles to authenticated;
grant update (nom_complet) on public.profiles to authenticated;
grant select, insert (nom), delete on public.groupes to authenticated;
grant update (nom) on public.groupes to authenticated;
grant select, delete on public.membres_groupe to authenticated;
grant select, insert on public.tentatives to authenticated;
grant select, insert on public.reponses to authenticated;

-- ───────────────────────── RPC apprenant ─────────────────────────

-- Rejoindre un groupe avec son code (le code n'est pas lisible via RLS par un non-membre).
create function public.rejoindre_groupe(p_code text)
returns table (id uuid, nom text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.groupes;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '28000';
  end if;
  select * into g from public.groupes where code_invitation = upper(btrim(p_code));
  if not found then
    raise exception 'Code d''invitation inconnu' using errcode = 'P0002';
  end if;
  insert into public.membres_groupe (groupe_id, apprenant_id)
  values (g.id, auth.uid())
  on conflict do nothing;
  return query select g.id, g.nom;
end;
$$;

-- Enregistre une ou plusieurs tentatives avec le détail de leurs réponses, en une transaction.
-- p_tentatives : [{ cours, type, categorie, niveau, score, total, created_at?, reponses: [{ question_id, correcte, reponse_donnee }] }]
create function public.enregistrer_tentatives(p_tentatives jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  t jsonb;
  r jsonb;
  tid uuid;
  n integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise' using errcode = '28000';
  end if;
  if jsonb_typeof(p_tentatives) <> 'array' or jsonb_array_length(p_tentatives) > 200 then
    raise exception 'Format invalide' using errcode = '22023';
  end if;
  for t in select * from jsonb_array_elements(p_tentatives) loop
    insert into public.tentatives (user_id, cours, type, categorie, niveau, score, total, created_at)
    values (
      auth.uid(),
      coalesce(t ->> 'cours', 'comprendre-ia'),
      t ->> 'type',
      t ->> 'categorie',
      t ->> 'niveau',
      (t ->> 'score')::integer,
      (t ->> 'total')::integer,
      least(coalesce((t ->> 'created_at')::timestamptz, now()), now())
    )
    returning id into tid;
    for r in select * from jsonb_array_elements(coalesce(t -> 'reponses', '[]'::jsonb)) loop
      insert into public.reponses (tentative_id, question_id, correcte, reponse_donnee)
      values (tid, r ->> 'question_id', (r ->> 'correcte')::boolean, r ->> 'reponse_donnee');
    end loop;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Progression d'un apprenant, par catégorie et par niveau (lui-même ou son formateur).
create function public.progression_apprenant(p_apprenant uuid default null)
returns table (dimension text, cle text, nb_tentatives bigint, taux_reussite numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cible uuid := coalesce(p_apprenant, auth.uid());
begin
  if cible is null or not (cible = auth.uid() or public.est_formateur_de(cible)) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  return query
    select 'categorie'::text, t.categorie, count(*), round(100.0 * sum(t.score) / sum(t.total), 1)
    from public.tentatives t where t.user_id = cible and t.categorie is not null
    group by t.categorie
    union all
    select 'niveau'::text, t.niveau, count(*), round(100.0 * sum(t.score) / sum(t.total), 1)
    from public.tentatives t where t.user_id = cible and t.niveau is not null
    group by t.niveau;
end;
$$;

-- ───────────────────────── RPC formateur ─────────────────────────
-- Filtres communs : p_debut (début de période, null = tout) et p_niveau (null = tous).

create function public.verifier_formateur_du_groupe(p_groupe uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.est_formateur_du_groupe(p_groupe) then
    raise exception 'Accès réservé au formateur du groupe' using errcode = '42501';
  end if;
end;
$$;

create function public.stats_groupe(p_groupe uuid, p_debut timestamptz default null, p_niveau text default null)
returns table (nb_membres bigint, nb_actifs bigint, nb_tentatives bigint, score_moyen numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    with t as (
      select t.* from public.tentatives t
      join public.membres_groupe m on m.apprenant_id = t.user_id and m.groupe_id = p_groupe
      where (p_debut is null or t.created_at >= p_debut) and (p_niveau is null or t.niveau = p_niveau)
    )
    select
      (select count(*) from public.membres_groupe m where m.groupe_id = p_groupe),
      (select count(distinct t.user_id) from t),
      (select count(*) from t),
      (select round(100.0 * sum(t.score) / nullif(sum(t.total), 0), 1) from t);
end;
$$;

create function public.reussite_par_categorie(p_groupe uuid, p_debut timestamptz default null, p_niveau text default null)
returns table (categorie text, nb_tentatives bigint, taux_reussite numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    select t.categorie, count(*), round(100.0 * sum(t.score) / sum(t.total), 1)
    from public.tentatives t
    join public.membres_groupe m on m.apprenant_id = t.user_id and m.groupe_id = p_groupe
    where t.categorie is not null
      and (p_debut is null or t.created_at >= p_debut) and (p_niveau is null or t.niveau = p_niveau)
    group by t.categorie
    order by 3 asc;
end;
$$;

create function public.resultats_apprenants(p_groupe uuid, p_debut timestamptz default null, p_niveau text default null)
returns table (
  apprenant_id uuid,
  nom_complet text,
  nb_tentatives bigint,
  score_moyen numeric,
  derniere_activite timestamptz,
  categorie_faible text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    with t as (
      select t.* from public.tentatives t
      join public.membres_groupe m on m.apprenant_id = t.user_id and m.groupe_id = p_groupe
      where (p_debut is null or t.created_at >= p_debut) and (p_niveau is null or t.niveau = p_niveau)
    ),
    par_cat as (
      select t.user_id, t.categorie, sum(t.score)::numeric / sum(t.total) as taux,
             row_number() over (partition by t.user_id order by sum(t.score)::numeric / sum(t.total), t.categorie) as rang
      from t where t.categorie is not null
      group by t.user_id, t.categorie
    )
    select
      p.id,
      p.nom_complet,
      count(t.id),
      round(100.0 * sum(t.score) / nullif(sum(t.total), 0), 1),
      max(t.created_at),
      (select c.categorie from par_cat c where c.user_id = p.id and c.rang = 1)
    from public.membres_groupe m
    join public.profiles p on p.id = m.apprenant_id
    left join t on t.user_id = p.id
    where m.groupe_id = p_groupe
    group by p.id, p.nom_complet
    order by p.nom_complet;
end;
$$;

create function public.questions_ratees(
  p_groupe uuid,
  p_debut timestamptz default null,
  p_niveau text default null,
  p_min_reponses integer default 3
)
returns table (
  question_id text,
  nb_reponses bigint,
  nb_echecs bigint,
  taux_echec numeric,
  reponse_frequente text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    with r as (
      select r.question_id, r.correcte, r.reponse_donnee
      from public.reponses r
      join public.tentatives t on t.id = r.tentative_id
      join public.membres_groupe m on m.apprenant_id = t.user_id and m.groupe_id = p_groupe
      where (p_debut is null or t.created_at >= p_debut) and (p_niveau is null or t.niveau = p_niveau)
    )
    select
      r.question_id,
      count(*),
      count(*) filter (where not r.correcte),
      round(100.0 * count(*) filter (where not r.correcte) / count(*), 1),
      mode() within group (order by r.reponse_donnee) filter (where not r.correcte)
    from r
    group by r.question_id
    having count(*) >= greatest(p_min_reponses, 1) and count(*) filter (where not r.correcte) > 0
    order by 4 desc, 2 desc;
end;
$$;

-- Détail des tentatives du groupe, pour l'export CSV.
create function public.tentatives_groupe(p_groupe uuid, p_debut timestamptz default null, p_niveau text default null)
returns table (
  nom_complet text,
  created_at timestamptz,
  type text,
  categorie text,
  niveau text,
  score integer,
  total integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    select p.nom_complet, t.created_at, t.type, t.categorie, t.niveau, t.score, t.total
    from public.tentatives t
    join public.membres_groupe m on m.apprenant_id = t.user_id and m.groupe_id = p_groupe
    join public.profiles p on p.id = t.user_id
    where (p_debut is null or t.created_at >= p_debut) and (p_niveau is null or t.niveau = p_niveau)
    order by p.nom_complet, t.created_at;
end;
$$;

-- Fonctions exposées via l'API : uniquement aux utilisateurs connectés.
revoke execute on function
  public.handle_new_user(),
  public.generer_code_invitation(),
  public.est_formateur(),
  public.est_formateur_de(uuid),
  public.est_formateur_du_groupe(uuid),
  public.est_membre_de(uuid),
  public.verifier_formateur_du_groupe(uuid),
  public.rejoindre_groupe(text),
  public.enregistrer_tentatives(jsonb),
  public.progression_apprenant(uuid),
  public.stats_groupe(uuid, timestamptz, text),
  public.reussite_par_categorie(uuid, timestamptz, text),
  public.resultats_apprenants(uuid, timestamptz, text),
  public.questions_ratees(uuid, timestamptz, text, integer),
  public.tentatives_groupe(uuid, timestamptz, text)
from public, anon;

grant execute on function
  public.generer_code_invitation(),
  public.est_formateur(),
  public.est_formateur_de(uuid),
  public.est_formateur_du_groupe(uuid),
  public.est_membre_de(uuid),
  public.rejoindre_groupe(text),
  public.enregistrer_tentatives(jsonb),
  public.progression_apprenant(uuid),
  public.stats_groupe(uuid, timestamptz, text),
  public.reussite_par_categorie(uuid, timestamptz, text),
  public.resultats_apprenants(uuid, timestamptz, text),
  public.questions_ratees(uuid, timestamptz, text, integer),
  public.tentatives_groupe(uuid, timestamptz, text)
to authenticated;
