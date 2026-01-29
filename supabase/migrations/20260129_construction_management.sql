-- Construction Stages Table
create table if not exists construction_stages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  weight numeric default 0,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Unit Construction Progress Table
create table if not exists unit_construction_progress (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references units(id) on delete cascade not null,
  stage_id uuid references construction_stages(id) on delete cascade not null,
  completion_percentage numeric default 0 check (completion_percentage >= 0 and completion_percentage <= 100),
  notes text,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table construction_stages enable row level security;
alter table unit_construction_progress enable row level security;

-- RLS Policies
-- Remove existing policies if they exist (to avoid errors on re-run)
drop policy if exists "Users can view stages for their projects" on construction_stages;
drop policy if exists "Users can modify stages for their projects" on construction_stages;
drop policy if exists "Users can view unit progress for their projects" on unit_construction_progress;
drop policy if exists "Users can modify unit progress for their projects" on unit_construction_progress;

create policy "Users can view stages for their projects"
  on construction_stages for select
  using (project_id in (select id from projects where tenant_id in (select tenant_id from profiles where id = auth.uid())));

create policy "Users can modify stages for their projects"
  on construction_stages for all
  using (project_id in (select id from projects where tenant_id in (select tenant_id from profiles where id = auth.uid())));

create policy "Users can view unit progress for their projects"
  on unit_construction_progress for select
  using (unit_id in (select id from units where project_id in (select id from projects where tenant_id in (select tenant_id from profiles where id = auth.uid()))));

create policy "Users can modify unit progress for their projects"
  on unit_construction_progress for all
  using (unit_id in (select id from units where project_id in (select id from projects where tenant_id in (select tenant_id from profiles where id = auth.uid()))));
