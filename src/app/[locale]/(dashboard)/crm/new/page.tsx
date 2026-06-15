import { createClient } from '@/lib/supabase/server'
import CustomerForm from '../components/CustomerForm'

export const dynamic = 'force-dynamic'

export default async function NewCustomerPage() {
    return (
        <div className="p-4 sm:p-6">
            <CustomerForm />
        </div>
    )
}
