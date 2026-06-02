'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSystemHealth, resetOutreachSystem } from '../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity, AlertTriangle, CheckCircle2, Lock, Phone,
    RefreshCw, Trash2, Unlock, RotateCcw, Clock, Zap,
    ShieldCheck, ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'

interface HealthData {
    stuckCallsTotal: number
    stuckCallsOld: number
    ghostFailed: number
    queueLock: string | null
    queueLockAge: number
    isLockStuck: boolean
    waitingExecs: number
    overdueExecs: number
    hasIssues: boolean
    checkedAt: string
    error?: string
}

export function SystemHealthPanel() {
    const [health, setHealth] = useState<HealthData | null>(null)
    const [loading, setLoading] = useState(false)
    const [resetting, setResetting] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const fetchHealth = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSystemHealth()
            if ('error' in data && typeof data.error === 'string') {
                toast.error(data.error)
                return
            }
            setHealth(data as HealthData)
            // Auto-expand if there are issues
            if ((data as HealthData).hasIssues) setExpanded(true)
        } catch (e: any) {
            toast.error('Sistem durumu alınamadı')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchHealth()
        const interval = setInterval(fetchHealth, 30000) // 30 saniyede bir güncelle
        return () => clearInterval(interval)
    }, [fetchHealth])

    const handleReset = async (options: { clearStuckCalls?: boolean; releaseLock?: boolean; resetWaiting?: boolean }) => {
        setResetting(true)
        try {
            const result = await resetOutreachSystem(options)
            if ('error' in result) {
                toast.error(result.error as string)
            } else {
                result.results?.forEach((msg: string) => toast.success(msg))
                await fetchHealth()
            }
        } catch (e: any) {
            toast.error('Reset işlemi başarısız: ' + e.message)
        } finally {
            setResetting(false)
        }
    }

    const handleFullReset = async () => {
        setResetting(true)
        try {
            const result = await resetOutreachSystem({
                clearStuckCalls: true,
                releaseLock: true,
                resetWaiting: true,
            })
            if ('error' in result) {
                toast.error(result.error as string)
            } else {
                toast.success('Sistem tamamen resetlendi')
                result.results?.forEach((msg: string) => toast.info(msg))
                await fetchHealth()
            }
        } catch (e: any) {
            toast.error('Reset başarısız: ' + e.message)
        } finally {
            setResetting(false)
        }
    }

    if (!health) {
        return (
            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sistem durumu kontrol ediliyor...
                </div>
            </div>
        )
    }

    // Only real problems trigger the warning: stuck calls (>15min), stuck locks (>3min), ghost records
    // Active calls and locked queue during normal processing are NOT issues
    const isHealthy = !health.hasIssues

    return (
        <div className={`rounded-xl border transition-all duration-300 ${
            isHealthy
                ? 'border-emerald-500/20 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5'
        }`}>
            {/* Header - Always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors rounded-xl"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isHealthy ? 'bg-emerald-500/15' : 'bg-red-500/15 animate-pulse'}`}>
                        {isHealthy
                            ? <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            : <ShieldAlert className="h-5 w-5 text-red-500" />
                        }
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-sm flex items-center gap-2">
                            Sistem Sağlığı
                            <Badge variant="outline" className={`text-[10px] ${isHealthy ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'}`}>
                                {isHealthy ? 'Sağlıklı' : 'Sorun Var'}
                            </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {health.stuckCallsTotal > 0 && `${health.stuckCallsTotal} aktif arama · `}
                            {health.waitingExecs > 0 && `${health.waitingExecs} webhook bekliyor · `}
                            Son kontrol: {new Date(health.checkedAt).toLocaleTimeString('tr-TR')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost" size="icon"
                        onClick={(e) => { e.stopPropagation(); fetchHealth() }}
                        disabled={loading}
                        className="h-8 w-8"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-border/30 p-4 space-y-4">
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatusCard
                            icon={Phone}
                            label="Aktif Arama"
                            value={health.stuckCallsTotal}
                            sub={health.stuckCallsOld > 0 ? `⚠️ ${health.stuckCallsOld} takılı (>15dk)` : health.stuckCallsTotal > 0 ? 'Devam ediyor' : 'Arama yok'}
                            status={health.stuckCallsOld > 0 ? 'danger' : health.stuckCallsTotal > 0 ? 'active' : 'ok'}
                        />
                        <StatusCard
                            icon={Lock}
                            label="Kuyruk Kilidi"
                            value={health.isLockStuck ? 'Takılı!' : health.queueLock ? 'Kilitli' : 'Açık'}
                            sub={health.isLockStuck ? `⚠️ ${Math.round(health.queueLockAge / 1000)}sn takılı` : health.queueLock ? `${Math.round(health.queueLockAge / 1000)}sn · İşleniyor` : 'Serbest'}
                            status={health.isLockStuck ? 'danger' : health.queueLock ? 'active' : 'ok'}
                        />
                        <StatusCard
                            icon={Clock}
                            label="Bekleyen (Waiting)"
                            value={health.waitingExecs}
                            sub={health.waitingExecs > 20 ? '⚠️ Çok fazla bekleyen' : health.waitingExecs > 0 ? 'Webhook bekliyor' : 'Bekleyen yok'}
                            status={health.waitingExecs > 20 ? 'danger' : health.waitingExecs > 0 ? 'active' : 'ok'}
                        />
                        <StatusCard
                            icon={AlertTriangle}
                            label="Hayalet Kayıt"
                            value={health.ghostFailed}
                            sub="Failed ama kapanmamış"
                            status={health.ghostFailed > 0 ? 'danger' : 'ok'}
                        />
                    </div>

                    {/* Action Buttons */}
                    {health.hasIssues ? (
                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleFullReset}
                                disabled={resetting}
                                className="gap-1.5 text-xs"
                            >
                                <Zap className="h-3.5 w-3.5" />
                                {resetting ? 'Resetleniyor...' : 'Tümünü Resetle'}
                            </Button>

                            {health.stuckCallsOld > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReset({ clearStuckCalls: true })}
                                    disabled={resetting}
                                    className="gap-1.5 text-xs border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Takılı Aramaları Temizle ({health.stuckCallsOld})
                                </Button>
                            )}

                            {health.isLockStuck && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReset({ releaseLock: true })}
                                    disabled={resetting}
                                    className="gap-1.5 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                >
                                    <Unlock className="h-3.5 w-3.5" />
                                    Kilidi Aç
                                </Button>
                            )}

                            {health.waitingExecs > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReset({ resetWaiting: true })}
                                    disabled={resetting}
                                    className="gap-1.5 text-xs border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Bekleyenleri Resetle ({health.waitingExecs})
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-500 text-sm pt-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Tüm sistemler sağlıklı çalışıyor
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function StatusCard({ icon: Icon, label, value, sub, status }: {
    icon: any
    label: string
    value: string | number
    sub: string
    status: 'ok' | 'warning' | 'danger' | 'active'
}) {
    const colors = {
        ok: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        danger: 'text-red-500 bg-red-500/10 border-red-500/20',
        active: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    }

    return (
        <div className={`rounded-lg border p-3 ${colors[status]}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 opacity-70" />
                <span className="text-[11px] font-medium opacity-80">{label}</span>
            </div>
            <div className="text-lg font-bold">{value}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>
        </div>
    )
}
