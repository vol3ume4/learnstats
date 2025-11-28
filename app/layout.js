import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LearnStats - Interactive Statistics Practice",
  description: "Master statistics through interactive practice with AI-generated questions",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import Navbar from "./components/Navbar";
import MobileBanner from "./components/MobileBanner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MobileBanner />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
