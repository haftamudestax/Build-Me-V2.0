-- Row-level security for the profiles table.
-- Profiles are viewable by anyone authenticated (common for display-name/
-- avatar lookups elsewhere in the app), but only editable by their owner.
-- Tighten the select policy to owner-only if profiles should be private.

alter table profiles enable row level security;

create policy "Authenticated users can view any profile"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);
