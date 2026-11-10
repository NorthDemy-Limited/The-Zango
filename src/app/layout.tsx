import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { AuthProvider } from "@/context/auth-context";

const jakarta = localFont({
  src: "../../public/fonts/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-jakarta",
  display: "swap",
  weight: "400 800",
});

export const viewport: Viewport = {
  themeColor: "#C61D1F",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://thezango.com"),
  title: "The Zango — Your Trusted Voice for Northern Nigeria & African Innovation",
  description: "The Zango is your trusted source for breaking news, insightful analysis, and stories that matter to you. Covering technology, business, culture, and climate innovation.",
  keywords: ["The Zango", "Northern Nigeria News", "African Startups", "Technology", "Climate Tech", "Business News"],
  authors: [{ name: "The Zango Editorial Team" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "The Zango — Your Trusted Voice for Northern Nigeria & African Innovation",
    description: "Breaking news, insightful analysis, and stories that matter to you.",
    url: "https://thezango.com",
    siteName: "The Zango",
    images: [
      {
        url: "/assets/hero-featured.jpg",
        width: 1200,
        height: 630,
        alt: "The Zango Publication",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen flex flex-col bg-white text-[#111111] antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
