alter table offers 
add column if not exists sale_id uuid references sales(id) on delete cascade;
