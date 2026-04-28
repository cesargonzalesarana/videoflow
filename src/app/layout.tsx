import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "VideoFlow - Crea Videos con IA | Studio Profesional Gratis",
    template: "%s | VideoFlow",
  },
  description: "Crea videos profesionales con inteligencia artificial. Editor de video online, plantillas, programacion de publicaciones y analytics. Todo gratis desde tu navegador.",
  keywords: ["video editor", "creador de videos", "editor de video online", "inteligencia artificial", "programar videos", "video marketing", "YouTube", "TikTok", "Instagram Reels", "VideoFlow"],
  authors: [{ name: "VideoFlow", url: "https://videoflow-theta.vercel.app" }],
  creator: "VideoFlow",
  publisher: "VideoFlow",
  formatDetection: {
    email: false,
    telephone: false,
  },
  metadataBase: new URL("https://videoflow-theta.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://videoflow-theta.vercel.app",
    siteName: "VideoFlow",
    title: "VideoFlow - Crea Videos con IA | Studio Profesional Gratis",
    description: "Crea videos profesionales con inteligencia artificial. Editor online, plantillas, programacion y analytics.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VideoFlow - Studio de Video con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VideoFlow - Crea Videos con IA",
    description: "Editor de video online con inteligencia artificial. Crea, programa y publica videos profesionales.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/videoflow-logo.png",
    shortcut: "/videoflow-logo.png",
    apple: "/videoflow-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <link rel="preconnect" href="https://oblofvdvyodzeodugxzs.supabase.co" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
