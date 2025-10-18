"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Movie {
  _id: string;
  title: string;
  description: string;
  genres: string[];
  duration: string;
  rating: string;
  score: number;
  images: string[];
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [showForm, setShowForm] = useState(false);

  const router = useRouter();

  // Campos del formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("");
  const [duration, setDuration] = useState("");
  const [rating, setRating] = useState("");
  const [score, setScore] = useState("");
  const [image, setImage] = useState("");

  // 🔹 Obtener todas las películas
  const loadMovies = async () => {
    try {
      const data = await apiFetch<Movie[]>("/movies");
      setMovies(data);
    } catch (err: any) {
      alert("Error al cargar películas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
  }, []);

  // 🟢 Guardar o editar película
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        genres: genres.split(",").map((g) => g.trim()),
        duration,
        rating,
        score: parseFloat(score),
        images: [image],
      };

      if (editingMovie) {
        await apiFetch(`/movies/${editingMovie._id}`, {
          method: "PUT",
          body: payload,
        });
        alert("Película actualizada con éxito");
      } else {
        await apiFetch("/movies", {
          method: "POST",
          body: payload,
        });
        alert("Película agregada con éxito");
      }

      resetForm();
      await loadMovies();
    } catch (err: any) {
      alert("Error al guardar película: " + err.message);
    }
  };

  // ❌ Eliminar película
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta película?")) return;
    try {
      await apiFetch(`/movies/${id}`, { method: "DELETE" });
      alert("Película eliminada correctamente");
      await loadMovies();
    } catch (err: any) {
      alert("Error al eliminar película: " + err.message);
    }
  };

  // ✏️ Editar película
  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description);
    setGenres(movie.genres.join(", "));
    setDuration(movie.duration);
    setRating(movie.rating);
    setScore(movie.score.toString());
    setImage(movie.images[0] || "");
    setShowForm(true);
  };

  // 🔄 Resetear formulario
  const resetForm = () => {
    setEditingMovie(null);
    setTitle("");
    setDescription("");
    setGenres("");
    setDuration("");
    setRating("");
    setScore("");
    setImage("");
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-white bg-black">
        Cargando películas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      <h1 className="text-3xl font-bold text-yellow-400 flex items-center gap-2 mb-6">
        🎞️ Administración de Películas
      </h1>

      <button
        onClick={() => router.push("/login-admin")}
        className="mb-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
      >
        ← Volver al panel
      </button>

      {/* 📦 Listado de películas */}
      <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-yellow-400">
            Películas registradas
          </h2>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            + Nueva Película
          </button>
        </div>

        {movies.length === 0 ? (
          <p className="text-gray-400">No hay películas registradas.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((movie) => (
              <div
                key={movie._id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-yellow-500 transition-all flex flex-col"
              >
                <Image
                  src={movie.images?.[0] || "/images/default-movie.jpg"}
                  alt={movie.title}
                  width={400}
                  height={250}
                  className="rounded-lg mb-3 object-cover w-full h-48"
                />
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  {movie.title}
                </h3>
                <p className="text-sm text-gray-400 mb-2 line-clamp-3">
                  {movie.description}
                </p>
                <p className="text-gray-300 text-sm">
                  🎭 {movie.genres.join(", ")}
                </p>
                <p className="text-gray-400 text-sm">⏱️ {movie.duration}</p>
                <p className="text-gray-400 text-sm">⭐ {movie.score}</p>
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => handleEdit(movie)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded-lg font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(movie._id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📝 Formulario de agregar/editar */}
      {showForm && (
        <div className="bg-gray-800 p-6 rounded-xl border border-yellow-600 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">
            {editingMovie ? "Editar Película" : "Agregar Nueva Película"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              required
            />
            <textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              rows={3}
              required
            />
            <input
              type="text"
              placeholder="Géneros (separados por coma)"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              required
            />
            <input
              type="text"
              placeholder="Duración (ej. 120 min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
              required
            />
            <input
              type="text"
              placeholder="Clasificación (ej. PG-13)"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
            />
            <input
              type="number"
              placeholder="Puntaje (ej. 8.5)"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
            />
            <input
              type="text"
              placeholder="URL de la imagen"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-600"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-bold text-black"
              >
                {editingMovie ? "Guardar cambios" : "Agregar película"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
