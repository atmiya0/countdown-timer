import type { Metadata } from "next";
import { Google_Sans_Code, Google_Sans } from "next/font/google";
import "./globals.css";

const googleSansCode = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Professional Countdown Timer | Simple, Fast & Offline",
  description: "A premium, minimalist countdown timer featuring neon aesthetics, half-time alerts, and interactive background effects. Perfect for productivity, workouts, and meetings.",
  keywords: ["countdown timer", "online timer", "half-time alert", "productivity tool", "minimalist timer", "offline timer", "PWA timer"],
  authors: [{ name: "Afterone Studio" }],
  openGraph: {
    title: "Professional Countdown Timer",
    description: "Premium minimalist timer with half-time alerts and neon aesthetics.",
    type: "website",
    siteName: "Countdown Timer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Countdown Timer",
    description: "Premium minimalist timer with half-time alerts and neon aesthetics.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Countdown Timer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${googleSansCode.variable} ${googleSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
