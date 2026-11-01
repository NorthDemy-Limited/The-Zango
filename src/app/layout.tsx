import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thezango.com"),
  title: "The Zango — Your Trusted Voice for Northern Nigeria & African Innovation",
  description: "The Zango is your trusted source for breaking news, insightful analysis, and stories that matter to you. Covering technology, business, culture, and climate innovation.",
  keywords: ["The Zango", "Northern Nigeria News", "African Startups", "Technology", "Climate Tech", "Business News"],
  authors: [{ name: "The Zango Editorial Team" }],
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
    <html lang="en" className={`${jakarta.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-white text-[#111111] antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
