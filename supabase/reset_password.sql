-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- Update the user's password and confirm email
update auth.users
set 
  encrypted_password = crypt('Passkall22!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now(),
  raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{full_name}', 
    '"Cengiz Korkmaz"'
  )
where email = 'ccengizkorkmaz@gmail.com';
