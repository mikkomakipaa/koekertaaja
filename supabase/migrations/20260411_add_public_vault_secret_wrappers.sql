create or replace function public.create_vault_secret(
  secret_value text,
  secret_name text,
  secret_description text default ''
)
returns uuid
language sql
security definer
set search_path = public, vault
as $$
  select vault.create_secret(secret_value, secret_name, secret_description);
$$;

create or replace function public.delete_vault_secret(secret_id uuid)
returns void
language sql
security definer
set search_path = public, vault
as $$
  delete from vault.secrets where id = secret_id;
$$;

create or replace function public.get_vault_secret(secret_id uuid)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where id = secret_id;
$$;

grant execute on function public.create_vault_secret(text, text, text) to authenticated, service_role;
grant execute on function public.delete_vault_secret(uuid) to authenticated, service_role;
grant execute on function public.get_vault_secret(uuid) to authenticated, service_role;
