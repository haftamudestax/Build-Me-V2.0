alter table analytics_results enable row level security;
alter table product_kpis enable row level security;
alter table technology_kpis enable row level security;

create policy "Admins can view analytics results"
  on analytics_results for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

create policy "Admins can view product KPIs"
  on product_kpis for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));

create policy "Admins can view technology KPIs"
  on technology_kpis for select
  using (exists (select 1 from users where id = auth.uid() and role = 'admin'));
