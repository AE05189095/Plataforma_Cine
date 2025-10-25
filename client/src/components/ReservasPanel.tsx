import { useRouter } from 'next/navigation';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Users, Calendar, DollarSign, Search, Download } from "lucide-react";



interface Reserva {
  _id: string;
  userId: { email: string };
  showtimeId: {
    startTime: string;
    movieId: { title: string };
    hallId: { name: string };
  };
  seats: string[];
  totalPrice: number;
  estado: string; // e.g., 'pendiente', 'confirmada', 'cancelada'
  createdAt: string;
}

interface Filtros {
  user: string;
  date: string;
  movie: string;
  estado: string;
  [key: string]: string;
}

export default function ReservasPanel() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtros, setFiltros] = useState<Filtros>({
    id: '',
    user: '',
    date: '',
    movie: '',
    estado: '',
  });

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = () => {
    const datosSimulados: Reserva[] = [
      {
        _id: '1',
        userId: { email: 'ana@example.com' },
        showtimeId: {
          startTime: '2025-10-24T18:00:00Z',
          movieId: { title: 'Matrix' },
          hallId: { name: 'Sala 1' },
        },
        seats: ['A1', 'A2'],
        totalPrice: 90,
        estado: 'confirmada',
        createdAt: '2025-10-24T17:00:00Z',
      },
      {
        _id: '2',
        userId: { email: 'luis@example.com' },
        showtimeId: {
          startTime: '2025-10-25T20:00:00Z',
          movieId: { title: 'Titanic' },
          hallId: { name: 'Sala 2' },
        },
        seats: ['B3'],
        totalPrice: 45,
        estado: 'pendiente',
        createdAt: '2025-10-25T19:00:00Z',
      },
      {
        _id: '3',
        userId: { email: 'maria@example.com' },
        showtimeId: {
          startTime: '2025-10-26T19:00:00Z',
          movieId: { title: 'Avatar' },
          hallId: { name: 'Sala 3' },
        },
        seats: ['C1', 'C2'],
        totalPrice: 80,
        estado: 'cancelada',
        createdAt: '2025-10-26T18:00:00Z',
      },
    ];

    const filtradas = datosSimulados.filter((r) => {
      const concideId = filtros.id === '' || r._id.includes(filtros.id);
      // Verifica si el filtro de usuario coincide con el email o ID de la reserva
      const coincideUser =
        filtros.user === '' ||
        r.userId.email.toLowerCase().includes(filtros.user.toLowerCase()) ||
        r._id.includes(filtros.user);

      const coincideMovie = filtros.movie === '' || r.showtimeId.movieId.title.toLowerCase().includes(filtros.movie.toLowerCase());
      const coincideEstado = filtros.estado === '' || r.estado === filtros.estado;
      const coincideFecha =
        filtros.date === '' ||
        new Date(r.showtimeId.startTime).toISOString().split('T')[0] === filtros.date;

      return coincideUser && coincideMovie && coincideEstado && coincideFecha;
    });

    setReservas(filtradas);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    fetchReservas();
  };
  
  
  return (
<>
   {/* Encabezado superior */}
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gray-900 text-white px-6 py-4 border-b border-gray-700">
      <div className="flex items-center gap-6">
        <button className="text-white hover:text-orange-400 transition-colors">
          Volver
        </button>
        <h1 className="text-red-500 font-bold text-xl">CineGT Admin</h1>
      </div>
      <div className="text-white-500 font-text">Administrador CineGT</div>
    </header>

{/* Navegación de pestañas */}
<nav className="mt-15 w-full" >
  <div className="bg-gray-800 rounded-lg mx-6 py-2 px-10 flex items-center justify-center shadow">
    <ul className="flex justify-between w-full max-w-7xl mx-auto">
      {["Dashboard", "Películas", "Horarios", "Salas", "Reservas"].map((tab) => (
        <li key={tab}>
          <button
            className={`text-base transition-all duration-200 ${
              tab === "Reservas"
                ? "text-white font-semibold"
                : "text-gray-300 hover:text-white hover:scale-[1.02]"
            }`}
          >
            {tab}
          </button>
        </li>
      ))}
    </ul>
  </div>
</nav>



 <div className="mt-15 space-y-6">
    {/* Título */}
    <div>
      <h2 className="text-2xl font-bold text-white">Gestión de Reservas</h2>
      <p className="text-gray-400">Administra todas las reservas del sistema</p>
    </div>

{/* Estadísticas */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-gray-800 p-4 rounded-lg shadow min-h-[150px]">
    <div className="flex justify-between items-center pb-2">
      <p className="text-sm font-medium">Total Reservas</p>
      <Users className="h-4 w-4 text-gray-400" />
    </div>
    <div className="text-2xl font-bold">{reservas.length}</div>
  </div>

  <div className="bg-gray-800 p-4 rounded-lg shadow min-h-[150px]">
    <div className="flex justify-between items-center pb-2">
      <p className="text-sm font-medium">Confirmadas</p>
      <Calendar className="h-4 w-4 text-gray-400" />
    </div>
    <div className="text-2xl font-bold text-green-600">
      {reservas.filter((r) => r.estado === 'confirmada').length}
    </div>
  </div>

  <div className="bg-gray-800 p-4 rounded-lg shadow min-h-[150px]">
    <div className="flex justify-between items-center pb-2">
      <p className="text-sm font-medium">Pendientes</p>
      <Calendar className="h-4 w-4 text-gray-400" />
    </div>
    <div className="text-2xl font-bold text-yellow-600">
      {reservas.filter((r) => r.estado === 'pendiente').length}
    </div>
  </div>

  <div className="bg-gray-800 p-4 rounded-lg shadow min-h-[150px]">
    <div className="flex justify-between items-center pb-2">
      <p className="text-sm font-medium">Ingresos Totales</p>
      <DollarSign className="h-4 w-4 text-gray-400" />
    </div>
    <div className="text-2xl font-bold">
      Q{reservas.reduce((sum, r) => sum + r.totalPrice, 0)}
    </div>
  </div>
</div>


    {/* Filtros */}
    <form className="flex flex-wrap items-center gap-4" onSubmit={handleFilter}>
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          name="user"
          value={filtros.user}
          onChange={handleChange}
          placeholder="Buscar por cliente, email o ID..."
          className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 w-64 placeholder-gray-400 focus:outline-none"
        />
      </div>

      <select
        name="movie"
        value={filtros.movie}
        onChange={handleChange}
        className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 w-48"
      >
        <option value="">Todas las películas</option>
        {Array.from(new Set(reservas.map((r) => r.showtimeId.movieId.title))).map((movie) => (
          <option key={movie} value={movie}>{movie}</option>
        ))}
      </select>

      <select
        name="estado"
        value={filtros.estado}
        onChange={handleChange}
        className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 w-40"
      >
        <option value="">Todos los estados</option>
        <option value="confirmada">Confirmada</option>
        <option value="pendiente">Pendiente</option>
        <option value="cancelada">Cancelada</option>
      </select>

      <input
        type="date"
        name="date"
        value={filtros.date}
        onChange={handleChange}
        className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2"
      />

      {(filtros.user || filtros.movie || filtros.estado || filtros.date) && (
        <button
          type="button"
          onClick={() =>
            setFiltros({ id: '', user: '', date: '', movie: '', estado: '' })
          }
          className="border px-4 py-2 rounded text-white hover:bg-gray-700"
        >
          Limpiar filtros
        </button>
      )}

      <button
        type="submit"
        className="border px-4 py-2 rounded text-white hover:bg-gray-700 ml-auto flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </button>
    </form>
  </div>

    {/* Contenido principal  */}

      {/* Tabla de reservas */}

<div className="bg-gray-800 rounded-lg shadow px-6 py-5 space-y-10 mt-6">
  <h3 className="text-xl font-semibold text-white">Reservas</h3>

  {loading ? (
    <p className="text-gray-400 italic">Cargando reservas...</p>
  ) : reservas.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-gray-700 text-white-400">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Cliente</th>
            <th className="px-4 py-2">Película</th>
            <th className="px-4 py-2">Fecha Función</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r._id} className="bg-gray-800 border-b border-gray-700">
              <td className="px-4 py-2">{r._id}</td>
              <td className="px-4 py-2">{r.userId.email}</td>
              <td className="px-4 py-2">{r.showtimeId.movieId.title}</td>
              <td className="px-4 py-2">
                {new Date(r.showtimeId.startTime).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">Q{r.totalPrice}</td>
              <td className="px-4 py-2 capitalize">{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="text-gray-400 italic">No hay reservas encontradas.</p>
  )}
</div>

  </>
);

}