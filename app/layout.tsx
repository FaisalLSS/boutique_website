import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://viora-boutique.vercel.app"),
  title: {
    default: "Viora Boutique | Designer Ethnic Wear, Bridal Couture & Custom Stitching",
    template: "%s | Viora Boutique"
  },
  description:
    "Viora Boutique creates premium women's ethnic wear, bridal collections, designer sarees, party wear, kurtis, gowns, and bespoke stitching.",
  keywords: [
    "Viora Boutique",
    "women fashion boutique",
    "bridal wear",
    "designer sarees",
    "custom stitching",
    "ethnic wear",
    "party wear dresses"
  ],
  openGraph: {
    title: "Viora Boutique",
    description: "Luxury designer ethnic wear and custom couture for women.",
    type: "website",
    url: "https://viora-boutique.vercel.app",
    images: ["/images/og-viora.svg"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171313"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
