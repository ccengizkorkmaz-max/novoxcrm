'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Loader2, Link as LinkIcon, Lock, Search, CheckSquare, Square, MinusSquare } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createPublicInventoryLink } from '../actions'
import { formatCurrency } from '@/lib/utils'

import { useParams } from 'next/navigation'
import { useRef } from 'react'

interface UnitItem {
    id: string
    unit_number: string
    type: string
    price: number
    currency: string
    floor?: number
    area_gross?: number
    status: string
    block?: string
    projects?: { name: string } | null
}

interface PublicLinkCreatorProps {
    units: UnitItem[]
}

export function PublicLinkCreator({ units }: PublicLinkCreatorProps) {
    const { locale } = useParams()
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [password, setPassword] = useState('')
    const [expiryDays, setExpiryDays] = useState(7)
    const [loading, setLoading] = useState(false)
    const [createdSlug, setCreatedSlug] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Unit selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')

    // Filter units by search
    const filteredUnits = useMemo(() => {
        if (!searchTerm.trim()) return units
        const term = searchTerm.toLowerCase()
        return units.filter(u =>
            u.unit_number.toLowerCase().includes(term) ||
            u.type.toLowerCase().includes(term) ||
            (u.block && u.block.toLowerCase().includes(term)) ||
            (u.projects?.name && u.projects.name.toLowerCase().includes(term))
        )
    }, [units, searchTerm])

    // Selection helpers
    const allFilteredSelected = filteredUnits.length > 0 && filteredUnits.every(u => selectedIds.has(u.id))
    const someFilteredSelected = filteredUnits.some(u => selectedIds.has(u.id))

    const toggleUnit = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAllFiltered = () => {
        if (allFilteredSelected) {
            // Deselect all filtered
            setSelectedIds(prev => {
                const next = new Set(prev)
                filteredUnits.forEach(u => next.delete(u.id))
                return next
            })
        } else {
            // Select all filtered
            setSelectedIds(prev => {
                const next = new Set(prev)
                filteredUnits.forEach(u => next.add(u.id))
                return next
            })
        }
    }

    const selectAll = () => {
        setSelectedIds(new Set(units.map(u => u.id)))
    }

    const deselectAll = () => {
        setSelectedIds(new Set())
    }

    const handleCreate = async () => {
        if (selectedIds.size === 0) {
            toast.error('Lütfen en az 1 ünite seçiniz.')
            return
        }

        setLoading(true)
        const result = await createPublicInventoryLink(
            title || 'Fiyat Listesi ve Katalog',
            Array.from(selectedIds),
            expiryDays,
            password
        )
        setLoading(false)

        if (result.success && result.slug) {
            setCreatedSlug(result.slug)
            toast.success('Paylaşım linki oluşturuldu.')
        } else {
            toast.error(result.error || 'Link oluşturulamadı.')
        }
    }
    const shareUrl = createdSlug ? `${window.location.origin}/${locale}/p/${createdSlug}` : ''

    const copyToClipboard = () => {
        if (!shareUrl) return

        if (inputRef.current) {
            inputRef.current.select()
            inputRef.current.setSelectionRange(0, 99999)
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    handleCopySuccess()
                })
                .catch(err => {
                    console.error('Clipboard API failed', err)
                    performFallbackCopy()
                })
        } else {
            performFallbackCopy()
        }
    }

    const handleCopySuccess = () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Link kopyalandı.')
    }

    const performFallbackCopy = () => {
        try {
            const successful = document.execCommand('copy')
            if (successful) {
                handleCopySuccess()
            } else {
                const textArea = document.createElement("textarea")
                textArea.value = shareUrl
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                const secondTry = document.execCommand('copy')
                document.body.removeChild(textArea)

                if (secondTry) handleCopySuccess()
                else throw new Error('Copy failed')
            }
        } catch (err) {
            console.error('Copy failed', err)
            toast.error('Kopyalanamadı. Lütfen linke sağ tıklayıp kopyalayın.')
        }
    }

    // Status color helper
    const getStatusDot = (status: string) => {
        const s = status.toLowerCase()
        if (s.includes('sale') || s.includes('satılık') || s.includes('stokta')) return 'bg-emerald-500'
        if (s.includes('reserved') || s.includes('rezerve') || s.includes('kapora')) return 'bg-amber-500'
        if (s.includes('sold') || s.includes('satıldı')) return 'bg-rose-500'
        return 'bg-slate-400'
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                setCreatedSlug(null)
                setTitle('')
                setPassword('')
                setSearchTerm('')
            } else {
                // When opening, default to all units selected
                setSelectedIds(new Set(units.map(u => u.id)))
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1.5 border-amber-200 hover:bg-amber-50 text-amber-700 font-bold"
                >
                    <Share2 className="h-3 w-3" />
                    Müşteriyle Paylaş
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-amber-600" />
                        Kamuya Açık Katalog Oluştur
                    </DialogTitle>
                </DialogHeader>

                {!createdSlug ? (
                    <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
                        {/* Title & Settings Row */}
                        <div className="grid gap-3 flex-shrink-0">
                            <div className="grid gap-1.5">
                                <Label htmlFor="title" className="text-xs">Liste Başlığı</Label>
                                <Input
                                    id="title"
                                    placeholder="Örn: Novo Park Vista Özel Fiyat Listesi"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="expiry" className="text-xs">Geçerlilik Süresi (Gün)</Label>
                                    <Input
                                        id="expiry"
                                        type="number"
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                        className="h-9 text-sm"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="pass" className="text-xs flex items-center gap-1">
                                        <Lock className="h-3 w-3" /> Şifre (Opsiyonel)
                                    </Label>
                                    <Input
                                        id="pass"
                                        type="password"
                                        placeholder="Gizli liste için..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Unit Selection Section */}
                        <div className="border rounded-lg flex flex-col flex-1 overflow-hidden min-h-0">
                            {/* Selection Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-700">Ünite Seçimi</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                                        {selectedIds.size} / {units.length} seçili
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={selectAll}
                                    >
                                        Tümünü Seç
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-slate-500 hover:text-slate-700"
                                        onClick={deselectAll}
                                    >
                                        Temizle
                                    </Button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="px-3 py-2 border-b flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Ünite no, tip, blok veya proje ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-8 text-xs pl-8 border-none bg-slate-50 focus-visible:ring-1 focus-visible:ring-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Select All Filtered Toggle */}
                            <div
                                className="flex items-center gap-3 px-3 py-1.5 border-b bg-white cursor-pointer hover:bg-slate-50 transition-colors flex-shrink-0"
                                onClick={toggleAllFiltered}
                            >
                                {allFilteredSelected ? (
                                    <CheckSquare className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                ) : someFilteredSelected ? (
                                    <MinusSquare className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                ) : (
                                    <Square className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                )}
                                <span className="text-[11px] font-semibold text-slate-600">
                                    {searchTerm.trim()
                                        ? `Aranan ${filteredUnits.length} üniteyi seç/kaldır`
                                        : `Tüm ${filteredUnits.length} üniteyi seç/kaldır`
                                    }
                                </span>
                            </div>

                            {/* Scrollable Unit List */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                {filteredUnits.length > 0 ? (
                                    filteredUnits.map((unit) => {
                                        const isSelected = selectedIds.has(unit.id)
                                        return (
                                            <div
                                                key={unit.id}
                                                className={`flex items-center gap-3 px-3 py-2 border-b border-slate-50 cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-amber-50/50 hover:bg-amber-50'
                                                        : 'hover:bg-slate-50'
                                                }`}
                                                onClick={() => toggleUnit(unit.id)}
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                                )}

                                                <div className="flex items-center justify-between w-full min-w-0 gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(unit.status)}`} />
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                            {unit.unit_number}
                                                        </span>
                                                        {unit.projects?.name && (
                                                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                                                {unit.projects.name}
                                                            </span>
                                                        )}
                                                        {unit.block && (
                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200 text-slate-400 flex-shrink-0">
                                                                {unit.block}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className="text-[10px] text-slate-500">{unit.type}</span>
                                                        {unit.area_gross && (
                                                            <span className="text-[10px] text-slate-400">{unit.area_gross}m²</span>
                                                        )}
                                                        <span className="text-xs font-bold text-slate-700 tabular-nums">
                                                            {formatCurrency(unit.price, unit.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                                        Aramanızla eşleşen ünite bulunamadı.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4 text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <Check className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-900">Linkiniz Hazır!</h3>
                            <p className="text-xs text-slate-500">Bu linki kopyalayıp müşterinize WhatsApp veya e-posta ile iletebilirsiniz.</p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                            <Input
                                ref={inputRef}
                                value={shareUrl}
                                readOnly
                                onClick={copyToClipboard}
                                className="border-none bg-transparent h-8 text-xs focus-visible:ring-0 cursor-pointer"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-shrink-0">
                    {!createdSlug ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Vazgeç</Button>
                            <Button onClick={handleCreate} disabled={loading || selectedIds.size === 0} className="bg-amber-600 hover:bg-amber-700">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                                {selectedIds.size > 0 ? `${selectedIds.size} Ünite Paylaş` : 'Ünite Seçiniz'}
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full" onClick={() => setOpen(false)}>Kapat</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
