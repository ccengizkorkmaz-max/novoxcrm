alter table payment_plans add column sale_id uuid references sales(id) on delete cascade;
