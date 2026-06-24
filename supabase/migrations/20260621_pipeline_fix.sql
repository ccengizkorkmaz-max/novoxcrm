-- Oikos tenant pipeline_stages güncelle (Opsiyon ekle)
UPDATE tenants SET pipeline_stages = '[
    {"key": "prospect", "label": "Aday", "color": "#6366f1", "order": 1},
    {"key": "qualified", "label": "Nitelikli", "color": "#8b5cf6", "order": 2},
    {"key": "reservation", "label": "Opsiyon", "color": "#06b6d4", "order": 3},
    {"key": "proposal", "label": "Teklif", "color": "#f59e0b", "order": 4},
    {"key": "negotiation", "label": "Müzakere", "color": "#f97316", "order": 5},
    {"key": "won", "label": "Kazanıldı", "color": "#22c55e", "order": 6},
    {"key": "lost", "label": "Kaybedildi", "color": "#ef4444", "order": 7}
]'::jsonb
WHERE id = '3de3c038-8ce7-44b1-b5ba-8b99d63301f4';

-- Mehmet Yılmaz'ın CRM durumunu da düzeltelim
UPDATE sales SET status = 'Prospect' 
WHERE customer_id IN (
    SELECT id FROM customers WHERE full_name = 'Mehmet Yılmaz' 
    AND tenant_id = '3de3c038-8ce7-44b1-b5ba-8b99d63301f4'
) AND status = 'Lead';
