-- Exercices à rendre : l'apprenant rédige une réponse courte dans un de ses groupes,
-- le formateur du groupe la corrige (note + commentaire) via corriger_soumission().

-- ───────────────────────── Référentiel ─────────────────────────

-- Barème total de chaque exercice : la note maximale ne vient jamais du navigateur.
-- À garder identique à src/data/exercices-a-rendre.ts.
create table public.exercices_a_rendre (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  note_sur numeric(5, 2) not null check (note_sur > 0)
);

insert into public.exercices_a_rendre (id, note_sur) values
  ('ar1', 10), ('ar2', 10), ('ar3', 5), ('ar4', 12), ('ar5', 8), ('ar6', 15);

alter table public.exercices_a_rendre enable row level security;
create policy "exercices_a_rendre_select" on public.exercices_a_rendre for select to authenticated using (true);
revoke all on public.exercices_a_rendre from anon;
revoke all on public.exercices_a_rendre from authenticated;
grant select on public.exercices_a_rendre to authenticated;

-- ───────────────────────── Soumissions ─────────────────────────

-- Une copie par exercice, apprenant et groupe : une nouvelle version remplace le contenu.
create table public.soumissions (
  id uuid primary key default gen_random_uuid(),
  exercice_id text not null references public.exercices_a_rendre (id),
  apprenant_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  groupe_id uuid not null references public.groupes (id) on delete cascade,
  contenu text not null check (char_length(btrim(contenu)) between 1 and 5000),
  statut text not null default 'soumis' check (statut in ('soumis', 'corrige', 'a_refaire')),
  note numeric(5, 2),
  note_sur numeric(5, 2) not null,
  commentaire text check (char_length(commentaire) <= 2000),
  corrige_par uuid references public.profiles (id) on delete set null,
  corrige_le timestamptz,
  consulte_le timestamptz, -- l'apprenant a vu la correction (badge « Nouveau » tant que null)
  soumis_le timestamptz not null default now(), -- dernier envoi du contenu
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exercice_id, apprenant_id, groupe_id),
  check (note is null or (note >= 0 and note <= note_sur))
);

create index soumissions_groupe_id_statut_idx on public.soumissions (groupe_id, statut, soumis_le);
create index soumissions_apprenant_id_idx on public.soumissions (apprenant_id);
create index soumissions_corrige_par_idx on public.soumissions (corrige_par);

-- À l'envoi : note maximale reprise du référentiel, copie « soumise » sans correction.
create function public.soumissions_avant_insertion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select e.note_sur into new.note_sur from public.exercices_a_rendre e where e.id = new.exercice_id;
  new.statut := 'soumis';
  new.note := null;
  new.commentaire := null;
  new.corrige_par := null;
  new.corrige_le := null;
  new.consulte_le := null;
  new.soumis_le := now();
  return new;
end;
$$;

-- À chaque modification : updated_at ; une nouvelle version d'une copie « à refaire » repart en correction.
create function public.soumissions_avant_maj()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.contenu is distinct from old.contenu then
    new.soumis_le := now();
    if old.statut = 'a_refaire' then
      new.statut := 'soumis';
    end if;
  end if;
  return new;
end;
$$;

create trigger soumissions_avant_insertion before insert on public.soumissions
  for each row execute function public.soumissions_avant_insertion();
create trigger soumissions_avant_maj before update on public.soumissions
  for each row execute function public.soumissions_avant_maj();

alter table public.soumissions enable row level security;

-- Lecture : l'apprenant ses copies des groupes dont il est (encore) membre ; le formateur celles de ses groupes.
create policy "soumissions_select" on public.soumissions for select to authenticated
  using (
    (apprenant_id = (select auth.uid()) and public.est_membre_de(groupe_id))
    or public.est_formateur_du_groupe(groupe_id)
  );
-- Envoi : pour soi, dans un groupe dont on est membre et qui n'est pas archivé.
create policy "soumissions_insert" on public.soumissions for insert to authenticated
  with check (
    apprenant_id = (select auth.uid())
    and public.est_membre_de(groupe_id)
    and exists (select 1 from public.groupes g where g.id = groupe_id and g.archive_le is null)
  );
-- Modification du contenu : seulement tant que la copie est « soumise » ou « à refaire ».
create policy "soumissions_update" on public.soumissions for update to authenticated
  using (apprenant_id = (select auth.uid()) and statut in ('soumis', 'a_refaire') and public.est_membre_de(groupe_id))
  with check (apprenant_id = (select auth.uid()));

-- L'apprenant n'écrit que exercice_id, groupe_id et contenu : note, commentaire et statut
-- ne passent que par corriger_soumission().
revoke all on public.soumissions from anon;
revoke all on public.soumissions from authenticated;
grant select on public.soumissions to authenticated;
grant insert (exercice_id, groupe_id, contenu) on public.soumissions to authenticated;
grant update (contenu) on public.soumissions to authenticated;

-- ───────────────────────── Correction ─────────────────────────

create function public.corriger_soumission(p_id uuid, p_note numeric, p_commentaire text, p_statut text)
returns public.soumissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.soumissions;
begin
  select * into s from public.soumissions where id = p_id for update;
  if not found then
    raise exception 'Copie introuvable' using errcode = 'P0002';
  end if;
  if not public.est_formateur_du_groupe(s.groupe_id) then
    raise exception 'Accès réservé au formateur du groupe' using errcode = '42501';
  end if;
  if coalesce(p_statut, '') not in ('corrige', 'a_refaire') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;
  if p_statut = 'corrige' and p_note is null then
    raise exception 'Note obligatoire pour valider la correction' using errcode = '22023';
  end if;
  if p_note is not null and (p_note < 0 or p_note > s.note_sur) then
    raise exception 'La note doit être comprise entre 0 et %', s.note_sur using errcode = '22023';
  end if;
  update public.soumissions
  set note = p_note,
      commentaire = nullif(btrim(p_commentaire), ''),
      statut = p_statut,
      corrige_par = auth.uid(),
      corrige_le = now(),
      consulte_le = null
  where id = p_id
  returning * into s;
  return s;
end;
$$;

-- L'apprenant a ouvert sa copie corrigée (retire le badge « Nouveau »).
create function public.marquer_copie_consultee(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.soumissions
  set consulte_le = now()
  where id = p_id
    and apprenant_id = auth.uid()
    and statut in ('corrige', 'a_refaire')
    and consulte_le is null;
$$;

-- ───────────────────────── Droits d'exécution ─────────────────────────

revoke execute on function
  public.soumissions_avant_insertion(),
  public.soumissions_avant_maj()
from public, anon, authenticated;

revoke execute on function
  public.corriger_soumission(uuid, numeric, text, text),
  public.marquer_copie_consultee(uuid)
from public, anon;

grant execute on function
  public.corriger_soumission(uuid, numeric, text, text),
  public.marquer_copie_consultee(uuid)
to authenticated;
