import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import '../globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Online Toplantı | NovoCRM',
    description: 'Online toplantıya katılın',
}

export default function MeetingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr" suppressHydrationWarning>
            <body className={`${geistSans.variable} antialiased`}>
                {children}
            </body>
        </html>
    )
}
