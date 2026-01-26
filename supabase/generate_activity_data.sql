-- ==========================================
-- 📅 NOVO-CRM AKTİVİTE VERİSİ ÜRETİCİ
-- ==========================================
DO $$
DECLARE
    v_tenant_id uuid;
    v_admin_id uuid;
    v_sales_id uuid;
    v_cust_id uuid;
    v_i int;
    v_j int;
    v_types text[] := ARRAY['Call', 'Whatsapp', 'Meeting', 'Site Visit', 'Email'];
    v_statuses text[] := ARRAY['Planned', 'Completed', 'Cancelled'];
BEGIN
    -- Mevcut Bilgileri Al
    SELECT tenant_id, id INTO v_tenant_id, v_admin_id FROM public.profiles 
    WHERE role IN ('owner', 'admin') LIMIT 1;
    
    SELECT id INTO v_sales_id FROM public.profiles 
    WHERE role = 'user' OR role = 'sales' LIMIT 1;
    
    IF v_sales_id IS NULL THEN v_sales_id := v_admin_id; END IF;

    -- 50 Müşteri üzerinden aktiviteler üret
    FOR v_cust_id IN (SELECT id FROM public.customers WHERE tenant_id = v_tenant_id LIMIT 50) LOOP
        -- Her müşteri için 2-4 arası aktivite
        FOR v_j IN 1..(2 + (random() * 2)::int) LOOP
            INSERT INTO public.activities (
                tenant_id, 
                customer_id, 
                owner_id, 
                type, 
                status, 
                created_at,
                due_date,
                completed_at
            )
            VALUES (
                v_tenant_id,
                v_cust_id,
                CASE WHEN random() > 0.5 THEN v_admin_id ELSE v_sales_id END,
                v_types[(random() * 4)::int + 1],
                v_statuses[(random() * 2)::int + 1],
                CURRENT_DATE - (random() * 30 || ' days')::interval,
                CURRENT_DATE + (random() * 7 || ' days')::interval,
                CASE WHEN random() > 0.3 THEN CURRENT_DATE - (random() * 5 || ' days')::interval ELSE NULL END
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Aktivite verileri başarıyla oluşturuldu.';
END $$;
