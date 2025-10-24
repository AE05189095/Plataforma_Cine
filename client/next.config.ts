import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  turbopack: {
    // Establecer explícitamente la raíz del workspace para evitar warning sobre lockfiles
    root: __dirname,
  } as any,
  images: {
    domains: [
      'm.media-amazon.com',
      'encrypted-tbn0.gstatic.com',
      'resizing.flixster.com',
      'pics.filmaffinity.com',
    ],
  },
};

export default nextConfig;
