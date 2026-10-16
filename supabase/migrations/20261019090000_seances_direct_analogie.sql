-- Analogie de la cuisine (diapositive « Comment fonctionne un système d'IA ? ») : affichée ou non
-- par le formateur et synchronisée chez les apprenants. Retirée quand la diapositive change.

alter table public.seances_direct add column analogie_visible boolean not null default false;

grant update (analogie_visible) on public.seances_direct to authenticated;

create or replace function public.seances_direct_avant_ecriture()
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
    new.analogie_visible := false;
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
    if new.analogie_visible is not distinct from old.analogie_visible then
      new.analogie_visible := false;
    end if;
  end if;
  if new.statut = 'terminee' then
    new.fin_le := now();
    new.question_diapo := null;
    new.question_texte := null;
    new.analogie_visible := false;
  end if;
  return new;
end;
$$;
