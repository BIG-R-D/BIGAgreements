import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/components/providers";
import { branding } from "@/app/lib/branding";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
    variable: "--font-eb-garamond",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    metadataBase: new URL(branding.publicAppUrl),
    title: branding.productName,
    description: branding.description,
    icons: {
        icon: [
            { url: "/icon.png", type: "image/png" },
            { url: "/favicon.ico" },
        ],
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        type: "website",
        url: branding.publicAppUrl,
        siteName: branding.productName,
        title: branding.productName,
        description: branding.description,
        images: [
            {
                url: "/link-image.jpg",
                width: 1200,
                height: 651,
                alt: branding.productName,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: branding.productName,
        description: branding.description,
        images: ["/link-image.jpg"],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.variable} ${ebGaramond.variable} font-sans antialiased`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
