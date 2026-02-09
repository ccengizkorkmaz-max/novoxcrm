'use client'

import { useState } from 'react'
import { checkSoldUnits } from '../check-sold-units'
import { Button } from '@/components/ui/button'

export default function CheckSoldUnitsPage() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const handleCheck = async () => {
        setLoading(true)
        try {
            const data = await checkSoldUnits()
            setResult(data)
        } catch (e: any) {
            setResult({ error: e.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Satılan Ünite Kontrolü</h1>
            <Button onClick={handleCheck} disabled={loading} size="lg" className="mb-6">
                {loading ? 'Kontrol Ediliyor...' : 'Satılan Üniteleri Kontrol Et'}
            </Button>

            {result && (
                <div className="space-y-6">
                    <div className="bg-slate-950 text-green-400 p-6 rounded-lg font-mono text-sm border border-slate-800">
                        <h2 className="text-white font-bold mb-4">Sonuçlar:</h2>

                        <div className="mb-4">
                            <p className="text-blue-400 font-bold">Toplam "Sold" Durumundaki Ünite Sayısı: {result.soldCount}</p>
                        </div>

                        {result.soldUnits && result.soldUnits.length > 0 && (
                            <div className="mb-6">
                                <p className="text-yellow-400 font-bold mb-2">"Sold" Durumundaki Üniteler:</p>
                                {result.soldUnits.map((unit: any, i: number) => (
                                    <div key={i} className="ml-4 mb-2 border-l-2 border-slate-700 pl-3">
                                        <p>ID: {unit.id}</p>
                                        <p>Ünite: {unit.block} - {unit.unit_number}</p>
                                        <p>Proje: {unit.projects?.name}</p>
                                        <p>Durum: <span className="text-red-400">{unit.status}</span></p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mb-6 border-t border-slate-800 pt-4">
                            <p className="text-purple-400 font-bold mb-2">İptal Edilen Sözleşmedeki Ünite (8eb7ae59...):</p>
                            {result.cancelledUnit && (
                                <div className="ml-4 border-l-2 border-slate-700 pl-3">
                                    <p>ID: {result.cancelledUnit.id}</p>
                                    <p>Ünite: {result.cancelledUnit.block} - {result.cancelledUnit.unit_number}</p>
                                    <p>Proje: {result.cancelledUnit.projects?.name}</p>
                                    <p>Durum: <span className={result.cancelledUnit.status === 'For Sale' ? 'text-green-400' : 'text-red-400'}>
                                        {result.cancelledUnit.status}
                                    </span></p>
                                </div>
                            )}
                        </div>

                        {result.contractsForCancelledUnit && result.contractsForCancelledUnit.length > 0 && (
                            <div className="border-t border-slate-800 pt-4">
                                <p className="text-cyan-400 font-bold mb-2">Bu Üniteye Ait Sözleşmeler:</p>
                                {result.contractsForCancelledUnit.map((contract: any, i: number) => (
                                    <div key={i} className="ml-4 mb-2">
                                        <p>Sözleşme No: {contract.contract_number}</p>
                                        <p>Durum: <span className={contract.status === 'Cancelled' ? 'text-green-400' : 'text-red-400'}>
                                            {contract.status}
                                        </span></p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {result.error && (
                            <p className="text-red-400">Hata: {result.error}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
