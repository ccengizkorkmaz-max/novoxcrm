-- Messaging Schema for Make Integration / AI Channel Agents

create table if not exists messaging_sessions (
    id uuid primary key default uuid_generate_v4(),
    tenant_id uuid references tenants(id) on delete cascade,
    channel text not null,
    external_user_id text not null,
    customer_id uuid references customers(id) on delete set null,
    sale_id uuid references sales(id) on delete set null,
    status text default 'active', -- active, in_progress, qualified, human_required, closed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists messaging_messages (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references messaging_sessions(id) on delete cascade,
    role text not null, -- 'user' or 'assistant'
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Settings
alter table messaging_sessions enable row level security;
alter table messaging_messages enable row level security;

-- Admin policies
create policy "Allow all admins to view messaging sessions" on messaging_sessions for all using (true);
create policy "Allow all admins to view messaging messages" on messaging_messages for all using (true);
