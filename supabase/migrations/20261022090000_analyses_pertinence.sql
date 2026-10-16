-- Exercice « Évaluer la pertinence d'un article » : une analyse par participant et par article.
-- Mode « corrige » (articles d'exemple annotés) : la première analyse notée crée UNE tentative
-- (catégorie selection-evaluation, note sur 10) ; les tentatives suivantes mettent l'analyse à jour
-- sans créer de nouvelle tentative. Mode « mon-sujet » : analyse non notée, aucune tentative.
-- Migration additive. Retour arrière :
--   drop function public.enregistrer_analyse_pertinence(text, text, text, jsonb, jsonb, integer);
--   drop table public.analyses_pertinence;

create table public.analyses_pertinence (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  article_id text not null check (char_length(article_id) between 1 and 250),
  mode text not null check (mode in ('corrige', 'mon-sujet')),
  sujet text not null check (char_length(sujet) <= 500),
  article jsonb check (article is null or (jsonb_typeof(article) = 'object' and pg_column_size(article) <= 20000)),
  contenu jsonb not null check (jsonb_typeof(contenu) = 'object' and pg_column_size(contenu) <= 30000), -- réponses du participant
  score integer check (score between 0 and 100),               -- dernière analyse (sur 100)
  premier_score integer check (premier_score between 0 and 100), -- score enregistré dans la progression
  tentative_id uuid references public.tentatives (id) on delete set null,
  nb_analyses integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id),
  check ((mode = 'corrige') = (score is not null))
);

alter table public.analyses_pertinence enable row level security;

-- Données personnelles : lecture par le participant seul ; écriture uniquement via la fonction ci-dessous.
create policy "analyses_pertinence_select" on public.analyses_pertinence for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.analyses_pertinence from anon;
revoke all on public.analyses_pertinence from authenticated;
grant select on public.analyses_pertinence to authenticated;

create function public.enregistrer_analyse_pertinence(
  p_article text,
  p_mode text,
  p_sujet text,
  p_article_info jsonb,
  p_analyse jsonb,
  p_score integer
)
returns public.analyses_pertinence
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ligne public.analyses_pertinence;
  v_tentative uuid;
begin
  if v_uid is null then
    raise exception 'Connexion requise' using errcode = '42501';
  end if;
  if p_mode = 'corrige' and (p_article !~ '^[a-z0-9-]{1,40}$' or p_score is null or p_score not between 0 and 100) then
    raise exception 'Analyse corrigée invalide' using errcode = '22023';
  end if;
  if p_mode = 'mon-sujet' and p_score is not null then
    raise exception 'Le mode « mon sujet » n''est pas noté' using errcode = '22023';
  end if;

  insert into public.analyses_pertinence (user_id, article_id, mode, sujet, article, contenu, score)
  values (v_uid, p_article, p_mode, coalesce(p_sujet, ''), p_article_info, coalesce(p_analyse, '{}'::jsonb), p_score)
  on conflict (user_id, article_id) do update
    set mode = excluded.mode,
        sujet = excluded.sujet,
        article = excluded.article,
        contenu = excluded.contenu,
        score = excluded.score,
        nb_analyses = public.analyses_pertinence.nb_analyses + 1,
        updated_at = now()
  returning * into v_ligne;

  -- Une seule tentative par article : la première analyse notée.
  if p_mode = 'corrige' and v_ligne.tentative_id is null and v_ligne.premier_score is null then
    insert into public.tentatives (user_id, cours, type, categorie, niveau, score, total)
    values (v_uid, 'comprendre-ia', 'exercice', 'selection-evaluation', 'intermediaire', round(p_score / 10.0)::integer, 10)
    returning id into v_tentative;
    insert into public.reponses (tentative_id, question_id, correcte, reponse_donnee)
    values (v_tentative, 'pertinence:' || p_article, p_score >= 70, left(p_score || '/100 · ' || coalesce(p_analyse ->> 'jugement', ''), 2000));
    update public.analyses_pertinence
    set tentative_id = v_tentative, premier_score = p_score
    where user_id = v_uid and article_id = p_article
    returning * into v_ligne;
  end if;

  return v_ligne;
end;
$$;

revoke execute on function public.enregistrer_analyse_pertinence(text, text, text, jsonb, jsonb, integer) from public, anon;
grant execute on function public.enregistrer_analyse_pertinence(text, text, text, jsonb, jsonb, integer) to authenticated;
