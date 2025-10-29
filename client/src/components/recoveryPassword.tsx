"use client";
import { useState } from "react";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Aquí deberías llamar a tu API para recuperar la contraseña
      const res = await fetch("/api/auth/recover-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage("¡Revisa tu correo para restablecer la contraseña!");
      } else {
        setMessage("No se pudo enviar el correo. Verifica el email.");
      }
    } catch {
      setMessage("Error de conexión.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Recuperar contraseña</h2>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button type="submit" disabled={loading} style={{ width: "100%", padding: 8 }}>
        {loading ? "Enviando..." : "Recuperar"}
      </button>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </form>
  );
}