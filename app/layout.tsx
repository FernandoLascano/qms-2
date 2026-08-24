import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import {
  rootBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLegalServiceJsonLd,
  rootOrganizationJsonLd,
} from "@/lib/seo/root-jsonld";
import { getPublicConfig } from "@/lib/config";
import { SITE_URL } from "@/lib/seo/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });


export async function generateMetadata(): Promise<Metadata> {
  const { precioPlanBasico } = await getPublicConfig();
  const desde = `$${precioPlanBasico.toLocaleString("es-AR")}`;

  return {
  title: "Constituir SAS Online en Argentina | Tu Empresa en 5 Días - QuieroMiSAS",
  description: `Constituí tu SAS 100% online en Córdoba. Desde ${desde}. CUIT y matrícula en 5 días hábiles. +500 empresas constituidas. Empezá hoy.`,
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
    url: SITE_URL,
    title: 'Constituir SAS Online en Argentina | Tu Empresa en 5 Días',
    description: `Constituí tu SAS 100% online en Córdoba. Desde ${desde}. CUIT y matrícula en 5 días hábiles. +500 empresas constituidas.`,
    siteName: 'QuieroMiSAS',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Constituir SAS Online en Argentina | QuieroMiSAS',
    description: `Constituí tu SAS 100% online en Córdoba. Desde ${desde}. CUIT y matrícula en 5 días hábiles.`,
    images: ['/opengraph-image'],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: 'Fb9746BUHbwNsQqEI8c6ELfh6ekKpop4tvtpMZ8IEto',
  },
  manifest: '/manifest.json',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { precioPlanBasico, precioPlanPremium } = await getPublicConfig();
  const legalServiceJsonLd = buildLegalServiceJsonLd({ precioPlanBasico, precioPlanPremium });
  const faqJsonLd = buildFaqJsonLd();

  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>
        {/* Etiquetas <script> de verdad, renderizadas en el servidor. Con
            next/script el JSON quedaba dentro del payload de React y sólo
            existía DESPUÉS de hidratar: los crawlers que no ejecutan JS
            —GPTBot, ClaudeBot, PerplexityBot— no veían ningún dato
            estructurado. Es el mismo patrón que ya usa el blog. */}
        {[
          ['ld-json-org', rootOrganizationJsonLd],
          ['ld-json-legal', legalServiceJsonLd],
          ['ld-json-faq', faqJsonLd],
          ['ld-json-breadcrumb', rootBreadcrumbJsonLd],
        ].map(([id, datos]) => (
          <script
            key={id as string}
            id={id as string}
            type="application/ld+json"
            /* Se escapa "<" para que un valor con "</script>" no pueda cerrar
               la etiqueta antes de tiempo. Hoy todo el contenido es nuestro,
               pero los precios salen de la base y esto no cuesta nada. */
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(datos).replace(/</g, '\\u003c'),
            }}
          />
        ))}

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
