// client/src/lib/config.ts
export const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:5000";
export const TOKEN_KEY: string = "app_token";
// SOCKET_URL ya se usa en comprar/page.tsx