-- Row-level security for the projects table.
-- Only the owner can view, create, update, or delete their own projects.

alter table projects enable row level security;

create policy "Owners can view their own projects"
  on projects for select
  using (auth.uid() = owner_id);

create policy "Owners can create their own projects"
  on projects for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their own projects"
  on projects for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their own projects"
  on projects for delete
  using (auth.uid() = owner_id);
