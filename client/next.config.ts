import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Establecer explícitamente la raíz del workspace para evitar warning sobre lockfiles
    root: __dirname,
  },
  images: {
    domains: ['m.media-amazon.com'], // permitimos imágenes externas de Inception
  },
};

export default nextConfig;
