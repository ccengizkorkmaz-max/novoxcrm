-- ==========================================
-- 📊 NOVO-CRM TEST VERİSİ ÜRETİCİ (v1.0)
-- ==========================================
-- Bu script mevcut tenant ve kullanıcıları kullanarak 
-- gerçekçi projeler, üniteler, müşteriler ve satışlar üretir.

DO $$
DECLARE
    v_tenant_id uuid;
    v_admin_id uuid;
    v_sales_id uuid;
    v_project_1 uuid;
    v_project_2 uuid;
    v_project_3 uuid;
    v_cust_id uuid;
    v_sale_id uuid;
    v_contract_id uuid;
    v_plan_id uuid;
    v_unit_id uuid;
    v_i int;
    v_j int;
    v_statuses text[] := ARRAY['Lead', 'Prospect', 'Reservation', 'Contract', 'Sold'];
    v_unit_statuses text[] := ARRAY['For Sale', 'Reserved', 'Sold'];
    v_sources text[] := ARRAY['Web Sitemiz', 'Instagram', 'Referans', 'Zingat', 'Sahibinden'];
BEGIN
    -- 1. Mevcut Bilgileri Al
    SELECT tenant_id, id INTO v_tenant_id, v_admin_id FROM public.profiles 
    WHERE role IN ('owner', 'admin') LIMIT 1;
    
    SELECT id INTO v_sales_id FROM public.profiles 
    WHERE role = 'user' OR role = 'sales' LIMIT 1;
    
    IF v_sales_id IS NULL THEN v_sales_id := v_admin_id; END IF;

    -- 2. Projeleri Ekle
    INSERT INTO public.projects (tenant_id, name, city, status) 
    VALUES (v_tenant_id, 'Azure Residence', 'İstanbul', 'Active') RETURNING id INTO v_project_1;
    
    INSERT INTO public.projects (tenant_id, name, city, status) 
    VALUES (v_tenant_id, 'Emerald Towers', 'Ankara', 'Active') RETURNING id INTO v_project_2;
    
    INSERT INTO public.projects (tenant_id, name, city, status) 
    VALUES (v_tenant_id, 'Sapphire Villas', 'Muğla', 'Active') RETURNING id INTO v_project_3;

    -- 3. Üniteleri Ekle (Her Proje İçin 10 Ünite)
    FOR v_i IN 1..10 LOOP
        -- Project 1 Units
        INSERT INTO public.units (project_id, unit_number, type, price, floor, status)
        VALUES (v_project_1, 'A-' || v_i, '2+1', 5000000 + (v_i * 100000), v_i % 5 + 1, 'For Sale')
        RETURNING id INTO v_unit_id;
        
        -- Project 2 Units
        INSERT INTO public.units (project_id, unit_number, type, price, floor, status)
        VALUES (v_project_2, 'B-' || v_i, '3+1', 7500000 + (v_i * 150000), v_i % 8 + 1, 'For Sale');
        
        -- Project 3 Units
        INSERT INTO public.units (project_id, unit_number, type, price, floor, status)
        VALUES (v_project_3, 'Villa-' || v_i, '4+1', 15000000 + (v_i * 500000), 1, 'For Sale');
    END LOOP;

    -- 4. Müşteriler ve Satışlar Ekle (30 Müşteri)
    FOR v_i IN 1..30 LOOP
        INSERT INTO public.customers (tenant_id, full_name, email, phone, source)
        VALUES (
            v_tenant_id, 
            'Müşteri ' || v_i, 
            'musteri' || v_i || '@example.com', 
            '555000' || LPAD(v_i::text, 4, '0'),
            v_sources[(v_i % 5) + 1]
        ) RETURNING id INTO v_cust_id;

        -- Her müşteriye bir satış/lead kaydı
        -- Rastgele bir üniteden ID alalım
        SELECT id INTO v_unit_id FROM public.units WHERE project_id IN (v_project_1, v_project_2, v_project_3) ORDER BY random() LIMIT 1;
        
        INSERT INTO public.sales (tenant_id, customer_id, unit_id, assigned_to, status, final_price)
        VALUES (
            v_tenant_id, 
            v_cust_id, 
            v_unit_id, 
            CASE WHEN v_i % 2 = 0 THEN v_admin_id ELSE v_sales_id END,
            v_statuses[(v_i % 5) + 1],
            (SELECT price FROM public.units WHERE id = v_unit_id)
        ) RETURNING id INTO v_sale_id;

        -- Eğer satış durumu 'Sold' veya 'Contract' ise sözleşme ve ödeme planı ekle
        IF v_i % 5 IN (3, 4) THEN -- Sold (4) ve Contract (3) durumları için
            UPDATE public.units SET status = 'Sold' WHERE id = v_unit_id;
            
            INSERT INTO public.contracts (tenant_id, sale_id, contract_number, contract_date, signed_amount)
            VALUES (v_tenant_id, v_sale_id, 'CONT-' || 2024 || '-' || v_i, CURRENT_DATE - (v_i || ' days')::interval, 5000000)
            RETURNING id INTO v_contract_id;

            INSERT INTO public.payment_plans (tenant_id, contract_id, name)
            VALUES (v_tenant_id, v_contract_id, 'Standart 12 Ay')
            RETURNING id INTO v_plan_id;

            -- 5 Taksit Ekle
            FOR v_j IN 1..5 LOOP
                INSERT INTO public.payment_items (tenant_id, payment_plan_id, due_date, amount, status, description)
                VALUES (
                    v_tenant_id, 
                    v_plan_id, 
                    CURRENT_DATE + ((v_j - 2) * 30 || ' days')::interval, 
                    1000000,
                    CASE WHEN v_j < 3 THEN 'Paid' ELSE 'Pending' END,
                    'Taksit ' || v_j
                );
            END LOOP;
        END IF;
    END LOOP;

    RAISE NOTICE 'Test verileri başarıyla oluşturuldu.';
END $$;
