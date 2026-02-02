import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        profile = data
    }

    const { data: slugs } = await supabase
        .from('profiles')
        .select('full_name, broker_slug, role')
        .is('broker_slug', 'not.null')

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Hata Ayıklama (Debug) Paneli</h1>

            <Card>
                <CardHeader><CardTitle>Oturum Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Email:</strong> {user?.email || 'Giriş yapılmadı'}</p>
                    <p><strong>Profil Rolü:</strong> {profile?.role || 'Profil bulunamadı'}</p>
                    <p><strong>Tenant ID:</strong> {profile?.tenant_id || 'Yok'}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Sistemdeki Aktif Broker Slugları</CardTitle></CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-1">
                        {slugs?.map((s, i) => (
                            <li key={i}>
                                <span className="font-bold">{s.broker_slug}</span> - {s.full_name} ({s.role})
                            </li>
                        )) || 'Slug bulunamadı'}
                    </ul>
                </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <p><strong>Not:</strong> Eğer "deneme-broker" listede yoksa, SQL Editor üzerinden profilinizi güncellemeniz gerekir.</p>
            </div>
        </div>
    )
}
