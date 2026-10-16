-- ═══════════════════════════════════════════════════════════════════════════════
-- Test d'isolation RLS entre apprenants — reproductible, SANS EFFET DURABLE.
--
-- Tout se déroule dans une transaction terminée par ROLLBACK : comptes de test,
-- groupe, travaux marqués TEST_ISOLATION_A / TEST_ISOLATION_B disparaissent.
--
-- Méthode : chaque identité est simulée comme le fait l'API Supabase (PostgREST) :
--   SET LOCAL ROLE authenticated | anon  +  request.jwt.claims = {"sub": <uuid>, ...}
-- La RLS et les droits s'appliquent donc exactement comme pour une requête HTTP.
-- Aucune clé service_role, aucune désactivation de RLS. Seule la vérification de
-- signature du JWT (faite par Supabase avant PostgreSQL) n'est pas couverte ici :
-- voir scripts/test-isolation-http.mjs pour le test avec de vraies sessions.
--
-- Exécution : SQL Editor de Supabase (ou psql). Le résultat est la dernière requête.
-- ═══════════════════════════════════════════════════════════════════════════════
begin;

-- ───────── Identités de test ─────────
-- A, B : apprenants du même groupe ; F : formateur du groupe ; F2 : formateur sans lien.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-isolation-a@test.invalid', '{"nom_complet":"TEST_ISOLATION_A"}', now(), now()),
  ('00000000-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-isolation-b@test.invalid', '{"nom_complet":"TEST_ISOLATION_B"}', now(), now()),
  ('00000000-0000-4000-8000-00000000000f', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-isolation-f@test.invalid', '{"nom_complet":"TEST_ISOLATION_F"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-isolation-f2@test.invalid', '{"nom_complet":"TEST_ISOLATION_F2"}', now(), now());
-- Le rôle formateur ne s'obtient que par un administrateur (comme en production).
update public.profiles set role = 'formateur' where id in ('00000000-0000-4000-8000-00000000000f', '00000000-0000-4000-8000-0000000000f2');

-- ───────── Outils du test ─────────
create temp table res (n serial, tbl text, op text, ident text, attendu text, obtenu text, verdict text, preuve text) on commit drop;
grant all on res to authenticated, anon;
grant usage on sequence res_n_seq to authenticated, anon;

-- Lecture : p_sql renvoie un nombre de lignes. attendu_vide = true → 0 ligne (ou refus de permission).
create function pg_temp.lecture(p_tbl text, p_op text, p_ident text, p_sql text, p_attendu_vide boolean) returns void language plpgsql as $$
declare v bigint;
begin
  execute p_sql into v;
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident,
    case when p_attendu_vide then '0 ligne' else '≥ 1 ligne' end, v || ' ligne(s)',
    case when (p_attendu_vide and v = 0) or (not p_attendu_vide and v > 0) then 'PASS' else 'FAIL' end,
    'requête acceptée, résultat filtré par la RLS');
exception when others then
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident,
    case when p_attendu_vide then '0 ligne ou refus' else '≥ 1 ligne' end, 'refusé',
    case when p_attendu_vide and sqlstate = '42501' then 'PASS' else 'FAIL' end, sqlstate || ' ' || sqlerrm);
end $$;

-- Écriture interdite : PASS si refus, ou si aucune ligne n'est affectée (filtrage RLS).
create function pg_temp.ecriture(p_tbl text, p_op text, p_ident text, p_sql text) returns void language plpgsql as $$
declare v bigint;
begin
  execute p_sql;
  get diagnostics v = row_count;
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident, 'refus ou 0 ligne', v || ' ligne(s) affectée(s)',
    case when v = 0 then 'PASS' else 'FAIL' end, 'aucune erreur : la RLS ne laisse voir aucune ligne cible');
exception when others then
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident, 'refus ou 0 ligne', 'refusé', 'PASS', sqlstate || ' ' || sqlerrm);
end $$;

-- Appel de fonction interdit : PASS si refus.
--   p_lecture = true  (fonction qui renvoie des données) : sans erreur, PASS seulement si 0 ligne renvoyée ;
--   p_lecture = false (fonction qui écrit) : sans erreur, verdict donné par le contrôle d'intégrité final.
create function pg_temp.appel(p_tbl text, p_op text, p_ident text, p_sql text, p_lecture boolean default false) returns void language plpgsql as $$
declare v bigint;
begin
  if p_lecture then
    execute format('select count(*) from (%s) x', p_sql) into v;
    insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident, 'refus ou 0 ligne', v || ' ligne(s) renvoyée(s)',
      case when v = 0 then 'PASS' else 'FAIL' end, 'exécuté sans erreur');
    return;
  end if;
  execute p_sql;
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident, 'refus ou aucun effet', 'exécuté sans erreur', 'INTÉGRITÉ', 'à confirmer par le contrôle d''intégrité des données de B');
exception when others then
  insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve) values (p_tbl, p_op, p_ident, 'refus ou aucun effet', 'refusé', 'PASS', sqlstate || ' ' || sqlerrm);
end $$;

-- Empreinte de toutes les données d'un utilisateur (calculée sans RLS, en administrateur).
create function pg_temp.empreinte(u uuid) returns text language sql as $$
  select md5(concat_ws('|',
    (select json_agg(t order by t.id)::text from public.profiles t where t.id = u),
    (select json_agg(t)::text from public.profils_chercheur t where t.user_id = u),
    (select json_agg(t order by t.exercice)::text from public.travaux_recherche t where t.user_id = u),
    (select json_agg(t order by t.article_id)::text from public.analyses_pertinence t where t.user_id = u),
    (select json_agg(t order by t.id)::text from public.tentatives t where t.user_id = u),
    (select json_agg(r order by r.id)::text from public.reponses r join public.tentatives t on t.id = r.tentative_id where t.user_id = u),
    (select json_agg(t order by t.id)::text from public.soumissions t where t.apprenant_id = u),
    (select json_agg(t order by t.id)::text from public.retours_formateur t where t.apprenant_id = u),
    (select json_agg(t)::text from public.accueil_participant t where t.user_id = u),
    (select json_agg(t order by t.id)::text from public.reactions_seance t where t.apprenant_id = u),
    (select json_agg(t order by t.groupe_id)::text from public.membres_groupe t where t.apprenant_id = u)
  ));
$$;
-- (Les fonctions sont exécutables par tous par défaut ; elles s'exécutent avec les droits de l'appelant.)

-- ───────── Données de test, créées par chaque utilisateur avec ses propres droits ─────────
set local role authenticated;

-- F crée le groupe et une séance en direct.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
insert into public.groupes (nom) values ('TEST_ISOLATION_GROUPE');
select set_config('t.groupe', (select id::text from public.groupes where nom = 'TEST_ISOLATION_GROUPE'), true);
select set_config('t.code', (select code_invitation from public.groupes where nom = 'TEST_ISOLATION_GROUPE'), true);
insert into public.seances_direct (groupe_id) values (current_setting('t.groupe')::uuid);
select set_config('t.seance', (select id::text from public.seances_direct where groupe_id = current_setting('t.groupe')::uuid), true);

-- A puis B : rejoignent le groupe avec le code et créent leurs données.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
select public.rejoindre_groupe(current_setting('t.code'));
insert into public.profils_chercheur (discipline, niveau_etudes, sujet, objectif) values ('TEST', 'master', 'TEST_ISOLATION_A sujet', 'TEST_ISOLATION_A objectif');
insert into public.travaux_recherche (exercice, sujet, contenu, termine) values ('prompt', 'TEST_ISOLATION_A', '{"marqueur":"TEST_ISOLATION_A"}', true);
select public.enregistrer_tentatives('[{"cours":"comprendre-ia","type":"qcm","categorie":"fondements","niveau":"debutant","score":1,"total":1,"reponses":[{"question_id":"f1","correcte":true,"reponse_donnee":"TEST_ISOLATION_A"}]}]');
select public.enregistrer_analyse_pertinence('logi-abidjan', 'corrige', 'TEST_ISOLATION_A', null, '{"justification":"TEST_ISOLATION_A"}', 40);
select public.enregistrer_accueil(p_etape => 'site');
insert into public.soumissions (exercice_id, groupe_id, contenu) values ('ar1', current_setting('t.groupe')::uuid, 'TEST_ISOLATION_A copie');
insert into public.reactions_seance (seance_id, diapo, type) values (current_setting('t.seance')::uuid, 0, 'pas_compris');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
select public.rejoindre_groupe(current_setting('t.code'));
insert into public.profils_chercheur (discipline, niveau_etudes, sujet, objectif) values ('TEST', 'doctorat', 'TEST_ISOLATION_B sujet', 'TEST_ISOLATION_B objectif');
insert into public.travaux_recherche (exercice, sujet, contenu, termine) values ('prompt', 'TEST_ISOLATION_B', '{"marqueur":"TEST_ISOLATION_B"}', true);
select public.enregistrer_tentatives('[{"cours":"comprendre-ia","type":"qcm","categorie":"fondements","niveau":"debutant","score":0,"total":1,"reponses":[{"question_id":"f2","correcte":false,"reponse_donnee":"TEST_ISOLATION_B"}]}]');
select public.enregistrer_analyse_pertinence('banque-ci', 'corrige', 'TEST_ISOLATION_B', null, '{"justification":"TEST_ISOLATION_B"}', 90);
select public.enregistrer_accueil(p_etape => 'programme');
insert into public.soumissions (exercice_id, groupe_id, contenu) values ('ar1', current_setting('t.groupe')::uuid, 'TEST_ISOLATION_B copie');
insert into public.reactions_seance (seance_id, diapo, type) values (current_setting('t.seance')::uuid, 0, 'pas_compris');

-- F corrige les deux copies et laisse un retour à chacun.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
select public.corriger_soumission_detaillee(s.id, 6, p.nom_complet, 'corrige', 'acquis', 'à améliorer')
  from public.soumissions s join public.profiles p on p.id = s.apprenant_id where s.groupe_id = current_setting('t.groupe')::uuid;
select public.enregistrer_retour('00000000-0000-4000-8000-00000000000a', 'travail_recherche', 'prompt', 15, 20, 'TEST_ISOLATION_A retour', null, null, 'corrige');
select public.enregistrer_retour('00000000-0000-4000-8000-00000000000b', 'travail_recherche', 'prompt', 12, 20, 'TEST_ISOLATION_B retour', null, null, 'corrige');

-- Identifiants des lignes de B, supposés connus de l'attaquant A.
reset role;
select set_config('t.b_tentative', (select t.id::text from public.tentatives t join public.reponses r on r.tentative_id = t.id where t.user_id = '00000000-0000-4000-8000-00000000000b' and r.reponse_donnee = 'TEST_ISOLATION_B'), true);
select set_config('t.b_copie', (select id::text from public.soumissions where apprenant_id = '00000000-0000-4000-8000-00000000000b'), true);
select set_config('t.b_retour', (select id::text from public.retours_formateur where apprenant_id = '00000000-0000-4000-8000-00000000000b'), true);
select set_config('t.b_reaction', (select id::text from public.reactions_seance where apprenant_id = '00000000-0000-4000-8000-00000000000b'), true);
select set_config('t.empreinte_b', pg_temp.empreinte('00000000-0000-4000-8000-00000000000b'), true);
select set_config('t.empreinte_a', pg_temp.empreinte('00000000-0000-4000-8000-00000000000a'), true);
select set_config('t.nb_tentatives_b', (select count(*)::text from public.tentatives where user_id = '00000000-0000-4000-8000-00000000000b'), true);

-- ───────── 1. A tente de LIRE les données de B (requêtes directes, identifiants connus) ─────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
declare
  b constant text := '''00000000-0000-4000-8000-00000000000b''';
  a constant text := '''00000000-0000-4000-8000-00000000000a''';
  t record;
begin
  for t in select * from (values
    ('profiles', 'id'), ('profils_chercheur', 'user_id'), ('travaux_recherche', 'user_id'), ('analyses_pertinence', 'user_id'),
    ('tentatives', 'user_id'), ('soumissions', 'apprenant_id'), ('retours_formateur', 'apprenant_id'),
    ('accueil_participant', 'user_id'), ('reactions_seance', 'apprenant_id'), ('membres_groupe', 'apprenant_id')
  ) as v(tbl, col) loop
    perform pg_temp.lecture(t.tbl, 'SELECT lignes de B (filtre sur son identifiant)', 'Apprenant A', format('select count(*) from public.%I where %I = %s', t.tbl, t.col, b), true);
    perform pg_temp.lecture(t.tbl, 'SELECT ses propres lignes', 'Apprenant A', format('select count(*) from public.%I where %I = %s', t.tbl, t.col, a), false);
  end loop;
  perform pg_temp.lecture('reponses', 'SELECT réponses de la tentative de B (id connu)', 'Apprenant A', format('select count(*) from public.reponses where tentative_id = %L', current_setting('t.b_tentative')), true);
  perform pg_temp.lecture('soumissions', 'SELECT copie de B par son id', 'Apprenant A', format('select count(*) from public.soumissions where id = %L', current_setting('t.b_copie')), true);
  perform pg_temp.lecture('retours_formateur', 'SELECT retour de B par son id', 'Apprenant A', format('select count(*) from public.retours_formateur where id = %L', current_setting('t.b_retour')), true);
  perform pg_temp.lecture('(toutes tables)', 'Recherche du marqueur TEST_ISOLATION_B', 'Apprenant A',
    'select (select count(*) from public.profils_chercheur where sujet like ''TEST_ISOLATION_B%'') + (select count(*) from public.travaux_recherche where sujet like ''TEST_ISOLATION_B%'') + (select count(*) from public.soumissions where contenu like ''TEST_ISOLATION_B%'') + (select count(*) from public.retours_formateur where appreciation like ''TEST_ISOLATION_B%'') + (select count(*) from public.analyses_pertinence where sujet like ''TEST_ISOLATION_B%'') + (select count(*) from public.reponses where reponse_donnee like ''TEST_ISOLATION_B%'')', true);
  perform pg_temp.appel('progression_apprenant()', 'RPC progression_apprenant(p_apprenant = B)', 'Apprenant A', 'select * from public.progression_apprenant(''00000000-0000-4000-8000-00000000000b'')', true);
  perform pg_temp.lecture('progression_apprenant()', 'RPC progression_apprenant() : ses seuls résultats (= ses propres tentatives)', 'Apprenant A',
    'select case when (select sum(nb_tentatives) from public.progression_apprenant() where dimension = ''niveau'') = (select count(*) from public.tentatives where user_id = auth.uid() and niveau is not null) then 0 else 1 end', true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC resultats_apprenants(groupe)', 'Apprenant A', format('select * from public.resultats_apprenants(%L)', current_setting('t.groupe')), true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC tentatives_groupe(groupe)', 'Apprenant A', format('select * from public.tentatives_groupe(%L)', current_setting('t.groupe')), true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC activite_membres(groupe)', 'Apprenant A', format('select * from public.activite_membres(%L)', current_setting('t.groupe')), true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC suivi_devoirs(groupe)', 'Apprenant A', format('select * from public.suivi_devoirs(%L)', current_setting('t.groupe')), true);
end $$;

-- ───────── 2. A tente de MODIFIER, INSÉRER ou SUPPRIMER au nom de B ─────────
do $$
declare b constant text := '''00000000-0000-4000-8000-00000000000b''';
begin
  perform pg_temp.ecriture('profiles', 'UPDATE nom de B', 'Apprenant A', format('update public.profiles set nom_complet = ''PIRATE'' where id = %s', b));
  perform pg_temp.ecriture('profils_chercheur', 'UPDATE sujet de recherche de B', 'Apprenant A', format('update public.profils_chercheur set sujet = ''PIRATE'' where user_id = %s', b));
  perform pg_temp.ecriture('travaux_recherche', 'UPDATE exercice personnalisé de B', 'Apprenant A', format('update public.travaux_recherche set contenu = ''{}'' where user_id = %s', b));
  perform pg_temp.ecriture('tentatives', 'UPDATE score de B', 'Apprenant A', format('update public.tentatives set score = 1 where user_id = %s', b));
  perform pg_temp.ecriture('reponses', 'UPDATE réponse de B', 'Apprenant A', format('update public.reponses set correcte = true where tentative_id = %L', current_setting('t.b_tentative')));
  perform pg_temp.ecriture('soumissions', 'UPDATE contenu de la copie de B', 'Apprenant A', format('update public.soumissions set contenu = ''PIRATE'' where id = %L', current_setting('t.b_copie')));
  perform pg_temp.ecriture('soumissions', 'UPDATE note / commentaire de B', 'Apprenant A', format('update public.soumissions set note = 0, commentaire = ''PIRATE'' where id = %L', current_setting('t.b_copie')));
  perform pg_temp.ecriture('retours_formateur', 'UPDATE retour du formateur à B', 'Apprenant A', format('update public.retours_formateur set appreciation = ''PIRATE'' where id = %L', current_setting('t.b_retour')));
  perform pg_temp.ecriture('analyses_pertinence', 'UPDATE analyse de B', 'Apprenant A', format('update public.analyses_pertinence set score = 100 where user_id = %s', b));
  perform pg_temp.ecriture('accueil_participant', 'UPDATE parcours d''accueil de B', 'Apprenant A', format('update public.accueil_participant set etapes = ''{}'' where user_id = %s', b));
  perform pg_temp.ecriture('profils_chercheur', 'INSERT avec user_id = B', 'Apprenant A', format('insert into public.profils_chercheur (user_id, discipline, niveau_etudes, sujet, objectif) values (%s, ''X'', ''master'', ''PIRATE'', ''PIRATE'')', b));
  perform pg_temp.ecriture('travaux_recherche', 'INSERT avec user_id = B', 'Apprenant A', format('insert into public.travaux_recherche (user_id, exercice, sujet, contenu) values (%s, ''equation'', ''PIRATE'', ''{}'')', b));
  perform pg_temp.ecriture('tentatives', 'INSERT avec user_id = B', 'Apprenant A', format('insert into public.tentatives (user_id, type, score, total) values (%s, ''qcm'', 1, 1)', b));
  perform pg_temp.ecriture('reponses', 'INSERT dans la tentative de B', 'Apprenant A', format('insert into public.reponses (tentative_id, question_id, correcte) values (%L, ''f3'', true)', current_setting('t.b_tentative')));
  perform pg_temp.ecriture('soumissions', 'INSERT avec apprenant_id = B', 'Apprenant A', format('insert into public.soumissions (apprenant_id, exercice_id, groupe_id, contenu) values (%s, ''ar2'', %L, ''PIRATE'')', b, current_setting('t.groupe')));
  perform pg_temp.ecriture('reactions_seance', 'INSERT avec apprenant_id = B', 'Apprenant A', format('insert into public.reactions_seance (apprenant_id, seance_id, diapo, type, texte) values (%s, %L, 0, ''question'', ''PIRATE'')', b, current_setting('t.seance')));
  perform pg_temp.ecriture('profiles', 'DELETE profil de B', 'Apprenant A', format('delete from public.profiles where id = %s', b));
  perform pg_temp.ecriture('profils_chercheur', 'DELETE profil chercheur de B', 'Apprenant A', format('delete from public.profils_chercheur where user_id = %s', b));
  perform pg_temp.ecriture('travaux_recherche', 'DELETE travail de B', 'Apprenant A', format('delete from public.travaux_recherche where user_id = %s', b));
  perform pg_temp.ecriture('tentatives', 'DELETE tentatives de B', 'Apprenant A', format('delete from public.tentatives where user_id = %s', b));
  perform pg_temp.ecriture('soumissions', 'DELETE copie de B', 'Apprenant A', format('delete from public.soumissions where id = %L', current_setting('t.b_copie')));
  perform pg_temp.ecriture('retours_formateur', 'DELETE retour de B', 'Apprenant A', format('delete from public.retours_formateur where id = %L', current_setting('t.b_retour')));
  perform pg_temp.ecriture('reactions_seance', 'DELETE réaction de B', 'Apprenant A', format('delete from public.reactions_seance where id = %L', current_setting('t.b_reaction')));
  perform pg_temp.ecriture('membres_groupe', 'DELETE B du groupe', 'Apprenant A', format('delete from public.membres_groupe where apprenant_id = %s', b));
  -- Fonctions qui écrivent : aucune ne doit agir sur B.
  perform pg_temp.appel('retours_formateur', 'RPC marquer_retour_consulte(retour de B)', 'Apprenant A', format('select public.marquer_retour_consulte(%L)', current_setting('t.b_retour')));
  perform pg_temp.appel('soumissions', 'RPC marquer_copie_consultee(copie de B)', 'Apprenant A', format('select public.marquer_copie_consultee(%L)', current_setting('t.b_copie')));
  perform pg_temp.appel('soumissions', 'RPC corriger_soumission_detaillee(copie de B)', 'Apprenant A', format('select public.corriger_soumission_detaillee(%L, 0, ''PIRATE'', ''corrige'', null, null)', current_setting('t.b_copie')));
  perform pg_temp.appel('retours_formateur', 'RPC enregistrer_retour(apprenant = B)', 'Apprenant A', 'select public.enregistrer_retour(''00000000-0000-4000-8000-00000000000b'', ''travail_recherche'', ''prompt'', 0, 20, ''PIRATE'', null, null, ''corrige'')');
  perform pg_temp.appel('groupes', 'RPC regenerer_code_invitation(groupe)', 'Apprenant A', format('select public.regenerer_code_invitation(%L)', current_setting('t.groupe')));
end $$;

-- ───────── 3. Usurpation : identifiant de B glissé dans les données envoyées ─────────
-- enregistrer_tentatives reçoit un JSON du navigateur : on y ajoute "user_id": B.
select public.enregistrer_tentatives('[{"user_id":"00000000-0000-4000-8000-00000000000b","cours":"comprendre-ia","type":"qcm","categorie":"fondements","niveau":"debutant","score":1,"total":1,"reponses":[{"question_id":"f4","correcte":true,"reponse_donnee":"USURPATION"}]}]');
-- enregistrer_analyse_pertinence : contenu prétendant appartenir à B.
select public.enregistrer_analyse_pertinence('cadre-performance', 'corrige', 'USURPATION', '{"user_id":"00000000-0000-4000-8000-00000000000b"}', '{"user_id":"00000000-0000-4000-8000-00000000000b"}', 10);

-- Escalade de rôle par les métadonnées : ce que permet supabase.auth.updateUser({ data: { role: "formateur" } }).
reset role;
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"role":"formateur","is_admin":true}' where id = '00000000-0000-4000-8000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated","user_metadata":{"role":"formateur","is_admin":true}}', true);
do $$
begin
  perform pg_temp.lecture('profiles', 'Rôle applicatif après role=formateur dans ses métadonnées', 'Apprenant A (métadonnées modifiées)',
    'select count(*) from public.profiles where id = auth.uid() and role <> ''apprenant''', true);
  perform pg_temp.lecture('est_formateur()', 'est_formateur() après modification des métadonnées', 'Apprenant A (métadonnées modifiées)', 'select case when public.est_formateur() then 1 else 0 end', true);
  perform pg_temp.lecture('travaux_recherche', 'SELECT travaux de B après modification des métadonnées', 'Apprenant A (métadonnées modifiées)', 'select count(*) from public.travaux_recherche where user_id = ''00000000-0000-4000-8000-00000000000b''', true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC stats_groupe après modification des métadonnées', 'Apprenant A (métadonnées modifiées)', format('select * from public.stats_groupe(%L)', current_setting('t.groupe')), true);
  perform pg_temp.ecriture('profiles', 'UPDATE profiles.role = formateur', 'Apprenant A (métadonnées modifiées)', 'update public.profiles set role = ''formateur'' where id = auth.uid()');
  perform pg_temp.ecriture('groupes', 'INSERT d''un groupe (réservé aux formateurs)', 'Apprenant A (métadonnées modifiées)', 'insert into public.groupes (nom) values (''PIRATE'')');
end $$;

-- ───────── 4. B (même groupe) lit ses données et ne voit rien de A ─────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);
do $$
declare t record;
begin
  for t in select * from (values ('profils_chercheur', 'user_id'), ('travaux_recherche', 'user_id'), ('tentatives', 'user_id'), ('soumissions', 'apprenant_id'), ('retours_formateur', 'apprenant_id'), ('analyses_pertinence', 'user_id')) as v(tbl, col) loop
    perform pg_temp.lecture(t.tbl, 'SELECT ses propres lignes', 'Apprenant B', format('select count(*) from public.%I where %I = auth.uid()', t.tbl, t.col), false);
    perform pg_temp.lecture(t.tbl, 'SELECT lignes de A', 'Apprenant B', format('select count(*) from public.%I where %I = ''00000000-0000-4000-8000-00000000000a''', t.tbl, t.col), true);
  end loop;
  perform pg_temp.lecture('membres_groupe', 'SELECT autres membres du groupe', 'Apprenant B', 'select count(*) from public.membres_groupe where apprenant_id <> auth.uid()', true);
  perform pg_temp.lecture('progression_apprenant()', 'RPC progression_apprenant() : ses seuls résultats (= ses propres tentatives)', 'Apprenant B',
    'select case when (select sum(nb_tentatives) from public.progression_apprenant() where dimension = ''niveau'') = (select count(*) from public.tentatives where user_id = auth.uid() and niveau is not null) then 0 else 1 end', true);
  perform pg_temp.lecture('tentatives', 'Tentative usurpée (user_id = B dans le JSON) attribuée à B', 'Apprenant B', 'select count(*) from public.reponses where reponse_donnee = ''USURPATION''', true);
end $$;

-- ───────── 5. Formateurs ─────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000f","role":"authenticated"}', true);
do $$
declare t record;
begin
  for t in select * from (values ('profils_chercheur', 'user_id'), ('travaux_recherche', 'user_id'), ('tentatives', 'user_id'), ('soumissions', 'apprenant_id'), ('retours_formateur', 'apprenant_id'), ('analyses_pertinence', 'user_id')) as v(tbl, col) loop
    perform pg_temp.lecture(t.tbl, 'SELECT données de B (membre de son groupe)', 'Formateur F (autorisé)', format('select count(*) from public.%I where %I = ''00000000-0000-4000-8000-00000000000b''', t.tbl, t.col), false);
  end loop;
  perform pg_temp.lecture('membres réels', 'SELECT tentatives d''apprenants hors de ses groupes', 'Formateur F (autorisé)',
    'select count(*) from public.tentatives where user_id not in (''00000000-0000-4000-8000-00000000000a'', ''00000000-0000-4000-8000-00000000000b'')', true);
  perform pg_temp.lecture('profiles', 'SELECT profils hors de ses groupes', 'Formateur F (autorisé)',
    'select count(*) from public.profiles where id not in (auth.uid(), ''00000000-0000-4000-8000-00000000000a'', ''00000000-0000-4000-8000-00000000000b'')', true);
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f2","role":"authenticated"}', true);
do $$
declare t record;
begin
  for t in select * from (values ('profiles', 'id'), ('profils_chercheur', 'user_id'), ('travaux_recherche', 'user_id'), ('tentatives', 'user_id'), ('soumissions', 'apprenant_id'), ('retours_formateur', 'apprenant_id'), ('analyses_pertinence', 'user_id'), ('accueil_participant', 'user_id')) as v(tbl, col) loop
    perform pg_temp.lecture(t.tbl, 'SELECT données de B', 'Formateur F2 (non autorisé)', format('select count(*) from public.%I where %I = ''00000000-0000-4000-8000-00000000000b''', t.tbl, t.col), true);
  end loop;
  perform pg_temp.appel('progression_apprenant()', 'RPC progression_apprenant(B)', 'Formateur F2 (non autorisé)', 'select * from public.progression_apprenant(''00000000-0000-4000-8000-00000000000b'')', true);
  perform pg_temp.appel('stats / résultats du groupe', 'RPC resultats_apprenants(groupe de F)', 'Formateur F2 (non autorisé)', format('select * from public.resultats_apprenants(%L)', current_setting('t.groupe')), true);
  perform pg_temp.appel('retours_formateur', 'RPC enregistrer_retour(B)', 'Formateur F2 (non autorisé)', 'select public.enregistrer_retour(''00000000-0000-4000-8000-00000000000b'', ''travail_recherche'', ''prompt'', 0, 20, ''PIRATE'', null, null, ''corrige'')');
  perform pg_temp.appel('soumissions', 'RPC corriger_soumission_detaillee(copie de B)', 'Formateur F2 (non autorisé)', format('select public.corriger_soumission_detaillee(%L, 0, ''PIRATE'', ''corrige'', null, null)', current_setting('t.b_copie')));
end $$;
reset role;

-- ───────── 6. Utilisateur déconnecté (rôle anon) ─────────
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare t text;
begin
  foreach t in array array['profiles','groupes','membres_groupe','tentatives','reponses','devoirs','soumissions','seances_direct','reactions_seance','accueil_participant','profils_chercheur','travaux_recherche','analyses_pertinence','retours_formateur','exercices_a_rendre'] loop
    perform pg_temp.lecture(t, 'SELECT *', 'Déconnecté (anon)', format('select count(*) from public.%I', t), true);
  end loop;
  perform pg_temp.appel('progression_apprenant()', 'RPC progression_apprenant(B)', 'Déconnecté (anon)', 'select * from public.progression_apprenant(''00000000-0000-4000-8000-00000000000b'')', true);
  perform pg_temp.appel('rejoindre_groupe()', 'RPC rejoindre_groupe(code valide)', 'Déconnecté (anon)', format('select * from public.rejoindre_groupe(%L)', current_setting('t.code')));
end $$;
reset role;

-- ───────── 7. Contrôle d'intégrité (administrateur, après toutes les tentatives) ─────────
insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve)
select '(toutes tables)', 'Données de B identiques avant / après les attaques', 'Contrôle administrateur', 'empreinte inchangée',
  case when pg_temp.empreinte('00000000-0000-4000-8000-00000000000b') = current_setting('t.empreinte_b') then 'inchangée' else 'MODIFIÉE' end,
  case when pg_temp.empreinte('00000000-0000-4000-8000-00000000000b') = current_setting('t.empreinte_b') then 'PASS' else 'FAIL' end,
  'md5 de toutes les lignes de B : ' || current_setting('t.empreinte_b');
insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve)
select 'tentatives', 'Usurpation : tentative envoyée avec user_id = B', 'Contrôle administrateur', 'enregistrée au nom de A, B inchangé',
  (select string_agg(case when t.user_id = '00000000-0000-4000-8000-00000000000a' then 'au nom de A' else 'au nom de B' end, ',') from public.tentatives t join public.reponses r on r.tentative_id = t.id where r.reponse_donnee = 'USURPATION'),
  case when (select bool_and(t.user_id = '00000000-0000-4000-8000-00000000000a') from public.tentatives t join public.reponses r on r.tentative_id = t.id where r.reponse_donnee = 'USURPATION')
        and (select count(*) from public.tentatives where user_id = '00000000-0000-4000-8000-00000000000b')::text = current_setting('t.nb_tentatives_b') then 'PASS' else 'FAIL' end,
  'user_id fixé par auth.uid() dans enregistrer_tentatives';
insert into res (tbl, op, ident, attendu, obtenu, verdict, preuve)
select 'analyses_pertinence', 'Usurpation : analyse envoyée avec user_id = B dans le JSON', 'Contrôle administrateur', 'enregistrée au nom de A',
  (select string_agg(case when user_id = '00000000-0000-4000-8000-00000000000a' then 'au nom de A' else 'au nom de B' end, ',') from public.analyses_pertinence where sujet = 'USURPATION'),
  case when (select bool_and(user_id = '00000000-0000-4000-8000-00000000000a') from public.analyses_pertinence where sujet = 'USURPATION') then 'PASS' else 'FAIL' end,
  'user_id fixé par auth.uid() dans enregistrer_analyse_pertinence';
update res set verdict = case when pg_temp.empreinte('00000000-0000-4000-8000-00000000000b') = current_setting('t.empreinte_b') then 'PASS' else 'FAIL' end,
  preuve = 'exécuté sans erreur, sans effet : données de B inchangées (empreinte identique)'
where verdict = 'INTÉGRITÉ';

select n as "#", tbl as "Table / fonctionnalité", op as "Opération tentée", ident as "Identité", attendu as "Attendu", obtenu as "Obtenu", verdict as "Verdict", preuve as "Preuve"
from res order by n;

rollback;
