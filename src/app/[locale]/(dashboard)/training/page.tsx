import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllCourses, getUserProgress, getUserCertificates } from './actions'
import { TrainingDashboard } from './components/TrainingDashboard'

export default async function TrainingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isManager = ['admin', 'owner'].includes(profile?.role || '')

    const courses = await getAllCourses()
    const progress = await getUserProgress(user.id)
    const certificates = await getUserCertificates(user.id)

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Eğitim Merkezi</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gayrimenkul danışmanlığı eğitimleri, sertifika programları ve quiz'ler.
                </p>
            </div>
            <TrainingDashboard
                courses={courses}
                progress={progress}
                certificates={certificates}
                isManager={isManager}
            />
        </div>
    )
}
