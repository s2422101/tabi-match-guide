create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_area text not null default 'all'
    check (preferred_area in ('all', 'Asakusa', 'Ueno')),
  preferred_features text[] not null default '{}'
    check (
      preferred_features <@ array[
        'credit_card',
        'non_smoking',
        'english_guide',
        'wifi',
        'takeout',
        'vegetarian',
        'vegan',
        'pork_free',
        'alcohol_free'
      ]::text[]
    ),
  preferred_sort text not null default 'match'
    check (preferred_sort in ('match', 'budget', 'distance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id text not null
    check (restaurant_id ~ '^[A-Za-z0-9_-]{1,128}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists user_favorites_restaurant_id_idx
  on public.user_favorites (restaurant_id);

create or replace function public.update_user_preferences_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_preferences_updated_at
  on public.user_preferences;
create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.update_user_preferences_updated_at();

alter table public.user_preferences enable row level security;
alter table public.user_favorites enable row level security;

revoke all on public.user_preferences from anon;
revoke all on public.user_favorites from anon;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.user_favorites to authenticated;

drop policy if exists "Users can read their preferences"
  on public.user_preferences;
create policy "Users can read their preferences"
  on public.user_preferences for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their preferences"
  on public.user_preferences;
create policy "Users can insert their preferences"
  on public.user_preferences for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their preferences"
  on public.user_preferences;
create policy "Users can update their preferences"
  on public.user_preferences for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their preferences"
  on public.user_preferences;
create policy "Users can delete their preferences"
  on public.user_preferences for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their favorites"
  on public.user_favorites;
create policy "Users can read their favorites"
  on public.user_favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their favorites"
  on public.user_favorites;
create policy "Users can insert their favorites"
  on public.user_favorites for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their favorites"
  on public.user_favorites;
create policy "Users can update their favorites"
  on public.user_favorites for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their favorites"
  on public.user_favorites;
create policy "Users can delete their favorites"
  on public.user_favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);
