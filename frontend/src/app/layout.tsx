import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VehicleFinderChat from "@/components/VehicleFinderChat";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VehicleWalay - AI Powered Car Search",
  description: "Find your next vehicle with AI across Pakistan's top platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex min-h-screen flex-col bg-slate-50 text-slate-900`}
      >
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="min-h-0 flex-1">
              {children}
            </main>
            <Footer />
            <VehicleFinderChat />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

