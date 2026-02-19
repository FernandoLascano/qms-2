import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuieroMiSAS - Constituí tu S.A.S. en 5 días | Córdoba y CABA",
  description: "Constituí tu Sociedad por Acciones Simplificada (S.A.S.) 100% online en Argentina. Proceso rápido, económico y seguro. CUIT y matrícula en 5 días hábiles. Córdoba y CABA.",
  keywords: [
    "constituir SAS",
    "sociedad por acciones simplificada",
    "crear empresa en Argentina",
    "constituir empresa online",
    "SAS Córdoba",
    "SAS CABA",
    "CUIT rapido",
    "inscripción IGJ",
    "inscripción IPJ",
    "trámite societario",
    "empresa en 5 días"
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
    title: 'QuieroMiSAS - Constituí tu S.A.S. en 5 días',
    description: 'Plataforma digital para constituir sociedades S.A.S. en Argentina. Rápido, fácil y económico. 100% online.',
    siteName: 'QuieroMiSAS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuieroMiSAS - Constituí tu S.A.S. en 5 días',
    description: 'Plataforma digital para constituir sociedades S.A.S. en Argentina. Rápido, fácil y económico.',
  },
  alternates: {
    canonical: 'https://www.quieromisas.com',
  },
  verification: {
    google: 'tu-codigo-de-verificacion-google', // Cambiar cuando tengas Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "QuieroMiSAS",
              "alternateName": "Martínez Wehbe & Asociados",
              "description": "Servicio de constitución de Sociedades por Acciones Simplificadas (S.A.S.) en Argentina. 100% online, rápido y económico.",
              "url": "https://www.quieromisas.com",
              "logo": "https://www.quieromisas.com/assets/img/qms-logo-reg.png",
              "image": "https://www.quieromisas.com/assets/img/qms-logo-reg.png",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Córdoba",
                "addressRegion": "Córdoba",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "-31.4201",
                "longitude": "-64.1888"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+54-351-428-4037",
                "contactType": "customer service",
                "email": "contacto@quieromisas.com",
                "availableLanguage": ["Spanish"],
                "areaServed": "AR"
              },
              "telephone": "+54-351-428-4037",
              "email": "contacto@quieromisas.com",
              "priceRange": "$$",
              "areaServed": ["Córdoba", "Buenos Aires", "Argentina"],
              "serviceType": ["Constitución de S.A.S.", "Trámites Societarios", "Asesoría Legal", "Inscripción IPJ", "Inscripción IGJ"],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "bestRating": "5",
                "worstRating": "1",
                "reviewCount": "127"
              }
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "¿Cuánto tiempo tarda constituir una S.A.S.?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Con QuieroMiSAS, tu S.A.S. estará inscripta y operativa en 5 días hábiles. Recibirás tu CUIT y matrícula lista para facturar."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Cuánto cuesta constituir una S.A.S.?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Los costos de constituir una S.A.S. son significativamente menores que una S.R.L. o S.A. Incluyen honorarios profesionales y tasas de inscripción."
                  }
                },
                {
                  "@type": "Question",
                  "name": "¿Dónde puedo constituir mi S.A.S.?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Actualmente constituimos S.A.S. en Córdoba (IPJ) y CABA (IGJ). Tu sociedad será funcional en todo el territorio argentino."
                  }
                }
              ]
            })
          }}
        />

        <Providers>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}