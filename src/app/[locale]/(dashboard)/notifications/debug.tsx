'use client'

import { useState, useEffect } from 'react'
import { getSystemNotifications } from './actions'

export default function NotifDebug() {
    const [data, setData] = useState<any>(null)
    const [err, setErr] = useState<any>(null)

    useEffect(() => {
        getSystemNotifications().then(setData).catch(setErr)
    }, [])

    return (
        <div className="p-8">
            <h1>Notif Debug</h1>
            <pre className="bg-slate-100 p-4 rounded mt-4">
                {JSON.stringify({ data, err }, null, 2)}
            </pre>
            <button
                onClick={() => getSystemNotifications().then(setData).catch(setErr)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Refresh
            </button>
        </div>
    )
}
