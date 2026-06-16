import { NextResponse } from 'next/server'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import fs from 'fs'
import path from 'path'

export async function GET() {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    if (brandName === 'Oikos CRM') {
        const filePath = path.join(process.cwd(), 'public', 'oikos-logo.svg')
        try {
            const svgContent = fs.readFileSync(filePath, 'utf8')
            return new NextResponse(svgContent, {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                },
            })
        } catch (err: any) {
            console.error('Error reading Oikos logo SVG:', err.message)
            return new NextResponse('Error loading icon', { status: 500 })
        }
    } else {
        const filePath = path.join(process.cwd(), 'public', 'novox-favicon.ico')
        try {
            const fileBuffer = fs.readFileSync(filePath)
            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': 'image/x-icon',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                },
            })
        } catch (err: any) {
            console.error('Error reading Novox favicon:', err.message)
            return new NextResponse('Error loading icon', { status: 500 })
        }
    }
}
