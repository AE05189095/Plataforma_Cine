import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  turbopack: {
    // Establecer explícitamente la raíz del workspace para evitar warning sobre lockfiles
    root: __dirname,
  },
  images: {
    domains: [
      'm.media-amazon.com', // posters desde Amazon
      'image.tmdb.org', // TMDB (The Movie DB)
      'images.unsplash.com', // Unsplash
      'i.imgur.com', // Imgur
      'lh3.googleusercontent.com', // Google user/content (avatars, etc.)
      'cdn.pixabay.com', // Pixabay
      'i.pinimg.com', // Pinterest thumbnails
      'res.cloudinary.com', // Cloudinary-hosted images
    ],
  },
};

export default nextConfig;
