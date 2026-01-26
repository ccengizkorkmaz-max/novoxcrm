-- Sales Teams Table
create table if not exists sales_teams (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  name text not null,
  description text,
  region text,
  office_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team Members (Junction table for profiles <-> sales_teams)
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references sales_teams(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text default 'member', -- leader, member
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, profile_id)
);

-- Team Assignments to Projects
create table if not exists team_project_assignments (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references sales_teams(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, project_id)
);

-- Enable RLS
alter table sales_teams enable row level security;
alter table team_members enable row level security;
alter table team_project_assignments enable row level security;

-- Policies for sales_teams
drop policy if exists "Users can view teams in their tenant" on sales_teams;
create policy "Users can view teams in their tenant" on sales_teams
  for select using (
    tenant_id in (
      select p.tenant_id from profiles p where p.id = auth.uid()
    )
  );

drop policy if exists "Admins can manage teams" on sales_teams;
create policy "Admins can manage teams" on sales_teams
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() 
      and p.role in ('admin', 'manager', 'owner')
      and p.tenant_id = sales_teams.tenant_id
    )
  );

-- Policies for team_members
drop policy if exists "Users can view team members" on team_members;
create policy "Users can view team members" on team_members
  for select using (
    exists (
      select 1 from sales_teams s
      where s.id = team_members.team_id 
      and s.tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "Admins can manage team members" on team_members;
create policy "Admins can manage team members" on team_members
  for all using (
    exists (
      select 1 from sales_teams s
      where s.id = team_members.team_id 
      and s.tenant_id in (
        select p.tenant_id from profiles p 
        where p.id = auth.uid() 
        and p.role in ('admin', 'manager', 'owner')
      )
    )
  );

-- Policies for team_project_assignments
drop policy if exists "Users can view team assignments" on team_project_assignments;
create policy "Users can view team assignments" on team_project_assignments
  for select using (
    exists (
      select 1 from sales_teams s
      where s.id = team_project_assignments.team_id 
      and s.tenant_id in (select p.tenant_id from profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "Admins can manage team assignments" on team_project_assignments;
create policy "Admins can manage team assignments" on team_project_assignments
  for all using (
    exists (
      select 1 from sales_teams s
      where s.id = team_project_assignments.team_id 
      and s.tenant_id in (
        select p.tenant_id from profiles p 
        where p.id = auth.uid() 
        and p.role in ('admin', 'manager', 'owner')
      )
    )
  );
