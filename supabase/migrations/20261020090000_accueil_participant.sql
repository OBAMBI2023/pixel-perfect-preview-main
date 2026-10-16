-- Parcours d'accueil : page de bienvenue vue, étapes de démarrage cochées et mode de participation.
-- Table à part : elle n'entre dans aucun calcul de score ni de progression pédagogique (tentatives).
-- Migration additive. Retour arrière :
--   drop function public.enregistrer_accueil(text, boolean, text, boolean);
--   drop table public.accueil_participant;

create table public.accueil_participant (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- Étapes terminées, dans l'ordre du parcours (voir src/lib/accueil.ts).
  etapes text[] not null default '{}'
    check (etapes <@ array['site', 'programme', 'exercices', 'progression', 'pratique']),
  -- Sert uniquement à adapter les consignes pratiques : aucun effet sur les droits ni les résultats.
  mode_participation text check (mode_participation in ('presentiel', 'distance')),
  accueil_vu_le timestamptz, -- page de bienvenue passée : on ne la repropose plus après la connexion
  termine_le timestamptz,    -- toutes les étapes cochées
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accueil_participant enable row level security;

-- Lecture : le participant lui-même, ou un formateur pour les membres de ses groupes.
create policy "accueil_participant_select" on public.accueil_participant for select to authenticated
  using (user_id = (select auth.uid()) or public.est_formateur_de(user_id));

-- Aucune écriture directe : tout passe par enregistrer_accueil, toujours pour auth.uid().
revoke all on public.accueil_participant from anon;
revoke all on public.accueil_participant from authenticated;
grant select on public.accueil_participant to authenticated;

-- Met à jour le parcours de l'utilisateur connecté (ligne créée au premier appel).
--   p_etape + p_fait : cocher ou décocher une étape ;
--   p_mode : 'presentiel' ou 'distance' ;
--   p_vu : marquer la page de bienvenue comme vue.
create function public.enregistrer_accueil(
  p_etape text default null,
  p_fait boolean default true,
  p_mode text default null,
  p_vu boolean default false
)
returns public.accueil_participant
language plpgsql
security definer
set search_path = ''
as $$
declare
  etapes_parcours constant text[] := array['site', 'programme', 'exercices', 'progression', 'pratique'];
  v_uid uuid := auth.uid();
  v_ligne public.accueil_participant;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if p_etape is not null and not (p_etape = any (etapes_parcours)) then
    raise exception 'Étape inconnue' using errcode = '22023';
  end if;
  if p_mode is not null and p_mode not in ('presentiel', 'distance') then
    raise exception 'Mode de participation inconnu' using errcode = '22023';
  end if;

  insert into public.accueil_participant (user_id) values (v_uid) on conflict (user_id) do nothing;
  select * into v_ligne from public.accueil_participant where user_id = v_uid for update;

  if p_etape is not null then
    v_ligne.etapes := case
      when coalesce(p_fait, true) then array(
        select e from unnest(etapes_parcours) with ordinality as u (e, o)
        where e = p_etape or e = any (v_ligne.etapes)
        order by o
      )
      else array_remove(v_ligne.etapes, p_etape)
    end;
  end if;

  update public.accueil_participant a
  set etapes = v_ligne.etapes,
      mode_participation = coalesce(p_mode, a.mode_participation),
      accueil_vu_le = case when p_vu or p_etape is not null then coalesce(a.accueil_vu_le, now()) else a.accueil_vu_le end,
      termine_le = case when v_ligne.etapes @> etapes_parcours then coalesce(a.termine_le, now()) end,
      updated_at = now()
  where a.user_id = v_uid
  returning * into v_ligne;

  return v_ligne;
end;
$$;

revoke execute on function public.enregistrer_accueil(text, boolean, text, boolean) from public, anon;
grant execute on function public.enregistrer_accueil(text, boolean, text, boolean) to authenticated;
