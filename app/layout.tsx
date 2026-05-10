import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
