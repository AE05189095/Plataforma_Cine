"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    const token = localStorage.getItem("authToken"); // JWT guardado al hacer login
=======
    const token = localStorage.getItem("token"); // JWT guardado al hacer login
>>>>>>> mapa-asientos
    if (!token) {
      router.push("/login"); // si no hay token, redirige
    }
  }, [router]);

  return <>{children}</>;
}
