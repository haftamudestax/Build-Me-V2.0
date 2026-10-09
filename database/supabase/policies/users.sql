-- Row-level security for the users table.
-- Users can view and update only their own row. No insert policy:
-- rows are created via a trigger on auth.users signup, not directly by clients.

alter table users enable row level security;

create policy "Users can view their own user row"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own user row"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from users where id = auth.uid()));
  
