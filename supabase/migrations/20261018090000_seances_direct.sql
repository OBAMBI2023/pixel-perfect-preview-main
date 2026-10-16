-- Séance en direct : le formateur fait défiler la présentation, les apprenants du groupe suivent
-- sur leur téléphone (Supabase Realtime) et envoient « pas compris », questions et réponses.

-- ───────────────────────── Séances ─────────────────────────

create table public.seances_direct (
  id uuid primary key default gen_random_uuid(),
  groupe_id uuid not null references public.groupes (id) on delete cascade,
  formateur_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  presentation text not null default 'comprendre-ia' check (presentation ~ '^[a-z0-9-]{1,40}$'),
  diapo_courante int not null default 0 check (diapo_courante between 0 and 199),
  diapo_depuis timestamptz not null default now(), -- chronomètre de la diapositive en cours
  -- Question posée à la salle (copiée des notes orales au moment où elle est posée).
  question_diapo int check (question_diapo between 0 and 199),
  question_texte text check (char_length(question_texte) between 1 and 500),
  statut text not null default 'en_cours' check (statut in ('en_cours', 'terminee')),
  debut_le timestamptz not null default now(),
  fin_le timestamptz,
  check ((question_diapo is null) = (question_texte is null))
);

-- Une seule séance en cours par groupe.
create unique index seances_direct_une_en_cours_idx on public.seances_direct (groupe_id) where statut = 'en_cours';
create index seances_direct_groupe_id_idx on public.seances_direct (groupe_id, debut_le desc);
create index seances_direct_formateur_id_idx on public.seances_direct (formateur_id);

-- Création : séance « en cours » sans question. Mise à jour : chronomètre de diapositive,
-- fin de séance (définitive) et question retirée quand on change de diapositive ou qu'on termine.
create function public.seances_direct_avant_ecriture()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.statut := 'en_cours';
    new.diapo_courante := 0;
    new.diapo_depuis := now();
    new.question_diapo := null;
    new.question_texte := null;
    new.debut_le := now();
    new.fin_le := null;
    return new;
  end if;
  if old.statut = 'terminee' then
    raise exception 'Cette séance est terminée' using errcode = '22023';
  end if;
  if new.diapo_courante is distinct from old.diapo_courante then
    new.diapo_depuis := now();
    if new.question_diapo is not distinct from old.question_diapo then
      new.question_diapo := null;
      new.question_texte := null;
    end if;
  end if;
  if new.statut = 'terminee' then
    new.fin_le := now();
    new.question_diapo := null;
    new.question_texte := null;
  end if;
  return new;
end;
$$;

create trigger seances_direct_avant_ecriture before insert or update on public.seances_direct
  for each row execute function public.seances_direct_avant_ecriture();

alter table public.seances_direct enable row level security;

-- Lecture : le formateur du groupe et les membres du groupe.
create policy "seances_direct_select" on public.seances_direct for select to authenticated
  using (public.est_formateur_du_groupe(groupe_id) or public.est_membre_de(groupe_id));
-- Création et modification : le formateur du groupe (groupe non archivé pour démarrer).
create policy "seances_direct_insert" on public.seances_direct for insert to authenticated
  with check (
    formateur_id = (select auth.uid())
    and public.est_formateur_du_groupe(groupe_id)
    and exists (select 1 from public.groupes g where g.id = groupe_id and g.archive_le is null)
  );
create policy "seances_direct_update" on public.seances_direct for update to authenticated
  using (public.est_formateur_du_groupe(groupe_id))
  with check (public.est_formateur_du_groupe(groupe_id));

revoke all on public.seances_direct from anon;
revoke all on public.seances_direct from authenticated;
grant select on public.seances_direct to authenticated;
grant insert (groupe_id, presentation) on public.seances_direct to authenticated;
grant update (diapo_courante, question_diapo, question_texte, statut) on public.seances_direct to authenticated;

-- ───────────────────────── Réactions ─────────────────────────

create table public.reactions_seance (
  id uuid primary key default gen_random_uuid(),
  seance_id uuid not null references public.seances_direct (id) on delete cascade,
  apprenant_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  diapo int not null check (diapo between 0 and 199),
  type text not null check (type in ('pas_compris', 'question', 'reponse')),
  texte text check (char_length(btrim(texte)) between 1 and 300),
  created_at timestamptz not null default now(),
  -- « Pas compris » sans texte ; question et réponse avec texte.
  check ((type = 'pas_compris') = (texte is null))
);

create index reactions_seance_seance_id_idx on public.reactions_seance (seance_id, diapo, type);
create index reactions_seance_apprenant_id_idx on public.reactions_seance (apprenant_id);
-- Un « pas compris » et une réponse par apprenant et par diapositive.
create unique index reactions_seance_une_par_diapo_idx on public.reactions_seance (seance_id, apprenant_id, diapo, type)
  where type in ('pas_compris', 'reponse');

alter table public.reactions_seance enable row level security;

-- Lecture : le formateur du groupe ; l'apprenant relit les siennes (état des boutons après rechargement).
create policy "reactions_seance_select" on public.reactions_seance for select to authenticated
  using (
    apprenant_id = (select auth.uid())
    or exists (select 1 from public.seances_direct s where s.id = seance_id and public.est_formateur_du_groupe(s.groupe_id))
  );
-- Envoi : pour soi, membre du groupe, pendant la séance, sur une diapositive déjà montrée ;
-- une réponse seulement à la question posée en ce moment.
create policy "reactions_seance_insert" on public.reactions_seance for insert to authenticated
  with check (
    apprenant_id = (select auth.uid())
    and exists (
      select 1 from public.seances_direct s
      where s.id = seance_id
        and s.statut = 'en_cours'
        and public.est_membre_de(s.groupe_id)
        and diapo <= s.diapo_courante
        and (type <> 'reponse' or diapo = s.question_diapo)
    )
  );

revoke all on public.reactions_seance from anon;
revoke all on public.reactions_seance from authenticated;
grant select on public.reactions_seance to authenticated;
grant insert (seance_id, diapo, type, texte) on public.reactions_seance to authenticated;

-- ───────────────────────── Realtime et droits ─────────────────────────

-- Diffusion des changements (filtrés par la RLS de chaque abonné).
alter publication supabase_realtime add table public.seances_direct, public.reactions_seance;

revoke execute on function public.seances_direct_avant_ecriture() from public, anon, authenticated;
