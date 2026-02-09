
'use client'

import { useState } from 'react'
import { runRepair } from './actions'
import { markUnitAsLegacy } from './mark-legacy-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


export default function RepairPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [unitId, setUnitId] = useState('')
    const [legacyLoading, setLegacyLoading] = useState(false)

    const handleRepair = async () => {
        setLoading(true)
        setLogs(prev => [...prev, 'Starting repair process...'])
        try {
            const result = await runRepair()
            setLogs(prev => [...prev, ...result.logs])
            if (result.success) {
                setLogs(prev => [...prev, '✅ Repair completed successfully.'])
            } else {
                setLogs(prev => [...prev, '❌ Repair failed: ' + result.error])
            }
        } catch (e: any) {
            setLogs(prev => [...prev, '❌ Error: ' + e.message])
        } finally {
            setLoading(false)
        }
    }

    const handleMarkLegacy = async () => {
        if (!unitId.trim()) {
            setLogs(prev => [...prev, '❌ Please enter a unit ID'])
            return
        }
        setLegacyLoading(true)
        setLogs(prev => [...prev, `Starting legacy marking for unit ${unitId}...`])
        try {
            const result = await markUnitAsLegacy(unitId.trim())
            setLogs(prev => [...prev, ...result.logs])
            if (result.success) {
                setLogs(prev => [...prev, '✅ Legacy marking completed successfully.'])
                setUnitId('')
            } else {
                setLogs(prev => [...prev, '❌ Legacy marking failed: ' + result.error])
            }
        } catch (e: any) {
            setLogs(prev => [...prev, '❌ Error: ' + e.message])
        } finally {
            setLegacyLoading(false)
        }
    }

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Contract Repair Tool</h1>
            <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                    This tool will attempt to force-fix contract <strong>SZL-20260206-841</strong>.
                    It will reset the unit to 'For Sale', cancel all payment plans, and delete bad financial records.
                </p>
                <Button onClick={handleRepair} disabled={loading} size="lg" className="w-full">
                    {loading ? 'Running Repair...' : 'Run Repair Logic'}
                </Button>
            </div>

            <div className="mb-6 border-t pt-6">
                <h2 className="text-xl font-bold mb-2">Mark Unit as Legacy</h2>
                <p className="text-muted-foreground mb-4">
                    Mark a unit as legacy (is_legacy = true) to exclude it from dashboard statistics.
                    Enter the unit ID below:
                </p>
                <div className="flex gap-2">
                    <Input
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        placeholder="Unit ID (e.g., 8eb7ae59-ce35-459c-bd0a-ab2303c11eff)"
                        className="flex-1"
                    />
                    <Button onClick={handleMarkLegacy} disabled={legacyLoading || !unitId.trim()} size="lg">
                        {legacyLoading ? 'Marking...' : 'Mark as Legacy'}
                    </Button>
                </div>
            </div>

            <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-xs h-96 overflow-auto border border-slate-800">
                {logs.length === 0 ? (
                    <span className="text-slate-600">// Logs will appear here...</span>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-slate-900/50 pb-1">{log}</div>
                    ))
                )}
            </div>
        </div>
    )
}
