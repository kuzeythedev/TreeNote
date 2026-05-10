create table if not exists public.note_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pages jsonb not null default '[]'::jsonb,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  updated_at timestamptz not null default now()
);

alter table public.note_workspaces enable row level security;

drop policy if exists "Users can read their workspace" on public.note_workspaces;
create policy "Users can read their workspace"
on public.note_workspaces
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their workspace" on public.note_workspaces;
create policy "Users can insert their workspace"
on public.note_workspaces
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their workspace" on public.note_workspaces;
create policy "Users can update their workspace"
on public.note_workspaces
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_note_workspace_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists note_workspaces_set_updated_at on public.note_workspaces;
create trigger note_workspaces_set_updated_at
before update on public.note_workspaces
for each row
execute function public.set_note_workspace_updated_at();
