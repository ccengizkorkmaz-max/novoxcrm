/**
 * Web Form Lead Validation and Field Extraction
 * 
 * Provides strict validation to ensure ONLY genuine webform sales inquiries
 * are transferred to CRM Sales Management (Satış Yönetimi).
 * 
 * Automatically blocks and filters out:
 * 1. Job / Employment / Career applications (İş başvuruları, CV'ler, staj vb.)
 * 2. Vendor, agency, advertising & marketing proposals (Ajans teklifleri, SEO, catering, çöp şiş vb.)
 * 3. Automated system notifications, newsletters, billing, spam (noreply, fatura, ChatGPT vb.)
 * 4. Inquiries lacking a valid phone number (en az 10 haneli aranabilir telefon zorunludur)
 * 5. General emails without webform structure or indicators
 */

export interface WebFormValidationResult {
    isValid: boolean
    category: 'real_lead' | 'job_application' | 'vendor_spam' | 'missing_phone' | 'missing_name' | 'not_webform'
    reason: string
    extractedData: {
        name: string | null
        phone: string | null
        email: string | null
        project: string | null
        isComplete: boolean
    }
}

function normalizeText(text: string | null | undefined): string {
    if (!text) return ''
    return text
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
}

// Strictest job / career application indicators
const JOB_KEYWORDS = [
    'is basvuru', 'is basvurusu', 'genel is basvuru', 'is ilani', 'is ilan', 
    'ilaniniz icin', 'ilaniniz hakkinda', 'pozisyonu icin', 'pozisyona basvuru',
    'ozgecmis', 'ozgecmisim', 'cv\'m', 'cv ektedir', 'cv ekte', 'cv vb', 'dosya ektedir',
    'kariyer', 'staj', 'stajyer', 'staj basvurusu', 'personel alimi', 'eleman alimi', 
    'eleman arayisi', 'ofis asistani', 'ofis destek', 'ikram personeli', 'makam soforu', 
    'ozel sofor', 'sofor pozisyonu', 'soforluk', 'guvenlik gorevlisi', 'temizlik gorevlisi', 
    'insan kaynaklari', 'ik@', 'is deneyimi', 'egitim bilgileri', 'calisma alanlari', 
    'basvurumu sunuyorum', 'kurumunuza deger katmaya', 'is ariyorum', 'is arayisi'
]

// Vendor, spam, agency, system emails
const SPAM_KEYWORDS = [
    'ajans', 'reklam teklifi', 'tanitim teklifi', 'sponsorluk',
    'seo hizmeti', 'yazilim teklifi', 'web tasarim teklifi', 'dijital pazarlama ajansi',
    'catering', 'restoran', 'cop sis', 'bayilik teklifi',
    'noreply@', 'no-reply@', 'newsletter', 'bulten', 'unsubscribe', 'abonelikten cik',
    'fatura', 'dekont', 'e-arsiv', 'e-fatura', 'openai', 'chatgpt', 'google alerts',
    'hizmet teklifi', 'isbirligi teklifi', 'is birligi teklifi'
]

/**
 * Extracts a valid phone number from message body or direct phone field.
 * Requires at least 10 digits for a callable phone number.
 */
export function extractWebFormPhone(message?: string | null, directPhone?: string | null): string | null {
    if (directPhone) {
        const clean = directPhone.replace(/[^\d\+]/g, '').trim()
        const digits = clean.replace(/\D/g, '')
        if (digits.length >= 10) return clean
    }

    if (!message) return null

    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || message
        if (parsed.json) {
            try { text = JSON.parse(parsed.json).message || text } catch { /* ignore */ }
        }
    } catch { /* not JSON */ }

    const patterns = [
        /(?:Telefon Numarası|Telefon No|Telefon|Tel|Phone|Mobile):\s*([0-9\+\s\(\)\-]{10,})/i,
        /(?:^|\s)(?:0?5\d{2}[\s\-\.]?\d{3}[\s\-\.]?\d{2}[\s\-\.]?\d{2})(?:\s|$|[^\d])/m,
        /(?:\+90[\s\-\.]?5\d{2}[\s\-\.]?\d{3}[\s\-\.]?\d{2}[\s\-\.]?\d{2})/m
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            const raw = match[1] ? match[1].trim() : match[0].trim()
            const clean = raw.replace(/[^\d\+]/g, '').trim()
            const digits = clean.replace(/\D/g, '')
            if (digits.length >= 10) return clean
        }
    }

    return null
}

/**
 * Extracts human customer name from message body or direct name field.
 * Filters out system sender names like 'NOVO' or sender email addresses.
 */
export function extractWebFormName(message?: string | null, directName?: string | null): string | null {
    const isSystemName = (n?: string | null) => {
        if (!n) return true
        const lower = n.trim().toLowerCase()
        return lower === 'novo' || 
               lower.includes('novosirketlergrubu') || 
               lower === 'gelen kutusu' || 
               lower === 'web' ||
               lower.includes('@')
    }

    if (directName && !isSystemName(directName)) {
        return directName.trim()
    }

    if (!message) return null

    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || message
    } catch { /* not JSON */ }

    const patterns = [
        /(?:Ad\s+Soyad|İsim\s+Soyisim|Adınız\s+Soyadınız|İsim|Name|Full\s+Name):\s*([^\r\n]+)/i
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            const val = match[1].trim()
            if (val && !isSystemName(val) && val.length >= 2) {
                return val
            }
        }
    }

    return !isSystemName(directName) ? directName?.trim() || null : null
}

/**
 * Extracts email from message body or direct email field.
 * Filters out web@novosirketlergrubu.com form sender email.
 */
export function extractWebFormEmail(message?: string | null, directEmail?: string | null): string | null {
    const isSystemEmail = (e?: string | null) => {
        if (!e) return true
        const lower = e.trim().toLowerCase()
        return lower === 'web@novosirketlergrubu.com' || lower.startsWith('noreply@') || lower.startsWith('no-reply@')
    }

    if (directEmail && !isSystemEmail(directEmail)) {
        return directEmail.trim()
    }

    if (!message) return null

    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || message
    } catch { /* not JSON */ }

    const match = text.match(/(?:E-posta Adresi|E-posta|Email|E-mail):\s*([^\s]+@[^\s]+\.[^\s]+)/i)
    if (match) {
        const val = match[1].trim()
        if (!isSystemEmail(val)) return val
    }

    // Fallback regex scan for any email in text
    const anyEmailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
    if (anyEmailMatch) {
        for (const em of anyEmailMatch) {
            if (!isSystemEmail(em)) return em.trim()
        }
    }

    return !isSystemEmail(directEmail) ? directEmail?.trim() || null : null
}

/**
 * Extracts interested project name from message body.
 */
export function extractWebFormProject(message?: string | null): string | null {
    if (!message) return null

    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || message
    } catch { /* not JSON */ }

    const patterns = [
        /(?:Seçilen Proje|İlgilenilen Proje|Seçtiği Proje|Proje):\s*([^\n\r]+?)(?=\s*(?:KVKK|Mesaj|Not|Ad\s+Soyad|Telefon|E-posta|--|$)|\r|\n)/i,
        /Konu:\s*(.+?)(?=\s*(?:Ad\s+Soyad|E-posta|Telefon|Mesaj|Not|$)|[\r\n])/i
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            const clean = match[1].trim()
            if (clean && clean.length > 2 && !clean.toLowerCase().includes('başvuru')) {
                return clean
            }
        }
    }

    return null
}

/**
 * Validates whether an incoming inbox item or message is a genuine webform lead.
 */
export function validateWebFormLead(item: {
    name?: string | null
    email?: string | null
    phone?: string | null
    message?: string | null
    source?: string | null
}): WebFormValidationResult {
    const rawMsg = item.message || ''
    const norm = normalizeText(`${item.name || ''} ${item.email || ''} ${rawMsg}`)

    // 1. Strict Job / HR Application Exclusion
    for (const kw of JOB_KEYWORDS) {
        if (norm.includes(kw)) {
            return {
                isValid: false,
                category: 'job_application',
                reason: `İş/Kariyer Başvurusu (${kw}) — Satış Yönetimi adayı değildir.`,
                extractedData: {
                    name: extractWebFormName(rawMsg, item.name),
                    phone: extractWebFormPhone(rawMsg, item.phone),
                    email: extractWebFormEmail(rawMsg, item.email),
                    project: null,
                    isComplete: false
                }
            }
        }
    }

    // 2. Strict Spam / Vendor / Newsletter Exclusion
    for (const kw of SPAM_KEYWORDS) {
        if (norm.includes(kw)) {
            return {
                isValid: false,
                category: 'vendor_spam',
                reason: `Tedarikçi/Reklam/Spam (${kw}) — Satış Yönetimi adayı değildir.`,
                extractedData: {
                    name: extractWebFormName(rawMsg, item.name),
                    phone: extractWebFormPhone(rawMsg, item.phone),
                    email: extractWebFormEmail(rawMsg, item.email),
                    project: null,
                    isComplete: false
                }
            }
        }
    }

    // 3. Web Form Signature / Structural Check
    const hasWebFormHeader = 
        norm.includes('proje bilgi talep') || 
        norm.includes('iletisim formu') || 
        norm.includes('web sitesindeki iletisim formu') ||
        norm.includes('talep formu') ||
        item.source === 'WEB Form' || item.source === 'Web Form'

    const hasFormStructure = 
        (norm.includes('ad soyad:') || norm.includes('isim:')) && 
        (norm.includes('telefon:') || norm.includes('telefon numarasi:') || norm.includes('tel:'))

    if (!hasWebFormHeader && !hasFormStructure) {
        return {
            isValid: false,
            category: 'not_webform',
            reason: 'Web form belirteci veya form alan yapısı bulunamadı (Genel e-posta).',
            extractedData: {
                name: extractWebFormName(rawMsg, item.name),
                phone: extractWebFormPhone(rawMsg, item.phone),
                email: extractWebFormEmail(rawMsg, item.email),
                project: null,
                isComplete: false
            }
        }
    }

    // 4. Phone Number Check (En az 10 hane)
    const phone = extractWebFormPhone(rawMsg, item.phone)
    if (!phone) {
        return {
            isValid: false,
            category: 'missing_phone',
            reason: 'Geçerli bir telefon numarası bulunamadı (En az 10 haneli telefon zorunludur).',
            extractedData: {
                name: extractWebFormName(rawMsg, item.name),
                phone: null,
                email: extractWebFormEmail(rawMsg, item.email),
                project: extractWebFormProject(rawMsg),
                isComplete: false
            }
        }
    }

    // 5. Customer Name Check
    const name = extractWebFormName(rawMsg, item.name)
    if (!name || name.length < 2) {
        return {
            isValid: false,
            category: 'missing_name',
            reason: 'Geçerli bir müşteri adı bulunamadı.',
            extractedData: {
                name: null,
                phone,
                email: extractWebFormEmail(rawMsg, item.email),
                project: extractWebFormProject(rawMsg),
                isComplete: false
            }
        }
    }

    const email = extractWebFormEmail(rawMsg, item.email)
    const project = extractWebFormProject(rawMsg)

    return {
        isValid: true,
        category: 'real_lead',
        reason: 'Doğrulanmış web form satış adayı (lead).',
        extractedData: {
            name,
            phone,
            email,
            project,
            isComplete: !!(name && phone && (email || project))
        }
    }
}
