-- Run once in the ShotTrack Supabase project's SQL Editor.
create table if not exists public.shottrack_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shottrack_backups enable row level security;

revoke all on table public.shottrack_backups from anon;
revoke all on table public.shottrack_backups from authenticated;
grant select, insert, update, delete on table public.shottrack_backups to authenticated;

drop policy if exists "Users can read their own ShotTrack backup" on public.shottrack_backups;
create policy "Users can read their own ShotTrack backup"
  on public.shottrack_backups for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own ShotTrack backup" on public.shottrack_backups;
create policy "Users can create their own ShotTrack backup"
  on public.shottrack_backups for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own ShotTrack backup" on public.shottrack_backups;
create policy "Users can update their own ShotTrack backup"
  on public.shottrack_backups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own ShotTrack backup" on public.shottrack_backups;
create policy "Users can delete their own ShotTrack backup"
  on public.shottrack_backups for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_shottrack_backup_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_shottrack_backup_updated_at on public.shottrack_backups;
create trigger set_shottrack_backup_updated_at
before update on public.shottrack_backups
for each row execute function public.set_shottrack_backup_updated_at();

revoke execute on function public.set_shottrack_backup_updated_at() from public, anon, authenticated;
