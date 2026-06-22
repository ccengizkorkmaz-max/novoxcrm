// Workflow Auto-Tuning Simulator — pure utility (no 'use server')

// ─── Workflow Auto-Tuning Simulator ──────────────────────────
// Saf hesaplama fonksiyonu — DB bağımlılığı yok, test edilebilir.
// Workflow kaydedildiğinde veya başlatıldığında çağrılarak
// gerçekçi tahmini parametreleri hesaplar.

export interface WorkflowSimulationInput {
    segmentSize: number
    maxConcurrentLines: number
    steps: Array<{
        type: 'ai_call' | 'whatsapp' | 'sms' | 'wait' | 'condition' | 'ai_personalize' | 'status_update' | 'notify'
        retry?: { enabled?: boolean; max_attempts?: number; interval_minutes?: number }
        wait_minutes?: number
        config?: { duration_value?: number; duration_unit?: string }
    }>
    workingHoursStart: number   // 9
    workingHoursEnd: number     // 18
    cronIntervalMinutes: number // 1
    maxLeadsPerDay?: number     // günlük limit
}

export interface WorkflowComputedParams {
    // Hesaplanan metrikler
    estimated_total_calls: number
    estimated_wa_messages: number
    estimated_sms_messages: number
    optimal_batch_size: number
    estimated_completion_minutes: number
    estimated_completion_days: number
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

// ─── Gerçekçi Sabitler ───────────────────────────────────────

// Gerçek verilerden: 98 kişi arandı, %30 meşgul, %13 cevapsız, %5 konuşuldu
const BUSY_RATE = 0.30           // hat meşgul oranı
const NO_ANSWER_RATE = 0.35      // cevapsız oranı
const HUNG_UP_RATE = 0.15        // açıp hemen kapatan
const CONNECTED_RATE = 0.20      // gerçek konuşma yapılan

const AVG_CALL_DURATION_CONNECTED_SEC = 90   // konuşulursa ~90sn
const AVG_CALL_DURATION_NO_ANSWER_SEC = 30   // cevapsız ~30sn (çalma süresi)
const AVG_CALL_DURATION_BUSY_SEC = 10        // meşgul ~10sn

const INTER_CALL_DELAY_SEC = 3    // Vapi API araları arası gecikme
const WA_BATCH_PER_CRON = 20      // engine.ts MAX_WA_PER_BATCH

// Gerçek Vapi maliyeti: ortalama $0.08/arama (kısa aramalar ucuz, uzunlar pahalı)
const AVG_VAPI_COST_PER_CALL_USD = 0.08
const AVG_WA_COST_PER_MSG_USD = 0.00  // Meta şablon: ücretsiz (ilk 1000/ay)
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
        maxLeadsPerDay = 100,
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

    // ─── Ağırlıklı ortalama arama süresi ─────────────────────
    const avgCallDurationSec = 
        (BUSY_RATE * AVG_CALL_DURATION_BUSY_SEC) +
        (NO_ANSWER_RATE * AVG_CALL_DURATION_NO_ANSWER_SEC) +
        (HUNG_UP_RATE * AVG_CALL_DURATION_NO_ANSWER_SEC) +
        (CONNECTED_RATE * AVG_CALL_DURATION_CONNECTED_SEC)
    // ≈ 0.30*10 + 0.35*30 + 0.15*30 + 0.20*90 = 3 + 10.5 + 4.5 + 18 = 36sn

    // Hat başına dakikadaki arama: 60 / (36 + 3 delay) ≈ 1.5 arama/dk/hat
    const effectiveCallDuration = avgCallDurationSec + INTER_CALL_DELAY_SEC
    const callsPerMinutePerLine = 60 / effectiveCallDuration
    const effectiveCallsPerMinute = maxConcurrentLines * callsPerMinutePerLine

    // ─── Adım analizi ───────────────────────────────────────
    let totalCalls = 0
    let totalWa = 0
    let totalSms = 0
    let totalWaitMinutes = 0

    let currentPopulation = segmentSize

    for (const step of steps) {
        if (step.type === 'ai_call') {
            const retryEnabled = step.retry?.enabled !== false
            const maxAttempts = retryEnabled ? (step.retry?.max_attempts || 0) : 0
            const retryInterval = step.retry?.interval_minutes || 15

            // İlk arama: herkesi ara
            totalCalls += currentPopulation

            // Retry dalgaları
            // Cevapsız + meşgul oranı (retry edilecekler)
            const retryableRate = BUSY_RATE + NO_ANSWER_RATE // ~0.65
            let retryPool = Math.round(currentPopulation * retryableRate)

            for (let r = 0; r < maxAttempts; r++) {
                totalCalls += retryPool
                totalWaitMinutes += retryInterval
                // Her retry'da yine aynı oranda ulaşılamayanlar kalır
                retryPool = Math.round(retryPool * retryableRate)
            }

            // Sonraki adıma geçenler: tüm retry sonrası hâlâ ulaşılamayan
            currentPopulation = retryPool

        } else if (step.type === 'whatsapp') {
            totalWa += currentPopulation
            // WA sonrası herkes sonraki adıma geçer
        } else if (step.type === 'sms') {
            totalSms += currentPopulation
        } else if (step.type === 'wait') {
            const waitVal = step.config?.duration_value || step.wait_minutes || 0
            const waitUnit = step.config?.duration_unit || 'minutes'
            let waitMins = waitVal
            if (waitUnit === 'hours') waitMins = waitVal * 60
            else if (waitUnit === 'days') waitMins = waitVal * 24 * 60
            totalWaitMinutes += waitMins
        }
        // condition, ai_personalize, status_update, notify → anında
    }

    // ─── Zaman hesabı: gerçek çalışma saatleri ──────────────
    // Aramaların ne kadar süreceği (bekleme süreleri hariç)
    const pureCallMinutes = totalCalls > 0 ? Math.ceil(totalCalls / effectiveCallsPerMinute) : 0
    const waMinutes = totalWa > 0 ? Math.ceil(totalWa / WA_BATCH_PER_CRON) * cronIntervalMinutes : 0
    const smsMinutes = totalSms > 0 ? Math.ceil(totalSms / 50) * cronIntervalMinutes : 0

    // Günlük kapasite: çalışma saatleri × dakikada yapılan arama
    const callsPerDay = Math.min(
        maxLeadsPerDay,
        Math.floor(effectiveCallsPerMinute * workingWindowMinutes)
    )

    // Toplam gün hesabı
    let estimatedDays = 1
    if (callsPerDay > 0 && totalCalls > callsPerDay) {
        estimatedDays = Math.ceil(totalCalls / callsPerDay)
    }

    // Toplam süre: arama + WA + bekleme süreleri
    const totalActiveMinutes = pureCallMinutes + waMinutes + smsMinutes + totalWaitMinutes

    // ─── Optimal batch_size ────────────────────────────────
    const optimalBatchSize = Math.min(
        maxConcurrentLines * 2,
        segmentSize,
        maxLeadsPerDay
    )

    // ─── Uyarılar ──────────────────────────────────────────
    if (estimatedDays > 1) {
        warnings.push(
            `${segmentSize} kişi günlük ${maxLeadsPerDay} limit ile ~${estimatedDays} iş günü sürecek.`
        )
    }

    if (totalCalls > 500) {
        const costEstimate = totalCalls * AVG_VAPI_COST_PER_CALL_USD
        if (costEstimate > 50) {
            warnings.push(`Tahmini Vapi maliyeti: $${costEstimate.toFixed(0)} (${totalCalls} arama)`)
        }
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
        estimated_completion_minutes: totalActiveMinutes,
        estimated_completion_days: estimatedDays,
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
        estimated_completion_days: 0,
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
