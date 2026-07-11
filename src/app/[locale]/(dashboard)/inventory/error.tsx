'use client'

import { useEffect } from 'react'

export default function InventoryError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[INVENTORY ERROR BOUNDARY]', error)
    }, [error])

    return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
            <h1 style={{ color: 'red', fontSize: 24 }}>❌ Inventory Render Error</h1>
            <pre style={{ background: '#fff0f0', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {error?.message || String(error)}
            </pre>
            <pre style={{ background: '#fff0f0', padding: 16, borderRadius: 8, marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 11 }}>
                {error?.stack}
            </pre>
            {error?.digest && (
                <p style={{ marginTop: 8, color: '#999' }}>Digest: {error.digest}</p>
            )}
            <button
                onClick={reset}
                style={{ marginTop: 16, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
                Tekrar Dene
            </button>
        </div>
    )
}
