'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Users, ArrowRight } from 'lucide-react'
import { getDuplicateCustomerGroups, mergeDuplicateGroup } from '../actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function MergeDuplicatesDialog({ open, onClose }: { open: boolean, onClose: () => void }) {
    const [groups, setGroups] = useState<any[][]>([])
    const [loading, setLoading] = useState(false)
    const [mergingIdx, setMergingIdx] = useState<number | null>(null)

    useEffect(() => {
        if (open) {
            fetchDuplicates()
        }
    }, [open])

    const fetchDuplicates = async () => {
        setLoading(true)
        const res = await getDuplicateCustomerGroups()
        if (res.groups) {
            setGroups(res.groups as any[][])
        }
        setLoading(false)
    }

    const handleMerge = async (index: number) => {
        setMergingIdx(index)
        const group = groups[index]
        // Sort ascending by creation date so oldest customer is kept
        const sorted = [...group].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        const masterId = sorted[0].id
        const duplicates = sorted.slice(1).map(c => c.id)

        const res = await mergeDuplicateGroup(masterId, duplicates)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Kayıtlar başarıyla tek bir müşteride (Ana Kayıt) birleştirildi.')
            setGroups(prev => prev.filter((_, i) => i !== index))
        }
        setMergingIdx(null)
    }

    const handleMergeAll = async () => {
        for (let i = 0; i < groups.length; i++) {
            await handleMerge(i)
        }
        toast.success('Tüm mükerrer kayıt grupları birleştirildi!')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> 
                        Mükerrer Müşteri Kayıtlarını Temizle
                    </DialogTitle>
                    <DialogDescription>
                        Aynı isim ve telefon numarasıyla açılmış mükerrer kayıtları tespit eder. Birleştirdiğinizde, tüm satış/fırsat kayıtları tek bir ana müşteri kartına aktarılır ve fazlalık olan kartlar silinir.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-70">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
                        <span className="text-sm font-medium">Kayıtlar taranıyor...</span>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100">
                        <Badge variant="outline" className="mb-2 bg-emerald-50 text-emerald-600 border-emerald-200">Harika!</Badge>
                        <p className="text-sm text-slate-500">Sistemde aynı isim ve telefona sahip mükerrer müşteri bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-slate-700">Bulunan Mükerrer Gruplar: {groups.length}</span>
                            <Button size="sm" onClick={handleMergeAll} disabled={mergingIdx !== null} className="bg-blue-600 hover:bg-blue-700">
                                {mergingIdx !== null ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                                Tümünü Otomatik Birleştir
                            </Button>
                        </div>

                        {groups.map((group, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{group[0].full_name}</span>
                                        <span className="text-xs text-muted-foreground font-mono bg-white px-2 py-0.5 rounded border">{group[0].phone}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100">{group.length} Adet Kayıt</Badge>
                                </div>
                                <div className="flex flex-col gap-2 relative">
                                    {group.map((c, i) => (
                                        <div key={c.id} className="flex justify-between items-center bg-white p-2 rounded border text-xs relative z-10">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-700">{i === 0 ? '👑' : '📎'} Müşteri ID:</span>
                                                    <span className="font-mono text-slate-500">{c.id.slice(0, 8)}...</span>
                                                </div>
                                                <span className="text-muted-foreground">Oluşturulma: {new Date(c.created_at).toLocaleString('tr-TR')}</span>
                                            </div>
                                            {i === 0 && (
                                                <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 font-bold border border-blue-100 text-[10px] uppercase">
                                                    Ana Kayıt Olacak
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {/* Connection Line Visual */}
                                    <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-300 z-0 border-dashed" />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                        onClick={() => handleMerge(idx)}
                                        disabled={mergingIdx !== null}
                                    >
                                        {mergingIdx === idx ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <ArrowRight className="w-3 h-3 mr-2"/>}
                                        Bu Grubu Birleştir ({group.length - 1} kopya silinip taşınacak)
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
