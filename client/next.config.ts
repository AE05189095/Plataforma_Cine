import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Establecer explícitamente la raíz del workspace para evitar warning sobre lockfiles
    root: __dirname,
  } as any,
};

export default nextConfig;
