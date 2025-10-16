"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/services/api";

export default function AdminShowtimesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [showtimes, setShowtimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos del formulario
  const [selectedMovie, setSelectedMovie] = useState("");
  const [selectedHall, setSelectedHall] = useState("");
  const [startAt, setStartAt] = useState("");
  const [price, setPrice] = useState("");

  // Cargar películas y salas para los selectores
  useEffect(() => {
    const loadData = async () => {
      try {
        const [moviesRes, hallsRes, showtimesRes] = await Promise.all([
          fetch(`${API_URL}/movies`),
          fetch(`${API_URL}/halls`),
          fetch(`${API_URL}/showtimes`),
        ]);

        const [moviesData, hallsData, showtimesData] = await Promise.all([
          moviesRes.json(),
          hallsRes.json(),
          showtimesRes.json(),
        ]);

        setMovies(moviesData);
        setHalls(hallsData);
        setShowtimes(showtimesData);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Crear función
  const createShowtime = async () => {
    if (!selectedMovie || !selectedHall || !startAt || !price) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/showtimes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie: selectedMovie,
          hall: selectedHall,
          startAt,
          price: parseFloat(price),
        }),
      });

      if (!res.ok) throw new Error("Error al crear la función");
      alert("✅ Función creada correctamente.");
      setSelectedMovie("");
      setSelectedHall("");
      setStartAt("");
      setPrice("");
      refreshShowtimes();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Refrescar lista de funciones
  const refreshShowtimes = async () => {
    const res = await fetch(`${API_URL}/showtimes`);
    const data = await res.json();
    setShowtimes(data);
  };

  // Eliminar función
  const deleteShowtime = async (id: string) => {
    if (!confirm("¿Eliminar esta función?")) return;

    try {
      await fetch(`${API_URL}/showtimes/${id}`, { method: "DELETE" });
      refreshShowtimes();
    } catch (err) {
      alert("Error al eliminar función");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Cargando funciones...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">🕒 Gestión de Funciones</h1>

      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8 flex flex-col md:flex-row gap-4">
        {/* Película */}
        <select
          value={selectedMovie}
          onChange={(e) => setSelectedMovie(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white flex-1 border border-gray-700"
        >
          <option value="">Seleccionar película</option>
          {movies.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </select>

        {/* Sala */}
        <select
          value={selectedHall}
          onChange={(e) => setSelectedHall(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white flex-1 border border-gray-700"
        >
          <option value="">Seleccionar sala</option>
          {halls.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name} ({h.capacity} asientos)
            </option>
          ))}
        </select>

        {/* Fecha y hora */}
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 flex-1"
        />

        {/* Precio */}
        <input
          type="number"
          value={price}
          placeholder="Precio (Q)"
          onChange={(e) => setPrice(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 flex-1"
        />

        <button
          onClick={createShowtime}
          className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg font-semibold transition-all"
        >
          Agregar función
        </button>
      </div>

      {/* TABLA DE FUNCIONES */}
      <table className="w-full text-left border border-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-3">Película</th>
            <th className="p-3">Sala</th>
            <th className="p-3">Fecha y hora</th>
            <th className="p-3">Precio</th>
            <th className="p-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {showtimes.map((s) => (
            <tr key={s._id} className="border-t border-gray-700">
              <td className="p-3">{s.movie?.title || "Sin título"}</td>
              <td className="p-3">{s.hall?.name || "Sala no encontrada"}</td>
              <td className="p-3">
                {new Date(s.startAt).toLocaleString("es-GT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="p-3">Q{s.price}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => deleteShowtime(s._id)}
                  className="bg-red-700 hover:bg-red-800 px-4 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
