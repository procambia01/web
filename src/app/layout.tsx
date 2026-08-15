import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://cashmova.com"),
  title: { default: "Cashmova — Currency Exchange", template: "%s | Cashmova" },
  description:
    "Peer-to-peer currency exchange platform. Find the best rates from real people near you.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Cashmova — Currency Exchange",
    description:
      "Peer-to-peer currency exchange platform. Find the best rates from real people near you.",
    url: "https://cashmova.com",
    siteName: "Cashmova",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cashmova — Currency Exchange",
    description:
      "Peer-to-peer currency exchange platform. Find the best rates from real people near you.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
