'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { addMonths } from 'date-fns'

function standardizeTRPhone(input: any): string | null {
    if (!input) return null
    let digits = String(input).replace(/\D/g, '')
    if (digits.length === 10 && digits.startsWith('5')) {
        return digits
    } else if (digits.length === 11 && digits.startsWith('05')) {
        return digits.substring(1)
    } else if (digits.length === 12 && digits.startsWith('905')) {
        return digits.substring(2)
    } else if (digits.length >= 13 && digits.includes('905')) {
        const index = digits.indexOf('5')
        if (index !== -1 && digits.substring(index).length === 10) {
            return digits.substring(index)
        }
    }
    if (digits.length === 10) return digits
    if (digits.length > 7) return digits // Return international or landline
    return null
}

function parseExcelDate(raw: any): string | null {
    if (!raw) return null
    if (typeof raw === 'number' && raw > 20000) {
        // Excel serial date to JS Date
        const date = new Date((raw - 25569) * 86400 * 1000)
        return date.toISOString().split('T')[0]
    }
    const str = String(raw).trim()
    // DD.MM.YYYY to YYYY-MM-DD
    if (str.includes('.')) {
        const parts = str.split('.')
        if (parts.length === 3) {
            const day = parts[0].padStart(2, '0')
            const month = parts[1].padStart(2, '0')
            let year = parts[2]
            if (year.length === 2) year = '20' + year
            return `${year}-${month}-${day}`
        }
    }
    // Check standard YYYY-MM-DD
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0]
    }
    return null
}

export async function parsePastSalesFromExcel(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { error: 'Lütfen bir Excel dosyası (.xlsx, .xls) seçin.' }

    try {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })

        // Find primary sheet
        let sheetName = workbook.SheetNames.find(n => 
            n.toLowerCase().includes('sat') || n.toLowerCase().includes('sale')
        ) || workbook.SheetNames[0]

        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (!rows || rows.length < 2) {
            return { error: 'Excel dosyası boş veya başlık satırı dışında veri içermiyor.' }
        }

        // Find header row (usually row 0)
        const headerRow = rows[0].map(c => String(c || '').toLowerCase().trim().replace(/_/g, ' '))

        const findColIdx = (...keywords: string[]) => {
            return headerRow.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())))
        }

        const colMap = {
            fullName: findColIdx('musteri ad', 'ad soyad', 'isim', 'müşteri', 'customer'),
            phone: findColIdx('telefon', 'phone', 'tel', 'cep', 'gsm'),
            email: findColIdx('eposta', 'e-posta', 'email', 'mail'),
            idNumber: findColIdx('tckn', 'tc no', 'vergi no', 'kimlik'),
            source: findColIdx('kaynak', 'source'),
            project: findColIdx('proje adi', 'proje adı', 'proje', 'project'),
            block: findColIdx('blok no', 'blok', 'block'),
            unitNo: findColIdx('unite no', 'ünite no', 'daire no', 'kapi no', 'kapı no', 'unit'),
            unitType: findColIdx('unite tipi', 'ünite tipi', 'tip', 'oda'),
            saleDate: findColIdx('satis tarihi', 'satış tarihi', 'sozlesme tarihi', 'tarih', 'date'),
            contractNo: findColIdx('sozlesme no', 'sözleşme no', 'kontrat no', 'dosya no'),
            salePrice: findColIdx('satis bedeli', 'satış bedeli', 'tutar', 'fiyat', 'bedel', 'price'),
            currency: findColIdx('para birimi', 'doviz', 'döviz', 'currency'),
            paymentType: findColIdx('odeme turu', 'ödeme türü', 'odeme tipi', 'ödeme tipi', 'tur'),
            downPayment: findColIdx('pesinat', 'peşinat'),
            collectedTotal: findColIdx('tahsil edilen', 'odenen', 'ödenen', 'tahsilat'),
            installmentCount: findColIdx('taksit sayisi', 'taksit sayısı', 'taksit adedi', 'vade'),
            firstInstallmentDate: findColIdx('ilk taksit', 'taksit baslangic', 'taksit başlangıç'),
            installmentInterval: findColIdx('taksit araligi', 'taksit aralığı', 'aralik'),
            salesRep: findColIdx('satis temsilcisi', 'satış temsilcisi', 'danisman', 'danışman', 'temsilci'),
            notes: findColIdx('aciklama', 'açıklama', 'not', 'notes')
        }

        if (colMap.fullName === -1 || colMap.phone === -1 || colMap.salePrice === -1) {
            return { 
                error: 'Excel şablonunda zorunlu alanlar eksik. Lütfen "Musteri_Ad_Soyad", "Telefon" ve "Satis_Bedeli" kolonlarının olduğundan emin olun.' 
            }
        }

        const parsedRows: any[] = []
        let totalRevenue = 0
        let cashSalesCount = 0
        let installmentSalesCount = 0
        const errors: string[] = []

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
                continue
            }

            const fullName = String(row[colMap.fullName] || '').trim()
            const rawPhone = row[colMap.phone]
            const phone = standardizeTRPhone(rawPhone)

            if (!fullName) {
                errors.push(`Satır ${i + 1}: Müşteri adı boş bırakılamaz.`)
                continue
            }

            if (!phone) {
                errors.push(`Satır ${i + 1} (${fullName}): Geçerli bir telefon numarası bulunamadı.`)
                continue
            }

            const salePrice = Number(String(row[colMap.salePrice] || 0).replace(/[^0-9.-]+/g, ''))
            if (!salePrice || isNaN(salePrice) || salePrice <= 0) {
                errors.push(`Satır ${i + 1} (${fullName}): Satış bedeli geçerli bir sayı olmalıdır.`)
                continue
            }

            const rawSaleDate = colMap.saleDate !== -1 ? row[colMap.saleDate] : null
            const saleDate = parseExcelDate(rawSaleDate) || new Date().toISOString().split('T')[0]

            const rawPaymentType = colMap.paymentType !== -1 ? String(row[colMap.paymentType] || '').trim().toLowerCase() : 'peşin'
            const isVadeli = rawPaymentType.includes('vade') || rawPaymentType.includes('taksit') || rawPaymentType.includes('install')
            const paymentType = isVadeli ? 'Vadeli' : 'Peşin'

            let downPayment = colMap.downPayment !== -1 ? Number(String(row[colMap.downPayment] || 0).replace(/[^0-9.-]+/g, '')) : 0
            if (!isVadeli && (!downPayment || downPayment <= 0)) {
                downPayment = salePrice
            }

            let collectedTotal = colMap.collectedTotal !== -1 ? Number(String(row[colMap.collectedTotal] || 0).replace(/[^0-9.-]+/g, '')) : 0
            if (!isVadeli && (!collectedTotal || collectedTotal <= 0)) {
                collectedTotal = salePrice
            }

            const installmentCount = isVadeli && colMap.installmentCount !== -1 
                ? parseInt(String(row[colMap.installmentCount] || '12'), 10) || 12 
                : 0

            const rawFirstDate = colMap.firstInstallmentDate !== -1 ? row[colMap.firstInstallmentDate] : null
            const firstInstallmentDate = parseExcelDate(rawFirstDate) || saleDate

            const installmentInterval = colMap.installmentInterval !== -1 
                ? parseInt(String(row[colMap.installmentInterval] || '1'), 10) || 1 
                : 1

            const currency = colMap.currency !== -1 ? (String(row[colMap.currency] || 'TRY').toUpperCase().trim() || 'TRY') : 'TRY'
            const projectName = colMap.project !== -1 ? String(row[colMap.project] || 'Genel Proje').trim() : 'Genel Proje'
            const unitNo = colMap.unitNo !== -1 ? String(row[colMap.unitNo] || 'Daire').trim() : 'Daire'
            const blockNo = colMap.block !== -1 ? String(row[colMap.block] || '').trim() : ''
            const unitType = colMap.unitType !== -1 ? String(row[colMap.unitType] || '').trim() : ''
            const contractNo = colMap.contractNo !== -1 ? String(row[colMap.contractNo] || '').trim() : ''
            const salesRep = colMap.salesRep !== -1 ? String(row[colMap.salesRep] || '').trim() : ''
            const notes = colMap.notes !== -1 ? String(row[colMap.notes] || '').trim() : ''
            const email = colMap.email !== -1 ? String(row[colMap.email] || '').trim() : ''
            const idNumber = colMap.idNumber !== -1 ? String(row[colMap.idNumber] || '').trim() : ''
            const source = colMap.source !== -1 ? String(row[colMap.source] || 'Eski Satış İçe Aktarımı').trim() : 'Eski Satış İçe Aktarımı'

            totalRevenue += salePrice
            if (isVadeli) installmentSalesCount++
            else cashSalesCount++

            parsedRows.push({
                rowIndex: i + 1,
                fullName,
                phone,
                email: email || null,
                idNumber: idNumber || null,
                source,
                projectName,
                blockNo: blockNo || null,
                unitNo,
                unitType: unitType || null,
                saleDate,
                contractNo: contractNo || null,
                salePrice,
                currency,
                paymentType,
                downPayment,
                collectedTotal,
                installmentCount,
                firstInstallmentDate,
                installmentInterval,
                salesRep: salesRep || null,
                notes: notes || null
            })
        }

        if (parsedRows.length === 0) {
            return { error: 'Geçerli satış satırı okunamadı.', errors }
        }

        return {
            success: true,
            totalRows: rows.length - 1,
            validCount: parsedRows.length,
            errorCount: errors.length,
            totalRevenue,
            cashSalesCount,
            installmentSalesCount,
            errors: errors.slice(0, 10),
            data: parsedRows
        }
    } catch (err: any) {
        console.error('ParsePastSales error:', err)
        return { error: 'Dosya okunurken beklenmedik hata oluştu: ' + (err.message || 'Bilinmeyen hata') }
    }
}

export async function executePastSalesImport(salesData: any[]) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authErr } = await supabase.auth.getUser()
        if (authErr || !user) return { error: 'Yetkisiz işlem. Lütfen oturum açın.' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { error: 'Kurum (tenant) bilgisi bulunamadı.' }
        const tenantId = profile.tenant_id

        // Fetch existing projects for tenant
        const { data: existingProjects } = await supabase
            .from('projects')
            .select('id, name')
            .eq('tenant_id', tenantId)
        
        const projectMap = new Map<string, string>()
        existingProjects?.forEach(p => {
            projectMap.set(p.name.toLowerCase().trim(), p.id)
        })

        // Fetch existing profiles (sales reps)
        const { data: existingProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('tenant_id', tenantId)

        const repMap = new Map<string, string>()
        existingProfiles?.forEach(pr => {
            if (pr.full_name) repMap.set(pr.full_name.toLowerCase().trim(), pr.id)
        })

        let importedCustomersCount = 0
        let importedContractsCount = 0
        let importedPaymentPlansCount = 0
        const now = new Date()

        for (const item of salesData) {
            // 1. Match or Create Project
            let projectId = projectMap.get(item.projectName.toLowerCase().trim())
            if (!projectId) {
                // Auto create project if doesn't exist
                const { data: newProj, error: pErr } = await supabase
                    .from('projects')
                    .insert({
                        name: item.projectName,
                        tenant_id: tenantId,
                        status: 'Active'
                    })
                    .select('id')
                    .single()
                
                if (newProj?.id) {
                    projectId = newProj.id
                    projectMap.set(item.projectName.toLowerCase().trim(), newProj.id)
                }
            }

            // 2. Find or Create Customer
            let customerId: string | null = null
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone', item.phone)
                .maybeSingle()

            if (existingCustomer) {
                customerId = existingCustomer.id
            } else {
                const { data: newCust, error: custErr } = await supabase
                    .from('customers')
                    .insert({
                        tenant_id: tenantId,
                        full_name: item.fullName,
                        phone: item.phone,
                        email: item.email || null,
                        source: item.source || 'Eski Satış İçe Aktarımı',
                        created_at: new Date(item.saleDate).toISOString()
                    })
                    .select('id')
                    .single()

                if (newCust) {
                    customerId = newCust.id
                    importedCustomersCount++
                } else {
                    console.error('Customer insert error:', custErr)
                    continue
                }
            }

            // 3. Find or Create Unit
            let unitId: string | null = null
            if (projectId && item.unitNo) {
                const { data: existingUnit } = await supabase
                    .from('units')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('unit_number', item.unitNo)
                    .maybeSingle()

                if (existingUnit) {
                    unitId = existingUnit.id
                    // Mark as sold
                    await supabase
                        .from('units')
                        .update({ status: 'Sold' })
                        .eq('id', unitId)
                } else {
                    // Create unit marked as sold
                    const { data: newUnit } = await supabase
                        .from('units')
                        .insert({
                            tenant_id: tenantId,
                            project_id: projectId,
                            unit_number: item.unitNo,
                            block: item.blockNo || null,
                            type: item.unitType || 'Standart',
                            price: item.salePrice,
                            currency: item.currency || 'TRY',
                            status: 'Sold'
                        })
                        .select('id')
                        .single()

                    if (newUnit) unitId = newUnit.id
                }
            }

            // 4. Sales Rep Match
            const salesRepId = (item.salesRep && repMap.get(item.salesRep.toLowerCase().trim())) || user.id

            // 5. Create Sale (status: Won / Satıldı)
            const { data: newSale, error: saleErr } = await supabase
                .from('sales')
                .insert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    project_id: projectId || null,
                    unit_id: unitId || null,
                    assigned_to: salesRepId,
                    status: 'Won',
                    final_price: item.salePrice,
                    deposit_amount: item.downPayment || 0,
                    currency: item.currency || 'TRY',
                    contract_date: item.saleDate,
                    created_at: new Date(item.saleDate).toISOString(),
                    lead_origin: 'excel_import',
                    description: item.notes || `Excel'den geçmiş satış aktarımı: ${item.projectName} ${item.unitNo}`
                })
                .select('id')
                .single()

            // 6. Create Contract
            const contractNumber = item.contractNo || `SZL-${new Date(item.saleDate).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            const { data: newContract, error: contractErr } = await supabase
                .from('contracts')
                .insert({
                    tenant_id: tenantId,
                    project_id: projectId || null,
                    unit_id: unitId || null,
                    sales_rep_id: salesRepId,
                    contract_number: contractNumber,
                    contract_date: item.saleDate,
                    currency: item.currency || 'TRY',
                    amount: item.salePrice,
                    final_amount: item.salePrice,
                    total_amount: item.salePrice,
                    status: 'Active',
                    notes: item.notes || 'Geçmiş satış içe aktarımı',
                    created_by: user.id
                })
                .select('id')
                .single()

            if (!newContract) {
                console.error('Contract create error:', contractErr)
                continue
            }
            importedContractsCount++

            // 7. Insert Contract Customer
            await supabase
                .from('contract_customers')
                .insert({
                    contract_id: newContract.id,
                    customer_id: customerId,
                    role: 'Primary',
                    share_percentage: 100
                })

            // 8. Generate Payment Plans (DownPayment + Installments)
            const paymentPlansToInsert: any[] = []

            // A. Peşinat Kaydı
            const downPaymentAmount = Number(item.downPayment || 0)
            if (downPaymentAmount > 0) {
                paymentPlansToInsert.push({
                    contract_id: newContract.id,
                    payment_type: 'DownPayment',
                    due_date: item.saleDate,
                    amount: downPaymentAmount,
                    paid_amount: downPaymentAmount,
                    currency: item.currency || 'TRY',
                    status: 'Paid',
                    paid_date: item.saleDate,
                    notes: 'Satış anında alınan peşinat'
                })
            }

            // B. Taksitler (Eğer Vadeli ise)
            if (item.paymentType === 'Vadeli' && item.installmentCount > 0) {
                const remainingTotal = Math.max(0, item.salePrice - downPaymentAmount)
                const installmentAmount = Math.round(remainingTotal / item.installmentCount)
                
                // Bugüne kadar peşinat hariç ödenmiş toplam taksit hacmi
                let remainingPaidTaksitPool = Math.max(0, Number(item.collectedTotal || 0) - downPaymentAmount)

                const firstDate = new Date(item.firstInstallmentDate || item.saleDate)
                const interval = item.installmentInterval || 1

                for (let k = 0; k < item.installmentCount; k++) {
                    const dueDateObj = addMonths(firstDate, k * interval)
                    const dueDateStr = dueDateObj.toISOString().split('T')[0]
                    const isDueDatePast = dueDateObj < now

                    let instStatus: 'Paid' | 'Partial' | 'Overdue' | 'Pending' = 'Pending'
                    let instPaidAmount = 0
                    let instPaidDate: string | null = null

                    if (remainingPaidTaksitPool >= installmentAmount) {
                        instStatus = 'Paid'
                        instPaidAmount = installmentAmount
                        instPaidDate = dueDateStr
                        remainingPaidTaksitPool -= installmentAmount
                    } else if (remainingPaidTaksitPool > 0) {
                        instStatus = 'Partial'
                        instPaidAmount = remainingPaidTaksitPool
                        instPaidDate = dueDateStr
                        remainingPaidTaksitPool = 0
                    } else {
                        instStatus = isDueDatePast ? 'Overdue' : 'Pending'
                        instPaidAmount = 0
                        instPaidDate = null
                    }

                    paymentPlansToInsert.push({
                        contract_id: newContract.id,
                        payment_type: 'Installment',
                        due_date: dueDateStr,
                        amount: installmentAmount,
                        paid_amount: instPaidAmount,
                        currency: item.currency || 'TRY',
                        status: instStatus,
                        paid_date: instPaidDate,
                        notes: `Taksit ${k + 1} / ${item.installmentCount}`
                    })
                }
            } else if (item.paymentType === 'Peşin') {
                // Eğer Peşinat satırı zaten tam satış bedeli ise başka taksite gerek yok
                // Eğer peşinat girilmediyse tek parça Peşinat kaydı aç
                if (downPaymentAmount === 0) {
                    paymentPlansToInsert.push({
                        contract_id: newContract.id,
                        payment_type: 'DownPayment',
                        due_date: item.saleDate,
                        amount: item.salePrice,
                        paid_amount: item.salePrice,
                        currency: item.currency || 'TRY',
                        status: 'Paid',
                        paid_date: item.saleDate,
                        notes: 'Tamamı peşin ödeme'
                    })
                }
            }

            if (paymentPlansToInsert.length > 0) {
                const { error: ppErr } = await supabase
                    .from('payment_plans')
                    .insert(paymentPlansToInsert)

                if (!ppErr) {
                    importedPaymentPlansCount += paymentPlansToInsert.length
                } else {
                    console.error('Payment plan insert error:', ppErr)
                }
            }
        }

        revalidatePath('/contracts')
        revalidatePath('/crm')
        revalidatePath('/reports/ceo-funnel')
        revalidatePath('/inventory')

        return {
            success: true,
            importedCustomersCount,
            importedContractsCount,
            importedPaymentPlansCount,
            message: `${importedContractsCount} adet sonlandırılmış satış ve ${importedCustomersCount} yeni müşteri başarıyla CRM ve Sözleşme Takvimine aktarıldı.`
        }
    } catch (err: any) {
        console.error('ExecutePastSalesImport Error:', err)
        return { error: 'İçe aktarma sırasında hata: ' + (err.message || 'Bilinmeyen hata') }
    }
}
