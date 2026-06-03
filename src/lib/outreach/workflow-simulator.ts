// Workflow Auto-Tuning Simulator — pure utility (no 'use server')

// ─── Workflow Auto-Tuning Simulator ──────────────────────────
// Saf hesaplama fonksiyonu — DB bağımlılığı yok, test edilebilir.
// Workflow kaydedildiğinde veya başlatıldığında çağrılarak
// optimum parametreleri hesaplar.

export interface WorkflowSimulationInput {
    segmentSize: number
    maxConcurrentLines: number
    steps: Array<{
        type: 'ai_call' | 'whatsapp' | 'sms' | 'wait' | 'condition' | 'ai_personalize'
        retry?: { enabled?: boolean; max_attempts?: number; interval_minutes?: number }
        wait_minutes?: number
    }>
    workingHoursStart: number   // 9
    workingHoursEnd: number     // 18
    cronIntervalMinutes: number // 1
}

export interface WorkflowComputedParams {
    // Hesaplanan metrikler
    estimated_total_calls: number
    estimated_wa_messages: number
    estimated_sms_messages: number
    optimal_batch_size: number
    estimated_completion_minutes: number
    estimated_cost_usd: number

    // Throughput
    calls_per_minute: number
    wa_per_minute: number

    // Darboğaz uyarıları
    warnings: string[]

    // Hesaplama girdileri (snapshot)
    segment_size: number
    max_concurrent_lines: number
    working_hours_window_minutes: number

    // Meta
    computed_at: string
}

// ─── Sabitler ────────────────────────────────────────────────

const AVG_CALL_DURATION_SEC = 45       // cevapsız: ~30s, konuşma: ~120s, ağırlıklı ortalama
const UNREACHABLE_RATE = 0.65          // deneyimsel: %65 cevapsız
const INTER_CALL_DELAY_SEC = 3         // Vapi rate limit koruması
const WA_BATCH_PER_CRON = 20           // engine.ts MAX_WA_PER_BATCH
const MAX_PROCESSED_PER_CRON = 100     // engine.ts hard limit
const AVG_VAPI_COST_PER_CALL_USD = 0.10
const AVG_WA_COST_PER_MSG_USD = 0.05
const AVG_SMS_COST_PER_MSG_USD = 0.03

// ─── Ana Simülasyon Fonksiyonu ───────────────────────────────

export function simulateWorkflow(input: WorkflowSimulationInput): WorkflowComputedParams {
    const {
        segmentSize,
        maxConcurrentLines,
        steps,
        workingHoursStart,
        workingHoursEnd,
        cronIntervalMinutes,
    } = input

    const warnings: string[] = []

    if (segmentSize === 0) {
        return createEmptyResult(input, warnings)
    }

    // ─── Çalışma saatleri penceresi ─────────────────────────
    const workingWindowMinutes = Math.max(0, (workingHoursEnd - workingHoursStart) * 60)
    if (workingWindowMinutes <= 0) {
        warnings.push('Çalışma saatleri tanımlı değil — akış çalışamaz')
    }

    // ─── Arama throughput hesaplaması ────────────────────────
    // Her line paralel çalışır. Bir arama avg 45sn sürer.
    // Ama batch başlatma 3sn/arama gecikme ekler.
    const effectiveCallDuration = AVG_CALL_DURATION_SEC
    const callsPerMinutePerLine = 60 / effectiveCallDuration
    const rawCallsPerMinute = maxConcurrentLines * callsPerMinutePerLine

    // Batch başlatma overhead: ilk batch'te N×3sn = 30sn (10 hat için)
    // Ama sonraki batch'ler webhook bazlı, stagger'lı gelir
    const batchStartOverheadSec = maxConcurrentLines * INTER_CALL_DELAY_SEC
    const overheadFactor = Math.max(0.5, 1 - (batchStartOverheadSec / 60 / cronIntervalMinutes))
    const effectiveCallsPerMinute = rawCallsPerMinute * overheadFactor

    // ─── Adım analizi ───────────────────────────────────────
    let totalCalls = 0
    let totalWa = 0
    let totalSms = 0
    let totalMinutes = 0

    let currentPopulation = segmentSize // Her adıma giren kişi sayısı

    for (const step of steps) {
        if (step.type === 'ai_call') {
            const retryEnabled = step.retry?.enabled !== false
            const maxAttempts = step.retry?.max_attempts || 0
            const retryInterval = step.retry?.interval_minutes || 15

            // İlk arama: herkesi ara
            const firstRoundCalls = currentPopulation
            const firstRoundMinutes = Math.ceil(firstRoundCalls / effectiveCallsPerMinute)
            totalCalls += firstRoundCalls
            totalMinutes += firstRoundMinutes

            // Retry dalgaları
            let remaining = Math.round(currentPopulation * UNREACHABLE_RATE)
            if (retryEnabled && maxAttempts > 0) {
                for (let r = 0; r < maxAttempts; r++) {
                    // Her retry öncesi bekleme süresi
                    totalMinutes += retryInterval
                    // Retry aramaları
                    totalCalls += remaining
                    const retryMinutes = Math.ceil(remaining / effectiveCallsPerMinute)
                    totalMinutes += retryMinutes
                    // Sonraki dalga için kalan
                    remaining = Math.round(remaining * UNREACHABLE_RATE)
                }
            }

            // Arama sonrası kalan (tüm retry'lar sonrası ulaşılamayan)
            // Bu kişiler sonraki adıma geçer
            const reachedTotal = currentPopulation - remaining
            const _successRate = 1 - Math.pow(UNREACHABLE_RATE, 1 + (retryEnabled ? maxAttempts : 0))
            currentPopulation = remaining // Sonraki adıma cevapsızlar geçer

        } else if (step.type === 'whatsapp') {
            totalWa += currentPopulation
            // WA throughput: 20/cron, 1dk/cron
            const waBatches = Math.ceil(currentPopulation / WA_BATCH_PER_CRON)
            totalMinutes += waBatches * cronIntervalMinutes
            // WA sonrası herkes sonraki adıma geçer (veya akış biter)
        } else if (step.type === 'sms') {
            totalSms += currentPopulation
            totalMinutes += Math.ceil(currentPopulation / WA_BATCH_PER_CRON) * cronIntervalMinutes
        } else if (step.type === 'wait') {
            totalMinutes += step.wait_minutes || 0
        }
        // condition, ai_personalize → neredeyse anında, skip
    }

    // ─── Optimal batch_size hesaplaması ─────────────────────
    // Hedef: Her cron döngüsünde boş slot bırakmadan çalıştır
    // Ama aşırı yığılma da yapma
    // Formül: concurrent × 2 (mevcut + webhook bitince gelecek)
    const optimalBatchSize = Math.min(
        maxConcurrentLines * 2,
        segmentSize,
        MAX_PROCESSED_PER_CRON
    )

    // ─── Çalışma saatleri yeterliliği ───────────────────────
    if (workingWindowMinutes > 0 && totalMinutes > workingWindowMinutes) {
        const daysNeeded = Math.ceil(totalMinutes / workingWindowMinutes)
        warnings.push(
            `Tahmini süre (${totalMinutes}dk) çalışma saatleri penceresini (${workingWindowMinutes}dk) aşıyor. ` +
            `Tamamlanması ~${daysNeeded} iş günü sürebilir.`
        )
    }

    // ─── Slot kullanım oranı ────────────────────────────────
    const theoreticalMaxCallsInWindow = effectiveCallsPerMinute * workingWindowMinutes
    const slotUtilization = theoreticalMaxCallsInWindow > 0
        ? Math.min(1, totalCalls / theoreticalMaxCallsInWindow)
        : 0

    if (slotUtilization > 0.95) {
        warnings.push(`Slot kullanım oranı çok yüksek (%${Math.round(slotUtilization * 100)}). Darboğaz riski var.`)
    } else if (slotUtilization < 0.3 && totalCalls > 0) {
        warnings.push(`Slot kullanım oranı düşük (%${Math.round(slotUtilization * 100)}). Daha fazla lead eklenebilir.`)
    }

    // ─── Maliyet tahmini ────────────────────────────────────
    const estimatedCost = (totalCalls * AVG_VAPI_COST_PER_CALL_USD)
        + (totalWa * AVG_WA_COST_PER_MSG_USD)
        + (totalSms * AVG_SMS_COST_PER_MSG_USD)

    return {
        estimated_total_calls: totalCalls,
        estimated_wa_messages: totalWa,
        estimated_sms_messages: totalSms,
        optimal_batch_size: optimalBatchSize,
        estimated_completion_minutes: totalMinutes,
        estimated_cost_usd: Math.round(estimatedCost * 100) / 100,
        calls_per_minute: Math.round(effectiveCallsPerMinute * 10) / 10,
        wa_per_minute: WA_BATCH_PER_CRON / cronIntervalMinutes,
        warnings,
        segment_size: segmentSize,
        max_concurrent_lines: maxConcurrentLines,
        working_hours_window_minutes: workingWindowMinutes,
        computed_at: new Date().toISOString(),
    }
}

// ─── Helper ─────────────────────────────────────────────────

function createEmptyResult(input: WorkflowSimulationInput, warnings: string[]): WorkflowComputedParams {
    warnings.push('Segment boş — akış başlatılacak kişi yok')
    return {
        estimated_total_calls: 0,
        estimated_wa_messages: 0,
        estimated_sms_messages: 0,
        optimal_batch_size: 0,
        estimated_completion_minutes: 0,
        estimated_cost_usd: 0,
        calls_per_minute: 0,
        wa_per_minute: 0,
        warnings,
        segment_size: 0,
        max_concurrent_lines: input.maxConcurrentLines,
        working_hours_window_minutes: (input.workingHoursEnd - input.workingHoursStart) * 60,
        computed_at: new Date().toISOString(),
    }
}
