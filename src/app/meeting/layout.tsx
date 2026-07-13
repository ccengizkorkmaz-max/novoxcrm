import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import '../globals.css'
import Script from 'next/script'

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
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=AW-18295920582"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics-meeting" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'AW-18295920582');
                    `}
                </Script>
                {children}
            </body>
        </html>
    )
}
