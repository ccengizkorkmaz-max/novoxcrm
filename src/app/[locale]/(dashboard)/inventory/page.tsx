import { Suspense } from 'react'

export default async function InventoryPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    return (
        <div style={{ padding: 40 }}>
            <h1>Inventory Page - Diagnostic</h1>
            <p>If you see this, the page component itself works.</p>
            <p>Timestamp: {new Date().toISOString()}</p>
        </div>
    )
}
