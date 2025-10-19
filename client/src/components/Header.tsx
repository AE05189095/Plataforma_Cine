import React, { useEffect, useState } from "react";
import Link from "next/link"; // necesario para navegación entre páginas
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE, TOKEN_KEY } from "@/lib/config";
type HeaderProps = {
  searchTerm?: string;
  setSearchTerm?: (v: string) => void;
  selectedGenre?: string;
  setSelectedGenre?: (v: string) => void;
  selectedDate?: string;
  setSelectedDate?: (v: string) => void;
  onLogoClick?: () => void;
};

export default function Header(props: HeaderProps = {}) {
  const [isLogged, setIsLogged] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const validate = async () => {
      // marcar estado de validación local si se necesita en el futuro
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setIsLogged(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setIsLogged(true);
        } else {
          // token inválido o expirado
          localStorage.removeItem(TOKEN_KEY);
          setIsLogged(false);
        }
      } catch {
        // Error de red: conservamos estado como no autenticado
        localStorage.removeItem(TOKEN_KEY);
        setIsLogged(false);
      }
    };

    validate();

  const onAuth = () => validate();
  window.addEventListener('authChange', onAuth);
  return () => window.removeEventListener('authChange', onAuth);
  }, []);

  const handleProfile = () => {
    router.push("/profile");
  };

  // Opciones controladas por props o por estado local
  const [localSearch, setLocalSearch] = useState("");
  const [localGenre, setLocalGenre] = useState("Todos los géneros");
  const [localDate, setLocalDate] = useState("");

  const searchTerm = props.searchTerm ?? localSearch;
  const setSearchTerm = props.setSearchTerm ?? setLocalSearch;

  const selectedGenre = props.selectedGenre ?? localGenre;
  const setSelectedGenre = props.setSelectedGenre ?? setLocalGenre;

  const selectedDate = props.selectedDate ?? localDate;
  const setSelectedDate = props.setSelectedDate ?? setLocalDate;

  return (
    <header className="bg-gray-900 text-white p-3 md:p-4">
      <div className="max-w-5xl mx-auto w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4">
        {/* Logo: siempre a la izquierda */}
        <div
          className="flex items-center ml-0 md:ml-4 justify-start w-auto cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (props.onLogoClick) props.onLogoClick();
            else router.push('/');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (props.onLogoClick) props.onLogoClick();
              else router.push('/');
            }
          }}
        >
          <Image
            src="/images/Logo.png"
            alt="Logo CineGT"
            width={120}
            height={40}
            style={{ height: 'auto' }}
          />
        </div>

        {/* Contenedor central para buscar/género/fecha: centrado en pantallas md+ */}
        {/* Grupo central: siempre centrado */}
        <div className="flex justify-center w-full">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:max-w-2xl px-2 justify-center">
            <input
              type="text"
              placeholder="Buscar película"
              className="w-full md:flex-1 md:max-w-2xl px-3 md:px-4 py-2 rounded-lg border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400"
              style={{ minWidth: 0 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-lg border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre && setSelectedGenre(e.target.value)}
            >
              <option value="Todos los géneros">Todos los géneros</option>
              <option value="Comedia">Comedia</option>
              <option value="Acción">Acción</option>
              <option value="Drama">Drama</option>
              <option value="Ciencia Ficción">Ciencia Ficción</option>
              <option value="Romance">Romance</option>
              <option value="Terror">Terror</option>
              <option value="Suspense">Suspense</option>
              <option value="Animación">Animación</option>
              <option value="Documental">Documental</option>
              <option value="Familiar">Familiar</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 rounded-lg border-2 border-red-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer w-full md:w-auto"
              readOnly={false} // permite seleccionar solo con el calendario
              value={selectedDate}
              onChange={(e) => setSelectedDate && setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Botón de inicio de sesión o perfil */}
  {/* Botón perfil/inicio: siempre a la derecha */}
  <div className="flex items-center w-auto justify-end">
          {isLogged ? (
            <button onClick={handleProfile} className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-black" aria-hidden="true">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7z" />
              </svg>
              <span>Perfil</span>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Conectado" aria-hidden="true" />
            </button>
          ) : (
            // Si está validando, mostramos un estado intermedio, pero el botón debe seguir siendo rojo
            <Link href="/login?next=/profile">
              <button className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition">
                Iniciar sesión
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
