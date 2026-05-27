/**
 * app/layout.tsx
 * ================================================================
 * Root layout untuk seluruh halaman. Wajib ada di Next.js App Router.
 *
 * KONSEP NEXT.JS:
 *   - Layout dibungkus oleh struktur HTML lengkap (<html>, <body>).
 *   - children prop = halaman aktif (page.tsx)
 *   - Server Component by default — TIDAK perlu "use client" di sini
 *     karena tidak pakai hooks atau state.
 * ================================================================
 */
import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";

export const metadata: Metadata = {
  title: "Rice Harvest Detection",
  description:
    "Sistem Deteksi Kesiapan Panen Padi via Citra Drone — UNIKOM 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">
        <NavBar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
            Skripsi Teknik Informatika UNIKOM 2026 — Ryan Muhammad Hildan (NIM 10122475)
          </div>
        </footer>
      </body>
    </html>
  );
}
