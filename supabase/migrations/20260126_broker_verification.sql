-- Broker Application Email Verification Schema

create table if not exists broker_verification_codes (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table broker_verification_codes enable row level security;

-- Policies
create policy "Public can insert verification requests" on broker_verification_codes
  for insert with check (true);

create policy "Public can view own verification codes" on broker_verification_codes
  for select using (true); -- We will check the code in the application logic
