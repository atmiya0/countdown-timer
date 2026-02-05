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
  title: "Countdown Timer",
  description: "A simple countdown timer with half-time and completion alerts",
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
