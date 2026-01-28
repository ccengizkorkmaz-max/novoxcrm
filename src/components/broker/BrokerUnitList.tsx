'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import {
    Info,
    LayoutGrid,
    Home,
    Coins,
    Ruler,
    Wind,
    Car,
    Compass,
    CheckCircle2,
    PlusCircle,
    UtensilsCrossed,
    Bath
} from "lucide-react"
import Link from "next/link"

interface Unit {
    id: string
    unit_number: string
    block: string | null
    floor: number | null
    type: string | null
    price: number | null
    currency: string | null
    area_gross: number | null
    area_net: number | null
    heating_type: string | null
    parking_type: string | null
    direction: string | null
    kitchen_type: string | null
    has_builtin_kitchen: boolean | null
    has_master_bathroom: boolean | null
    room_areas: any | null
    status: string
    image_url: string | null
}

export function BrokerUnitList({ units, projectId }: { units: Unit[], projectId: string }) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

    const formatPrice = (price: number | null, currency: string | null) => {
        if (!price) return 'Fiyat Sorunuz'
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency || 'TRY',
            maximumFractionDigits: 0
        }).format(price)
    }

    return (
        <>
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10 px-4">Görsel</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10 px-4">No</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10">Blok/Kat</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10">Tip</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10">m² Brüt</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10 text-right pr-4">Fiyat</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-slate-400 h-10 text-center">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units && units.length > 0 ? (
                        units.map((unit) => (
                            <TableRow
                                key={unit.id}
                                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                onClick={() => setSelectedUnit(unit)}
                            >
                                <TableCell className="px-4">
                                    <div className="h-10 w-14 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                                        {unit.image_url ? (
                                            <img
                                                src={unit.image_url}
                                                alt={unit.unit_number}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                                                Yok
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-slate-900 border-l-4 border-l-green-500 px-4">
                                    {unit.unit_number}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600">
                                    {unit.block || '-'} / {unit.floor || '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-bold py-0 h-5">
                                        {unit.type || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-slate-600">
                                    {unit.area_gross ? `${unit.area_gross} m²` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-black text-slate-900 pr-4">
                                    {formatPrice(unit.price, unit.currency)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Info className="h-4 w-4 text-blue-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-40 text-center text-slate-400 italic text-sm">
                                Bu projede şu an satışta olan ünite bulunmuyor.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={!!selectedUnit} onOpenChange={(open) => !open && setSelectedUnit(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedUnit && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="bg-green-500">SATIŞTA</Badge>
                                    <div className="text-xs text-slate-400 font-medium font-mono uppercase">ID: {selectedUnit.id.slice(0, 8)}</div>
                                </div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                    {selectedUnit.unit_number} Nolu Bağımsız Bölüm
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    {selectedUnit.block && `${selectedUnit.block} Blok, `} {selectedUnit.floor && `${selectedUnit.floor}. Kat, `} {selectedUnit.type}
                                </DialogDescription>
                            </DialogHeader>

                            {selectedUnit.image_url && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                                    <img
                                        src={selectedUnit.image_url}
                                        alt={selectedUnit.unit_number}
                                        className="w-full aspect-video object-cover"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                {/* Left Column: Key Stats */}
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Satış Fiyatı</p>
                                        <h3 className="text-2xl font-black text-slate-900">
                                            {formatPrice(selectedUnit.price, selectedUnit.currency)}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                <Ruler className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold uppercase">Brüt Alan</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{selectedUnit.area_gross ? `${selectedUnit.area_gross} m²` : '-'}</p>
                                        </div>
                                        <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                <Ruler className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold uppercase">Net Alan</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{selectedUnit.area_net ? `${selectedUnit.area_net} m²` : '-'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4 text-blue-500" />
                                            Teknik Detaylar
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            <DetailItem icon={<Wind className="h-3.5 w-3.5" />} label="Isınma Tipi" value={selectedUnit.heating_type} />
                                            <DetailItem icon={<Car className="h-3.5 w-3.5" />} label="Otopark" value={selectedUnit.parking_type} />
                                            <DetailItem icon={<Compass className="h-3.5 w-3.5" />} label="Cephe" value={selectedUnit.direction} />
                                            <DetailItem icon={<UtensilsCrossed className="h-3.5 w-3.5" />} label="Mutfak" value={selectedUnit.kitchen_type} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Features & Areas */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Özellikler
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUnit.has_builtin_kitchen && (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                                    <UtensilsCrossed className="h-3 w-3 mr-1" /> Ankastre Set
                                                </Badge>
                                            )}
                                            {selectedUnit.has_master_bathroom && (
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                                    <Bath className="h-3 w-3 mr-1" /> Ebeveyn Banyosu
                                                </Badge>
                                            )}
                                            {!selectedUnit.has_builtin_kitchen && !selectedUnit.has_master_bathroom && (
                                                <span className="text-xs text-slate-400 italic">Belirtilen özellik yok.</span>
                                            )}
                                        </div>
                                    </div>

                                    {selectedUnit.room_areas && Array.isArray(selectedUnit.room_areas) && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                <Ruler className="h-4 w-4 text-blue-500" />
                                                Oda Detayları
                                            </h4>
                                            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                                <Table>
                                                    <TableBody>
                                                        {selectedUnit.room_areas.map((room: any, idx: number) => (
                                                            <TableRow key={idx} className="hover:bg-transparent border-slate-100">
                                                                <TableCell className="py-2 text-xs font-medium text-slate-600">{room.room}</TableCell>
                                                                <TableCell className="py-2 text-xs font-bold text-slate-900 text-right">{room.area} m²</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <Link href={`/broker/leads/new?project_id=${projectId}&unit_id=${selectedUnit.id}`} className="w-full">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 font-bold shadow-lg shadow-blue-200">
                                                <PlusCircle className="h-4 w-4" />
                                                Bu Ünite İçin Lead Oluştur
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2 text-slate-400">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <span className="text-xs font-bold text-slate-700">{value || '-'}</span>
        </div>
    )
}
