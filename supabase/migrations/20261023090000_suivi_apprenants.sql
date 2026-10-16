-- Suivi des apprenants par les formateurs.
-- Principe d'accès inchangé : un formateur ne voit que les apprenants membres de SES groupes
-- (public.est_formateur_de) ; jamais l'ensemble des profils. Migration additive. Retour arrière :
--   drop function public.marquer_retour_consulte(uuid);
--   drop function public.enregistrer_retour(uuid, text, text, numeric, numeric, text, text, text, text);
--   drop table public.retours_formateur;
--   drop function public.corriger_soumission_detaillee(uuid, numeric, text, text, text, text);
--   alter table public.soumissions drop column points_acquis, drop column points_a_ameliorer;
--   drop policy "profils_chercheur_select_formateur" on public.profils_chercheur;
--   drop policy "travaux_recherche_select_formateur" on public.travaux_recherche;
--   drop policy "analyses_pertinence_select_formateur" on public.analyses_pertinence;

-- ───────── 1. Lecture des travaux personnels par le formateur de l'apprenant ─────────
-- Lecture seule : aucune politique d'écriture n'est ajoutée, les travaux restent modifiables par leur seul auteur.

create policy "profils_chercheur_select_formateur" on public.profils_chercheur for select to authenticated
  using (public.est_formateur_de(user_id));
create policy "travaux_recherche_select_formateur" on public.travaux_recherche for select to authenticated
  using (public.est_formateur_de(user_id));
create policy "analyses_pertinence_select_formateur" on public.analyses_pertinence for select to authenticated
  using (public.est_formateur_de(user_id));

-- ───────── 2. Points acquis / à améliorer sur les copies (exercices à rendre) ─────────

alter table public.soumissions
  add column points_acquis text check (char_length(points_acquis) <= 2000),
  add column points_a_ameliorer text check (char_length(points_a_ameliorer) <= 2000);

-- Même contrôles que corriger_soumission (réutilisée telle quelle), plus les deux champs.
-- Le contenu de la copie n'est jamais modifié.
create function public.corriger_soumission_detaillee(
  p_id uuid,
  p_note numeric,
  p_commentaire text,
  p_statut text,
  p_points_acquis text,
  p_points_a_ameliorer text
)
returns public.soumissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.soumissions;
begin
  s := public.corriger_soumission(p_id, p_note, p_commentaire, p_statut);
  update public.soumissions
  set points_acquis = nullif(btrim(p_points_acquis), ''),
      points_a_ameliorer = nullif(btrim(p_points_a_ameliorer), '')
  where id = s.id
  returning * into s;
  return s;
end;
$$;

-- ───────── 3. Retours sur les exercices personnalisés et les analyses d'articles ─────────

create table public.retours_formateur (
  id uuid primary key default gen_random_uuid(),
  apprenant_id uuid not null references public.profiles (id) on delete cascade,
  formateur_id uuid not null references public.profiles (id) on delete cascade,
  objet text not null check (objet in ('travail_recherche', 'analyse_pertinence')),
  objet_id text not null check (char_length(objet_id) between 1 and 250), -- exercice ou article_id
  statut text not null check (statut in ('corrige', 'a_refaire')),
  note numeric(5, 2),
  note_sur numeric(5, 2),
  appreciation text check (char_length(appreciation) <= 2000),
  points_acquis text check (char_length(points_acquis) <= 2000),
  points_a_ameliorer text check (char_length(points_a_ameliorer) <= 2000),
  consulte_le timestamptz, -- l'apprenant a lu le retour (badge « Nouveau » tant que null)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (apprenant_id, objet, objet_id),
  check ((note is null) = (note_sur is null)),
  check (note_sur is null or (note_sur > 0 and note_sur <= 100 and note >= 0 and note <= note_sur))
);

create index retours_formateur_formateur_id_idx on public.retours_formateur (formateur_id);

alter table public.retours_formateur enable row level security;

-- L'apprenant lit les retours qui lui sont destinés ; le formateur, ceux des membres de ses groupes.
create policy "retours_formateur_select" on public.retours_formateur for select to authenticated
  using (apprenant_id = (select auth.uid()) or public.est_formateur_de(apprenant_id));

revoke all on public.retours_formateur from anon;
revoke all on public.retours_formateur from authenticated;
grant select on public.retours_formateur to authenticated;

-- Écrit (ou met à jour) le retour sur un travail existant d'un apprenant de ses groupes.
create function public.enregistrer_retour(
  p_apprenant uuid,
  p_objet text,
  p_objet_id text,
  p_note numeric,
  p_note_sur numeric,
  p_appreciation text,
  p_points_acquis text,
  p_points_a_ameliorer text,
  p_statut text
)
returns public.retours_formateur
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.retours_formateur;
begin
  if not public.est_formateur_de(p_apprenant) then
    raise exception 'Accès réservé au formateur de cet apprenant' using errcode = '42501';
  end if;
  if coalesce(p_statut, '') not in ('corrige', 'a_refaire') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;
  if not (
    (p_objet = 'travail_recherche' and exists (select 1 from public.travaux_recherche t where t.user_id = p_apprenant and t.exercice = p_objet_id))
    or (p_objet = 'analyse_pertinence' and exists (select 1 from public.analyses_pertinence a where a.user_id = p_apprenant and a.article_id = p_objet_id))
  ) then
    raise exception 'Travail introuvable' using errcode = 'P0002';
  end if;
  if p_statut = 'a_refaire' and coalesce(btrim(p_appreciation), '') = '' and coalesce(btrim(p_points_a_ameliorer), '') = '' then
    raise exception 'Explique ce qu''il faut reprendre' using errcode = '22023';
  end if;
  if (p_note is null) <> (p_note_sur is null) or (p_note_sur is not null and (p_note_sur <= 0 or p_note_sur > 100 or p_note < 0 or p_note > p_note_sur)) then
    raise exception 'Note invalide' using errcode = '22023';
  end if;

  insert into public.retours_formateur (apprenant_id, formateur_id, objet, objet_id, statut, note, note_sur, appreciation, points_acquis, points_a_ameliorer)
  values (
    p_apprenant, auth.uid(), p_objet, p_objet_id, p_statut, p_note, p_note_sur,
    nullif(btrim(p_appreciation), ''), nullif(btrim(p_points_acquis), ''), nullif(btrim(p_points_a_ameliorer), '')
  )
  on conflict (apprenant_id, objet, objet_id) do update
    set formateur_id = excluded.formateur_id,
        statut = excluded.statut,
        note = excluded.note,
        note_sur = excluded.note_sur,
        appreciation = excluded.appreciation,
        points_acquis = excluded.points_acquis,
        points_a_ameliorer = excluded.points_a_ameliorer,
        consulte_le = null,
        updated_at = now()
  returning * into r;
  return r;
end;
$$;

-- L'apprenant a ouvert le retour.
create function public.marquer_retour_consulte(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.retours_formateur
  set consulte_le = now()
  where id = p_id and apprenant_id = auth.uid() and consulte_le is null;
$$;

revoke execute on function
  public.corriger_soumission_detaillee(uuid, numeric, text, text, text, text),
  public.enregistrer_retour(uuid, text, text, numeric, numeric, text, text, text, text),
  public.marquer_retour_consulte(uuid)
from public, anon;
grant execute on function
  public.corriger_soumission_detaillee(uuid, numeric, text, text, text, text),
  public.enregistrer_retour(uuid, text, text, numeric, numeric, text, text, text, text),
  public.marquer_retour_consulte(uuid)
to authenticated;
