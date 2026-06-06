import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sadaf-boutique.vercel.app"),
  title: {
    default: "Sadaf Boutique | Designer Ethnic Wear, Bridal Couture & Custom Stitching",
    template: "%s | Sadaf Boutique"
  },
  description:
    "Sadaf Boutique by Sadaf Khan creates premium women's ethnic wear, bridal collections, designer sarees, party wear, kurtis, gowns, and bespoke stitching.",
  keywords: [
    "Sadaf Boutique",
    "Sadaf Khan",
    "women fashion boutique",
    "bridal wear",
    "designer sarees",
    "custom stitching",
    "ethnic wear",
    "party wear dresses"
  ],
  openGraph: {
    title: "Sadaf Boutique",
    description: "Luxury designer ethnic wear and custom couture for women.",
    type: "website",
    url: "https://sadaf-boutique.vercel.app",
    images: ["/images/og-sadaf.svg"]
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
