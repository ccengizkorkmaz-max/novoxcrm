-- ============================================================
-- ADD CATALOG EMAIL TEMPLATE AND EMAIL2
-- ============================================================

-- 1. Add email2 to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email2 TEXT;

-- 2. Add catalog email template columns to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS catalog_email_subject TEXT DEFAULT '{project_name} - Proje Kataloğu ve Bilgileri';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS catalog_email_html TEXT DEFAULT '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">{project_name}</h2>
    <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Tanıtım Dokümanları & Katalog</p>
  </div>
  <div style="height: 1px; background-color: #f1f5f9; margin-bottom: 24px;"></div>
  <div style="color: #334155; font-size: 16px; line-height: 1.6;">
    <p>Sayın Müşterimiz,</p>
    <p>İlgilenmiş olduğunuz <strong>{project_name}</strong> projesine ait broşür, kat planı ve güncel tanıtım dokümanlarına aşağıdaki bağlantılardan ulaşabilirsiniz:</p>
    <div style="margin: 32px 0; text-align: center;">
      {document_links}
    </div>
    <p style="font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #0f172a;">
      <strong>Not:</strong> Sorularınız veya daha fazla detay için bizimle bu kanal üzerinden veya <strong>444 66 74</strong> numaralı çağrı merkezimizden dilediğiniz zaman iletişime geçebilirsiniz.
    </p>
  </div>
  <div style="height: 1px; background-color: #f1f5f9; margin: 24px 0;"></div>
  <div style="text-align: center; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Bu e-posta <strong>{tenant_name}</strong> tarafından otomatik olarak gönderilmiştir.</p>
  </div>
</div>
';
