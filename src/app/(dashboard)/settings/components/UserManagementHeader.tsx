'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UserPlus } from 'lucide-react'
import AddUserForm from './AddUserForm'

export default function UserManagementHeader() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Kullanıcı Yönetimi</CardTitle>
                <CardDescription>
                    Firmadaki tüm kullanıcıları görüntüleyin ve yeni kullanıcılar ekleyin.
                </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Yeni Kullanıcı Ekle
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                        <DialogDescription>
                            Kullanıcı hesabı hemen oluşturulacak ve giriş yapabilecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <AddUserForm onClose={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>
        </CardHeader>
    )
}
