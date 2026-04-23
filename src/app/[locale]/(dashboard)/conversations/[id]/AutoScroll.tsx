'use client'

import { useEffect, useRef } from 'react'

export default function AutoScroll({ deps }: { deps?: number }) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [deps])

    return <div ref={bottomRef} />
}
