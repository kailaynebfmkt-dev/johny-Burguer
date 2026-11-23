import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { SEO, SITE_URL } from "@/lib/content";
import Loader from "@/components/Loader";
import Header from "@/components/Header";
import FloatingOrder from "@/components/FloatingOrder";
import Cursor from "@/components/Cursor";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--fonte-titulo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO.titulo,
  description: SEO.descricao,
  applicationName: "Johny Burger",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Johny Burger",
    title: SEO.titulo,
    description: SEO.descricao,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Johny Burger — hambúrguer smash com bacon e cheddar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.titulo,
    description: SEO.descricao,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Johny Burger",
  servesCuisine: "Hambúrguer smash artesanal",
  image: `${SITE_URL}/og.png`,
  url: SITE_URL,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Fernando Amaral, 301",
    addressLocality: "Tramandaí",
    addressRegion: "RS",
    addressCountry: "BR",
  },
  sameAs: ["https://www.instagram.com/johny.burger/"],
  menu: "https://johnyburguer.saipos.com/home",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${inter.variable}`}>
      <body>
        <noscript>
          <style>{`.loader{display:none!important}`}</style>
        </noscript>
        <Loader />
        <Header />
        {children}
        <FloatingOrder />
        <Cursor />
        <div className="grao" aria-hidden="true" />
        <div className="vinheta" aria-hidden="true" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
