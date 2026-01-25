import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-10">User not logged in. Error: {authError?.message}</div>
    }

    // 1. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Check Tenant
    let tenant = null
    let tenantError = null
    if (profile?.tenant_id) {
        const res = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()
        tenant = res.data
        tenantError = res.error
    }

    // 3. Test Insert Permission (Simulated)
    // We can't easily simulate a transaction here, but we can try to Select from projects to see if RLS works for select at least.
    const { data: projects, error: projectsError } = await supabase.from('projects').select('id').limit(1)

    return (
        <div className="p-10 max-w-3xl mx-auto font-mono text-sm space-y-6">
            <h1 className="text-2xl font-bold border-b pb-2">System Debug Tools</h1>

            <section className="space-y-2">
                <h2 className="text-lg font-bold text-blue-600">1. Authentication</h2>
                <div className="bg-slate-100 p-4 rounded">
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.id}</p>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-bold text-blue-600">2. Profile & Tenant Connection</h2>
                <div className={`p-4 rounded ${profile ? 'bg-green-100' : 'bg-red-100'}`}>
                    {profile ? (
                        <>
                            <p><strong>Profile Found:</strong> Yes</p>
                            <p><strong>Role:</strong> {profile.role}</p>
                            <p><strong>Tenant ID:</strong> {profile.tenant_id || '<NULL>'}</p>
                            {profileError && <p className="text-red-600">Profile Error: {JSON.stringify(profileError)}</p>}
                        </>
                    ) : (
                        <p className="text-red-700 font-bold">PROFILE MISSING! The user exists in Auth but has no entry in public.profiles table.</p>
                    )}
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-bold text-blue-600">3. Tenant Details</h2>
                <div className={`p-4 rounded ${tenant ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tenant ? (
                        <>
                            <p><strong>Tenant Name:</strong> {tenant.name}</p>
                            <p><strong>Tenant ID:</strong> {tenant.id}</p>
                        </>
                    ) : (
                        <p className="text-red-700">TENANT NOT FOUND or Invalid ID. {JSON.stringify(tenantError)}</p>
                    )}
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-lg font-bold text-blue-600">4. Database Permissions (RLS)</h2>
                <div className={`p-4 rounded ${!projectsError ? 'bg-green-100' : 'bg-red-100'}`}>
                    {projectsError ? (
                        <p className="text-red-700">
                            <strong>READ PERMISSION FAILED:</strong> {JSON.stringify(projectsError)}
                            <br />
                            This means RLS policies are blocking you from even seeing projects.
                        </p>
                    ) : (
                        <p><strong>READ Permission:</strong> ✅ OK (Can read projects table)</p>
                    )}
                </div>
            </section>

            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded text-slate-700">
                <strong>Diagnosis:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                    {!profile && <li>Run <code>fix_and_debug_user.sql</code> again. The profile is missing.</li>}
                    {profile && !profile.tenant_id && <li>Profile exists but has no Tenant. Run <code>fix_and_debug_user.sql</code>.</li>}
                    {projectsError && <li>RLS Policies are broken. Run <code>fix_rls_policies.sql</code>.</li>}
                    {profile && tenant && !projectsError && <li>Everything looks correct here. If you still can't create a project, check the Terminal for "Insert Project Error".</li>}
                </ul>
            </div>
        </div>
    )
}
