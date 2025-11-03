"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/Protectedroute";

const tabs = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/peliculas", label: "Películas" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/salas", label: "Salas" },
  { href: "/admin/reservas", label: "Reservas" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Header onLogoClick={() => { /* mantener comportamiento por defecto */ }} />

        {/* Top tabs styled with project palette variables */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav
            className="flex items-center gap-2 overflow-x-auto rounded-full px-3 py-2 scrollbar-hide"
            style={{
              background: "rgba(0,0,0,0.35)",
              border: "1px solid #DC2626",
            }}
          >
            {tabs.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    active ? "shadow-inner" : "hover:bg-black/30"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(220,38,38,0.14), rgba(220,38,38,0.08))",
                          color: "var(--color-link)",
                          border: "1px solid rgba(220,38,38,0.4)",
                        }
                      : { color: "var(--foreground)" }
                  }
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>


        <main className="max-w-[1280px] mx-auto px-4 pb-12">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
