-- Enable Realtime for the units table
alter publication supabase_realtime add table units;

-- Enable Realtime for unit_activity_log to show live timeline updates
alter publication supabase_realtime add table unit_activity_log;
