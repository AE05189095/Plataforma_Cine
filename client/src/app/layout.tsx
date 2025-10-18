import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cine GT",
  description: "Cartelera y gestión de funciones de Cine GT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black text-white`}>
        {/* ❌ Antes: <Header /> */}
        {children}
      </body>
    </html>
  );
}