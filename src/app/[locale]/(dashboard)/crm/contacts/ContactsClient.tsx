'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Phone, Mail, User } from 'lucide-react'

export function ContactsClient({ contacts, locale }: { contacts: any[], locale: string }) {
    const [search, setSearch] = useState('')

    const filteredContacts = contacts.filter(c => {
        const term = search.toLowerCase()
        return (c.full_name && c.full_name.toLowerCase().includes(term)) ||
               (c.phone && c.phone.includes(term)) ||
               (c.email && c.email.toLowerCase().includes(term))
    })

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4">
                <CardTitle className="text-xl">Rehber</CardTitle>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="İsim, telefon veya e-posta ara..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">Ad Soyad</th>
                                <th className="px-4 py-3 font-medium">İletişim</th>
                                <th className="px-4 py-3 font-medium">Kaynak</th>
                                <th className="px-4 py-3 font-medium">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredContacts.length > 0 ? filteredContacts.map(contact => (
                                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-slate-900">{contact.full_name || 'İsimsiz'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 space-y-1">
                                        {contact.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Phone className="h-3 w-3" />
                                                <span className="text-xs">{contact.phone}</span>
                                            </div>
                                        )}
                                        {contact.email && (
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <Mail className="h-3 w-3" />
                                                <span className="text-xs">{contact.email}</span>
                                            </div>
                                        )}
                                        {!contact.phone && !contact.email && (
                                            <span className="text-xs text-muted-foreground">Belirtilmedi</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {contact.source === 'Inbox' ? 'Gelen Kutusu' :
                                             contact.source === 'PreEval' ? 'Ön Değerlendirme' : 
                                             contact.source === 'Customer' ? 'Müşteri Kaydı' : contact.source}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {contact.isCustomer ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
                                                Müşteri
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                                                Kontak
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        Arama kriterlerine uygun kontak bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
