import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SaasAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Hardcoded Super Admin Check (Secure for MVP as requested)
    if (user.email !== 'ccengizkorkmaz@gmail.com') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Erişim Reddedildi</h1>
                <p className="text-muted-foreground">Bu paneli görüntüleme yetkiniz bulunmamaktadır.</p>
                <div className="mt-8 text-xs text-muted-foreground bg-muted p-4 rounded">
                    Current User: {user.email} <br />
                    Required: System Owner
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm">SUPER ADMIN</span>
                    SaaS Yönetimi
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">Hoş geldin, Sahip.</span>
                </div>
            </header>
            <main className="flex-1 p-6 bg-muted/10">
                {children}
            </main>
        </div>
    )
}
