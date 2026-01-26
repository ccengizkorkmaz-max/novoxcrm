-- ==========================================
-- 🛠️ ONBOARDING İÇİN TETİKLEYİCİ GÜNCELLEMESİ
-- ==========================================
-- Amacı: Yeni kullanıcı kaydında 'role' bilgisini metadata'dan okuyabilmek.
-- Böylece onboarding sırasında 'owner' olarak kullanıcı açabiliriz.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_tid uuid;
  v_role text;
BEGIN
  -- 1. Tenant ID'yi metadata'dan al, yoksa rastgele bir tane ata (güvenlik ağı)
  v_tid := (new.raw_user_meta_data->>'tenant_id')::uuid;
  IF v_tid IS NULL THEN SELECT id INTO v_tid FROM public.tenants LIMIT 1; END IF;

  -- 2. Rolü metadata'dan al, yoksa 'user' yap
  v_role := new.raw_user_meta_data->>'role';
  IF v_role IS NULL THEN v_role := 'user'; END IF;

  -- 3. Profili oluştur
  INSERT INTO public.profiles (id, tenant_id, full_name, role, email)
  VALUES (
    new.id, 
    v_tid, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    v_role, 
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
