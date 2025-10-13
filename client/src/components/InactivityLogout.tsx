"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 30 minutos

export default function InactivityLogout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cerrarSesion = () => {
    localStorage.removeItem("authToken");
    alert("Sesión cerrada por inactividad");
    router.push("/login");
  };

  const reiniciarTemporizador = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(cerrarSesion, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const eventos = ["mousemove", "keydown", "click", "scroll"];
    eventos.forEach((evento) =>
      window.addEventListener(evento, reiniciarTemporizador)
    );
    reiniciarTemporizador();

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, reiniciarTemporizador)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
