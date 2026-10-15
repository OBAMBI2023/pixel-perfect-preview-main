-- Espace formateur : archivage des groupes, nouveau code d'invitation, travaux assignés (devoirs)
-- et dernière activité des membres.
-- Renommer un groupe et retirer un membre sont déjà couverts par groupes_update / membres_delete.

-- ───────────────────────── Archivage ─────────────────────────

-- null = groupe actif. Un groupe archivé est masqué de la liste, ses données sont conservées.
alter table public.groupes add column archive_le timestamptz;
grant update (archive_le) on public.groupes to authenticated;

-- Même fonction qu'avant, mais un groupe archivé n'accepte plus de nouveaux membres.
create or replace function public.rejoindre_groupe(p_code text)
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
  if g.archive_le is not null then
    raise exception 'Groupe archivé' using errcode = 'P0001';
  end if;
  insert into public.membres_groupe (groupe_id, apprenant_id)
  values (g.id, auth.uid())
  on conflict do nothing;
  return query select g.id, g.nom;
end;
$$;

-- ───────────────────────── Nouveau code d'invitation ─────────────────────────

-- SECURITY DEFINER : le formateur ne peut pas modifier code_invitation directement (GRANT limité à nom, archive_le).
create function public.regenerer_code_invitation(p_groupe uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  nouveau text;
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  nouveau := public.generer_code_invitation();
  update public.groupes set code_invitation = nouveau where id = p_groupe;
  return nouveau;
end;
$$;

-- ───────────────────────── Devoirs ─────────────────────────

-- categorie / niveau à null = toutes les catégories / tous les niveaux.
create table public.devoirs (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references public.groupes (id) on delete cascade,
  titre text not null check (char_length(btrim(titre)) between 1 and 120),
  type text not null check (type in ('qcm', 'exercice')),
  categorie text check (char_length(categorie) <= 60),
  niveau text check (niveau in ('debutant', 'intermediaire', 'avance')),
  date_limite date,
  created_at timestamptz not null default now()
);

create index devoirs_groupe_id_created_at_idx on public.devoirs (groupe_id, created_at desc);

alter table public.devoirs enable row level security;

-- Le formateur du groupe gère ; les membres lisent.
create policy "devoirs_select" on public.devoirs for select to authenticated
  using (public.est_formateur_du_groupe(groupe_id) or public.est_membre_de(groupe_id));
create policy "devoirs_insert" on public.devoirs for insert to authenticated
  with check (public.est_formateur_du_groupe(groupe_id));
create policy "devoirs_update" on public.devoirs for update to authenticated
  using (public.est_formateur_du_groupe(groupe_id))
  with check (public.est_formateur_du_groupe(groupe_id));
create policy "devoirs_delete" on public.devoirs for delete to authenticated
  using (public.est_formateur_du_groupe(groupe_id));

revoke all on public.devoirs from anon;
revoke all on public.devoirs from authenticated;
grant select, delete on public.devoirs to authenticated;
grant insert (groupe_id, titre, type, categorie, niveau, date_limite) on public.devoirs to authenticated;
-- Modification limitée au titre et à la date limite : changer le type, la catégorie ou le niveau
-- fausserait le suivi des apprenants qui ont déjà commencé.
grant update (titre, date_limite) on public.devoirs to authenticated;

-- Une tentative compte pour un devoir si elle est du même type, créée après le devoir,
-- et de la catégorie / du niveau demandés s'ils sont précisés.
create function public.compte_pour_devoir(t public.tentatives, d public.devoirs)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select t.type = d.type
    and t.created_at >= d.created_at
    and (d.categorie is null or t.categorie = d.categorie)
    and (d.niveau is null or t.niveau = d.niveau);
$$;

-- Devoir « fait » : au moins 5 questions différentes pour un QCM (une tentative QCM = une question),
-- au moins un exercice pour un devoir d'exercices. Garder en phase avec SEUIL_DEVOIR_QCM (src/lib/formateur.ts).
create function public.seuil_devoir(p_type text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case when p_type = 'qcm' then 5 else 1 end;
$$;

-- Suivi formateur : une ligne par devoir et par membre du groupe.
create function public.suivi_devoirs(p_groupe uuid)
returns table (
  devoir_id uuid,
  apprenant_id uuid,
  nom_complet text,
  nb_tentatives bigint,
  nb_questions bigint,
  score_moyen numeric,
  derniere_tentative timestamptz,
  fait boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    select
      d.id,
      p.id,
      p.nom_complet,
      a.nb,
      q.nb,
      a.score,
      a.derniere,
      q.nb >= public.seuil_devoir(d.type)
    from public.devoirs d
    join public.membres_groupe m on m.groupe_id = d.groupe_id
    join public.profiles p on p.id = m.apprenant_id
    cross join lateral (
      select count(*) as nb, round(100.0 * sum(t.score) / nullif(sum(t.total), 0), 1) as score, max(t.created_at) as derniere
      from public.tentatives t
      where t.user_id = m.apprenant_id and public.compte_pour_devoir(t, d)
    ) a
    cross join lateral (
      select count(distinct r.question_id) as nb
      from public.tentatives t
      join public.reponses r on r.tentative_id = t.id
      where t.user_id = m.apprenant_id and public.compte_pour_devoir(t, d)
    ) q
    where d.groupe_id = p_groupe
    order by p.nom_complet;
end;
$$;

-- Côté apprenant : ses devoirs (groupes non archivés), avec l'avancement. SECURITY INVOKER : la RLS suffit.
create function public.mes_devoirs()
returns table (
  id uuid,
  groupe_id uuid,
  groupe_nom text,
  titre text,
  type text,
  categorie text,
  niveau text,
  date_limite date,
  created_at timestamptz,
  nb_questions bigint,
  fait boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    d.id, d.groupe_id, g.nom, d.titre, d.type, d.categorie, d.niveau, d.date_limite, d.created_at,
    q.nb, q.nb >= public.seuil_devoir(d.type)
  from public.devoirs d
  join public.groupes g on g.id = d.groupe_id
  join public.membres_groupe m on m.groupe_id = d.groupe_id and m.apprenant_id = auth.uid()
  cross join lateral (
    select count(distinct r.question_id) as nb
    from public.tentatives t
    join public.reponses r on r.tentative_id = t.id
    where t.user_id = auth.uid() and public.compte_pour_devoir(t, d)
  ) q
  where g.archive_le is null
  order by d.date_limite nulls last, d.created_at;
$$;

-- ───────────────────────── Activité des membres ─────────────────────────

-- Dernière tentative de chaque membre, toutes périodes et tous niveaux confondus (badge « Inactif »).
create function public.activite_membres(p_groupe uuid)
returns table (apprenant_id uuid, joined_at timestamptz, derniere_activite timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.verifier_formateur_du_groupe(p_groupe);
  return query
    select m.apprenant_id, m.joined_at, (select max(t.created_at) from public.tentatives t where t.user_id = m.apprenant_id)
    from public.membres_groupe m
    where m.groupe_id = p_groupe;
end;
$$;

-- ───────────────────────── Droits d'exécution ─────────────────────────

revoke execute on function
  public.regenerer_code_invitation(uuid),
  public.compte_pour_devoir(public.tentatives, public.devoirs),
  public.seuil_devoir(text),
  public.suivi_devoirs(uuid),
  public.mes_devoirs(),
  public.activite_membres(uuid)
from public, anon;

grant execute on function
  public.regenerer_code_invitation(uuid),
  public.compte_pour_devoir(public.tentatives, public.devoirs),
  public.seuil_devoir(text),
  public.suivi_devoirs(uuid),
  public.mes_devoirs(),
  public.activite_membres(uuid)
to authenticated;
