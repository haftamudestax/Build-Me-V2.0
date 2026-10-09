-- Row-level security for the visitor-analytics tables (visitors, sessions,
-- events, leads, bookings, feedback, audit_results).
--
-- These tables track ANONYMOUS visitors, not authenticated users, so the
-- access pattern is different from the user-owned tables: writes are
-- generally open (any visitor can generate their own tracking data via
-- the anon key), while reads are restricted to admins only. If writes
-- should instead go through a trusted server using the service role key
-- (bypassing RLS entirely), skip the insert policies below and enforce
-- that at the API layer instead — that's the safer default if you're not
-- fully confident in client-side visitor_id spoofing protections.

alter table visitors enable row level security;
alter table sessions enable row level security;
alter table events enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;
alter table feedback enable row level security;
alter table audit_results enable row level security;

create policy "Anyone can create a visitor record"
  on visitors for insert
  with check (true);

create policy "Admins can view all visitors"
  on visitors for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- sessions
create policy "Anyone can create a session"
  on sessions for insert
  with check (true);

create policy "Anyone can update their own session (e.g. set ended_at)"
  on sessions for update
  using (true); -- tighten this if you introduce a visitor auth token later

create policy "Admins can view all sessions"
  on sessions for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- events
create policy "Anyone can log an event"
  on events for insert
  with check (true);

create policy "Admins can view all events"
  on events for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- leads
create policy "Anyone can submit a lead"
  on leads for insert
  with check (true);

create policy "Admins can view and manage all leads"
  on leads for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

create policy "Admins can update leads"
  on leads for update
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- bookings
create policy "Anyone can create a booking"
  on bookings for insert
  with check (true);

create policy "Admins can view all bookings"
  on bookings for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- feedback
create policy "Anyone can submit feedback"
  on feedback for insert
  with check (true);

create policy "Admins can view all feedback"
  on feedback for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

-- audit_results: system-generated only, no public insert policy at all —
-- these should be written by a trusted backend job using the service role
-- key, which bypasses RLS, not by anonymous clients.
create policy "Admins can view all audit results"
  on audit_results for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
