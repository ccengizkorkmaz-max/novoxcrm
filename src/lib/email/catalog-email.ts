import { sendSystemEmail } from '@/lib/email/mailer'

interface CatalogEmailParams {
    supabase: any
    tenantId: string
    email: string
    projectId: string
    customerId?: string
    phone?: string
}

const CATEGORY_MAP: Record<string, string> = {
    'Brochure': 'Broşür',
    'Floor Plan': 'Kat Planı',
    'Price List': 'Fiyat Listesi',
    '3D/Virtual': '3D/Sanal Tur',
    'Marketing': 'Tanıtım Kataloğu',
    'Legal': 'Yasal Evrak'
};

const DEFAULT_SUBJECT = '{project_name} - Proje Kataloğu ve Bilgileri';
const DEFAULT_HTML = `
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
`;

/**
 * Handles comparing/saving client email address and sends project brochure catalog.
 */
export async function handleAndSendCatalogEmail(params: CatalogEmailParams): Promise<{ success: boolean; message: string }> {
    const { supabase, tenantId, email, projectId, customerId, phone } = params;

    if (!email || !projectId) {
        return { success: false, message: "E-posta adresi ve Proje ID gereklidir." };
    }

    const targetEmail = email.trim().toLowerCase();
    let resolvedCustomerId = customerId;
    let customerRecord: any = null;

    // 1. Resolve Customer Record
    if (resolvedCustomerId) {
        const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('id', resolvedCustomerId)
            .maybeSingle();
        customerRecord = data;
    } else if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneVariants = [cleanPhone];
        if (cleanPhone.startsWith('90') && cleanPhone.length > 10) {
            phoneVariants.push(cleanPhone.substring(2));
        }

        for (const variant of phoneVariants) {
            const { data } = await supabase
                .from('customers')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('phone', `%${variant}%`)
                .limit(1)
                .maybeSingle();
            if (data) {
                customerRecord = data;
                resolvedCustomerId = data.id;
                break;
            }
        }
    }

    // 2. Handle Customer Save & Compare Email
    if (!customerRecord) {
        // Unknown customer, create a new record
        console.log(`[CatalogEmail] Customer not found. Creating a new candidate record for: ${phone || 'unknown'}`);
        const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
                tenant_id: tenantId,
                full_name: 'Yeni Gelen Arama Adayı',
                phone: phone || '',
                email: targetEmail,
                customer_type: 'individual',
                contact_type: 'buyer'
            })
            .select()
            .single();

        if (createError) {
            console.error('[CatalogEmail] Failed to create new customer:', createError.message);
        } else {
            customerRecord = newCustomer;
            resolvedCustomerId = newCustomer.id;
        }
    } else {
        const primaryEmail = (customerRecord.email || '').trim().toLowerCase();
        const secondaryEmail = (customerRecord.email2 || '').trim().toLowerCase();

        if (!primaryEmail) {
            // Primary email is empty, update it
            console.log(`[CatalogEmail] Primary email empty. Saving: ${targetEmail}`);
            await supabase
                .from('customers')
                .update({ email: targetEmail })
                .eq('id', customerRecord.id);
        } else if (primaryEmail === targetEmail) {
            // Already matches primary, do nothing
            console.log('[CatalogEmail] Provided email matches primary. No database update.');
        } else if (secondaryEmail !== targetEmail) {
            // Different from primary and different/empty secondary, save as email2
            console.log(`[CatalogEmail] Provided email is different. Saving as email2: ${targetEmail}`);
            await supabase
                .from('customers')
                .update({ email2: targetEmail })
                .eq('id', customerRecord.id);
        }
    }

    // 3. Fetch Project and Tenant Config
    const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .maybeSingle();

    const { data: tenant } = await supabase
        .from('tenants')
        .select('name, catalog_email_subject, catalog_email_html')
        .eq('id', tenantId)
        .maybeSingle();

    const projectName = project?.name || 'Novo Projesi';
    const tenantName = tenant?.name || 'Novo Şirketler Grubu';

    // 4. Fetch Public Documents for Project
    const { data: docs } = await supabase
        .from('document_library')
        .select('name, file_url, category')
        .eq('project_id', projectId)
        .eq('permissions', 'public');

    if (!docs || docs.length === 0) {
        console.warn(`[CatalogEmail] No public documents found in library for project: ${projectName} (${projectId})`);
        return { success: false, message: `Bu projeye ait yayında olan bir broşür veya katalog bulunamadı.` };
    }

    // 5. Build HTML Links/Buttons
    const documentLinksHtml = docs.map((doc: any) => {
        const categoryLabel = CATEGORY_MAP[doc.category] || doc.category;
        return `<a href="${doc.file_url}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${doc.name} (${categoryLabel}) İndir</a>`;
    }).join('\n');

    // 6. Template replacements
    let subject = tenant?.catalog_email_subject || DEFAULT_SUBJECT;
    let html = tenant?.catalog_email_html || DEFAULT_HTML;

    subject = subject
        .replace(/{project_name}/g, projectName)
        .replace(/{tenant_name}/g, tenantName);

    html = html
        .replace(/{project_name}/g, projectName)
        .replace(/{tenant_name}/g, tenantName)
        .replace(/{document_links}/g, documentLinksHtml);

    // 7. Send the Email
    try {
        await sendSystemEmail({
            tenantId,
            to: targetEmail,
            subject,
            html,
            fromName: tenantName
        });

        // 8. Log activity
        if (resolvedCustomerId) {
            let ownerId = customerRecord?.assigned_to || null;
            await supabase.from('activities').insert({
                tenant_id: tenantId,
                customer_id: resolvedCustomerId,
                owner_id: ownerId,
                type: 'Email',
                topic: 'Sales',
                summary: `📧 Katalog Gönderildi: ${projectName}`,
                description: `Müşterinin talebi üzerine ${projectName} projesine ait dokümanlar ${targetEmail} adresine e-posta ile gönderildi.`,
                status: 'Completed',
                due_date: new Date().toISOString()
            });
        }

        return { success: true, message: `Katalog başarıyla ${targetEmail} adresine gönderildi.` };
    } catch (sendErr: any) {
        console.error('[CatalogEmail] SMTP send error:', sendErr.message);
        return { success: false, message: `E-posta gönderimi başarısız oldu: ${sendErr.message}` };
    }
}
