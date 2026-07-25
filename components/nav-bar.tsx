/**
 * components/nav-bar.tsx
 * ================================================================
 * Navigation bar atas yang muncul di semua halaman.
 *
 * KONSEP NEXT.JS YANG DIPAKAI:
 *   - <Link> dari next/link, BUKAN <a>. Kenapa? Next.js handle
 *     client-side navigation tanpa full page reload, jauh lebih cepat.
 *   - usePathname() untuk deteksi halaman aktif → kasih highlight.
 *     "use client" diperlukan karena hook hanya jalan di browser.
 * ================================================================
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Upload, History, Activity, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",        label: "Beranda",  icon: Sprout   },
  { href: "/upload",  label: "Upload",   icon: Upload   },
  { href: "/results", label: "Riwayat",  icon: History  },
  { href: "/riwayat", label: "Lahan",    icon: MapPin   },
  { href: "/status",  label: "Status",   icon: Activity },
];

export function NavBar() {
  // pathname = URL saat ini, mis. "/upload"
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sprout className="h-6 w-6 text-green-700" />
          <span className="text-base text-slate-900">
            Rice Harvest Detection
          </span>
        </Link>

        {/* Menu link */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight kalau path saat ini cocok
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-green-50 text-green-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
