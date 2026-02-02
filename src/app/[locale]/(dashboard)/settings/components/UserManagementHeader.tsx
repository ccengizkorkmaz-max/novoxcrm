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
import { useTranslations } from 'next-intl'

export default function UserManagementHeader() {
    const t = useTranslations('Settings')
    const [isOpen, setIsOpen] = useState(false)

    return (
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('users.title')}</CardTitle>
                <CardDescription>
                    {t('users.description')}
                </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('users.add')}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('users.createTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('users.createDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <AddUserForm onClose={() => setIsOpen(false)} />
                </DialogContent>
            </Dialog>
        </CardHeader>
    )
}
