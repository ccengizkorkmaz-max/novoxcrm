import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Pazarlama Raporu",
    robots: "noindex, nofollow",
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr">
            <body className={`${geistSans.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    )
}
