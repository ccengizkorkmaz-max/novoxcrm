'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface RoomArea {
    room: string
    area: number
}

interface RoomAreasInputProps {
    defaultValue?: RoomArea[]
    onValueChange?: (value: RoomArea[]) => void
}

export function RoomAreasInput({ defaultValue = [], onValueChange }: RoomAreasInputProps) {
    const [rooms, setRooms] = useState<RoomArea[]>(
        defaultValue.length > 0 ? defaultValue : [{ room: '', area: 0 }]
    )

    // Notify parent whenever rooms change
    useEffect(() => {
        const validRooms = rooms.filter(r => r.room && r.area > 0)
        onValueChange?.(validRooms)
    }, [rooms, onValueChange])

    const addRoom = () => {
        setRooms(prev => [...prev, { room: '', area: 0 }])
    }

    const removeRoom = (index: number) => {
        setRooms(prev => prev.filter((_, i) => i !== index))
    }

    const updateRoom = (index: number, field: 'room' | 'area', value: string | number) => {
        setRooms(prev => {
            const newRooms = [...prev]
            newRooms[index] = { ...newRooms[index], [field]: value }
            return newRooms
        })
    }

    return (
        <div className="space-y-3">
            <input
                type="hidden"
                name="room_areas"
                value={JSON.stringify(rooms.filter(r => r.room && r.area > 0))}
            />

            {rooms.map((room, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                        <Input
                            placeholder="Oda adı (Salon, Mutfak, vb.)"
                            value={room.room}
                            onChange={(e) => updateRoom(index, 'room', e.target.value)}
                        />
                    </div>
                    <div className="col-span-4">
                        <Input
                            type="number"
                            placeholder="m²"
                            value={room.area || ''} // Handle 0 as empty string if preferred, or keep 0
                            onChange={(e) => updateRoom(index, 'area', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="col-span-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRoom(index)}
                            disabled={rooms.length === 1}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRoom}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Oda Ekle
            </Button>

            {rooms.filter(r => r.room && r.area > 0).length > 0 && (
                <div className="text-xs text-muted-foreground">
                    Toplam: {rooms.reduce((sum, r) => sum + (r.area || 0), 0).toFixed(2)} m²
                </div>
            )}
        </div>
    )
}
