-- Supabase accorde par défaut EXECUTE à authenticated : on le retire aux fonctions internes,
-- qui n'ont pas à être appelables via /rest/v1/rpc.
revoke execute on function
  public.handle_new_user(),
  public.verifier_formateur_du_groupe(uuid)
from authenticated;
