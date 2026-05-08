import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  rootBreadcrumbJsonLd,
  rootFaqJsonLd,
  rootLegalServiceJsonLd,
  rootOrganizationJsonLd,
} from "@/lib/seo/root-jsonld";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Constituir SAS Online en Argentina | Tu Empresa en 5 Días - QuieroMiSAS",
  description: "Constituí tu SAS 100% online en Córdoba y CABA. Desde $285.000. CUIT y matrícula en 5 días hábiles. +500 empresas constituidas. Empezá hoy.",
  keywords: [
    "constituir SAS",
    "crear SAS",
    "sociedad por acciones simplificada",
    "crear empresa en Argentina",
    "constituir empresa online",
    "constituir SAS online",
    "SAS Córdoba",
    "SAS CABA",
    "crear empresa online Argentina",
    "registrar empresa Argentina",
    "CUIT empresa nueva",
    "inscripción IGJ",
    "inscripción IPJ",
    "trámite societario",
    "empresa en 5 días",
    "SAS unipersonal",
    "abogado societario Córdoba",
    "constituir sociedad unipersonal"
  ],
  authors: [{ name: "Martínez Wehbe & Asociados" }],
  creator: "QuieroMiSAS",
  publisher: "QuieroMiSAS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://www.quieromisas.com',
    title: 'Constituir SAS Online en Argentina | Tu Empresa en 5 Días',
    description: 'Constituí tu SAS 100% online en Córdoba y CABA. Desde $285.000. CUIT y matrícula en 5 días hábiles. +500 empresas constituidas.',
    siteName: 'QuieroMiSAS',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Constituir SAS Online en Argentina | QuieroMiSAS',
    description: 'Constituí tu SAS 100% online en Córdoba y CABA. Desde $285.000. CUIT y matrícula en 5 días hábiles.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: 'https://www.quieromisas.com',
  },
  verification: {
    google: 'Fb9746BUHbwNsQqEI8c6ELfh6ekKpop4tvtpMZ8IEto',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        <Script id="ld-json-org" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(rootOrganizationJsonLd)}
        </Script>
        <Script id="ld-json-legal" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(rootLegalServiceJsonLd)}
        </Script>
        <Script id="ld-json-faq" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(rootFaqJsonLd)}
        </Script>
        <Script id="ld-json-breadcrumb" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(rootBreadcrumbJsonLd)}
        </Script>

        <Providers>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
