"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    items: { value: string; label: string }[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
}

export function Combobox({
    items,
    value,
    onChange,
    placeholder = "Seçiniz...",
    searchPlaceholder = "Ara...",
    emptyText = "Sonuç bulunamadı.",
    disabled = false
}: ComboboxProps) {

    const [open, setOpen] = React.useState(false)

    // Find the selected item's label to display
    const selectedLabel = React.useMemo(() => {
        return items?.find((item) => item.value === value)?.label
    }, [items, value])

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild disabled={disabled}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedLabel || <span className="text-muted-foreground">{placeholder}</span>}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {value && (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    onChange("")
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.stopPropagation()
                                        e.preventDefault()
                                        onChange("")
                                    }
                                }}
                                className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                title="Seçimi Temizle"
                            >
                                <X className="h-3.5 w-3.5" />
                            </span>
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        {value && (
                            <CommandGroup>
                                <CommandItem
                                    value=""
                                    onSelect={() => {
                                        onChange("")
                                        setOpen(false)
                                    }}
                                    onPointerUp={() => {
                                        onChange("")
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer text-rose-600 font-semibold hover:text-rose-700 hover:bg-rose-50 flex items-center"
                                >
                                    <X className="mr-2 h-4 w-4 shrink-0 text-rose-500" />
                                    Seçimi Temizle
                                </CommandItem>
                            </CommandGroup>
                        )}
                        <CommandGroup>
                            {items?.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    value={item.label} // Use label for searching because cmdk fuzzy search logic
                                    onSelect={() => {
                                        onChange(item.value)
                                        setOpen(false)
                                    }}
                                    onPointerUp={() => {
                                        onChange(item.value)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
