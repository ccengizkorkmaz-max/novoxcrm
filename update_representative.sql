-- Temsilci Atamalarını Güncelleme
-- Cengiz Korkmaz'dan Burak Kotaman'a tüm atamaları değiştir

-- Kullanıcı ID'leri:
-- Cengiz Korkmaz: 60925a94-8539-484d-843d-a11ae0e00ddd
-- Burak Kotaman:   a4f33bd0-800f-416f-8da7-a7c7aaa557dc

-- 1. Sales tablosundaki atamaları güncelle
UPDATE sales 
SET assigned_to = 'a4f33bd0-800f-416f-8da7-a7c7aaa557dc'
WHERE assigned_to = '60925a94-8539-484d-843d-a11ae0e00ddd';

-- 2. Activities tablosundaki atamaları güncelle
UPDATE activities
SET owner_id = 'a4f33bd0-800f-416f-8da7-a7c7aaa557dc'
WHERE owner_id = '60925a94-8539-484d-843d-a11ae0e00ddd';

-- 3. Kontrol sorguları (isteğe bağlı, kaç kayıt değiştiğini görmek için)
-- SELECT COUNT(*) as sales_count FROM sales WHERE assigned_to = 'a4f33bd0-800f-416f-8da7-a7c7aaa557dc';
-- SELECT COUNT(*) as activities_count FROM activities WHERE owner_id = 'a4f33bd0-800f-416f-8da7-a7c7aaa557dc';
