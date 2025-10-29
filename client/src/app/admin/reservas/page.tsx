'use client';
import { useRouter } from 'next/navigation';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';

import { API_BASE, TOKEN_KEY } from "../../../lib/config";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Reserva {
  _id: string;
  userId: { email: string };
  showtimeId: {
    startAt: string;
    movie: { title: string };
    hall: { name: string };
  };
  seats: string[];
  totalPrice: number;
  estado: string; // e.g., 'pendiente', 'confirmada', 'cancelada'
  createdAt: string;
  test?: boolean; // 👈 campo opcional
}

interface Filtros {
  user: string;
  date: string;
  movie: string;
  estado: string;
  [key: string]: string;
}



export default function AdminReservasPage() {
  const headerStyle: React.CSSProperties = { background: 'rgba(6,18,30,0.7)', border: '1px solid rgba(255,255,255,0.04)' };

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
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros((prev) => {
      const nuevosFiltros = { ...prev, [name]: value };
      fetchReservas(nuevosFiltros); // 👈 pasa los filtros actualizados
      return nuevosFiltros;
    });
  };

// Estado para películas disponibles en el filtro
const [peliculasDisponibles, setPeliculasDisponibles] = useState<string[]>([]);

// Cargar películas al montar el componente
  useEffect(() => {
  const fetchPeliculas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/movies`);
      if (!res.ok) throw new Error('No se pudo obtener películas');
      const data = await res.json();

      const activas = data.filter((p: any) => p.isActive); // si usás isActive
      const titulos = activas.map((p: any) => p.title);
      setPeliculasDisponibles(titulos);
    } catch (error) {
      console.error('Error al cargar películas:', error);
      setPeliculasDisponibles([]);
    }
  };

  fetchPeliculas();
}, []);


  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    fetchReservas();
  };

  /*
  const exportarCSV = (reservas: Reserva[]) => {
    const headers = ['ID', 'Cliente', 'Película', 'Función', 'Asientos', 'Total', 'Estado', 'Fecha Reserva'];

    const rows = reservas.map((r) => [
      r._id,
      r.userId?.email ?? 'Sin correo',
      r.showtimeId?.movie?.title ?? 'Sin título',
      r.showtimeId?.startAt
        ? new Date(r.showtimeId.startAt).toLocaleDateString('es-GT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        : 'Sin fecha',
      r.seats?.join(', ') ?? 'Sin asientos',
      `Q${r.totalPrice ?? '?'}`,
      r.estado ?? '?',
      r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'Sin fecha',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'reservas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

*/


const exportarExcel = (reservas: Reserva[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reservas');

  // Estilo del encabezado
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 20 },
    { header: 'Cliente', key: 'cliente', width: 25 },
    { header: 'Película', key: 'pelicula', width: 25 },
    { header: 'Función', key: 'funcion', width: 20 },
    { header: 'Asientos', key: 'asientos', width: 30 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Fecha Reserva', key: 'fecha', width: 20 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }, // azul oscuro
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' }, // blanco
      bold: true,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Agregar filas
  reservas.forEach((r) => {
    worksheet.addRow({
      id: r._id,
      cliente: r.userId?.email ?? 'Sin correo',
      pelicula: r.showtimeId?.movie?.title ?? 'Sin título',
      funcion: r.showtimeId?.startAt
        ? new Date(r.showtimeId.startAt).toLocaleDateString('es-GT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : 'Sin fecha',
      asientos: r.seats?.join(', ') ?? 'Sin asientos',
      total: `Q${r.totalPrice ?? '?'}`,
      estado: r.estado ?? '?',
      fecha: r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
        : 'Sin fecha',
    });
  });

  // Exportar
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'reservas.xlsx');
  });
};


  const fetchReservas = async (filtrosActivos: Filtros = filtros) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/reservations`);
      if (!res.ok) throw new Error('No se pudo obtener reservas');
      const data: Reserva[] = await res.json();

      const filtradas = data.filter((r) => {
        const coincideId = filtrosActivos.id === '' || r._id?.includes(filtrosActivos.id);
        const coincideUser = filtrosActivos.user === '' || r.userId?.email?.toLowerCase().includes(filtrosActivos.user.toLowerCase());
        const coincideMovie = filtrosActivos.movie === '' || r.showtimeId?.movie?.title?.toLowerCase().includes(filtrosActivos.movie.toLowerCase());
        const coincideEstado = filtrosActivos.estado === '' || r.estado === filtrosActivos.estado;
        const coincideFecha = filtrosActivos.date === '' || (
          r.showtimeId?.startAt &&
          new Date(r.showtimeId.startAt).toISOString().split('T')[0] === filtrosActivos.date
        );
        const noEsTest = !r.test; // Excluir reservas de prueba

        return coincideId && coincideUser && coincideMovie && coincideEstado && coincideFecha && noEsTest;
      });

      setReservas(filtradas);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };



  const handleClearFilters = () => {
    const filtrosVacios = {
      id: '',
      user: '',
      date: '',
      movie: '',
      estado: '',
    };
    setFiltros(filtrosVacios);
    fetchReservas(filtrosVacios); // 👈 recarga sin filtros
  };


  return (


    <div className="mt-15 space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-lg" style={headerStyle}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Gestión de reservas</h1>
        <p className="text-gray-400">Administra todas las reservas del sistema</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg shadow min-h-[150px]" style={headerStyle}>
          <div className="flex justify-between items-center pb-2">
            <p className="text-white font-medium">Total Reservas</p>
          </div>
          <div className="text-2xl font-bold">{reservas.length}</div>
        </div>

        <div className="p-4 rounded-lg shadow min-h-[150px]" style={headerStyle}>
          <div className="flex justify-between items-center pb-2">
            <p className="text-white font-medium">Confirmadas</p>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {reservas.filter((r) => r.estado === 'confirmada').length}
          </div>
        </div>

        <div className="p-4 rounded-lg shadow min-h-[150px]" style={headerStyle}>
          <div className="flex justify-between items-center pb-2">
            <p className="text-white font-medium">Pendientes</p>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {reservas.filter((r) => r.estado === 'pendiente').length}
          </div>
        </div>

        <div className="p-4 rounded-lg shadow min-h-[150px]" style={headerStyle}>
          <div className="flex justify-between items-center pb-2">
            <p className="text-white font-medium">Ingresos Totales</p>
          </div>
          <div className="text-2xl font-bold">
            Q{reservas.reduce((sum, r) => sum + r.totalPrice, 0)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap items-center gap-4" onSubmit={handleFilter}>
        <input
          type="text"
          name="user"
          value={filtros.user}
          onChange={handleChange}
          placeholder="Buscar por cliente, email o ID..."
          className="text-white border border-gray-600 rounded px-3 py-2 w-64 placeholder-gray-400 focus:outline-none"
          style={headerStyle}
        />

        <select
          name="movie"
          value={filtros.movie}
          onChange={handleChange}
          className="text-white border border-gray-600 rounded px-3 py-2 w-48"
          style={headerStyle}
        >
          <option value="">Todas las películas</option>
          {peliculasDisponibles.map((titulo) => (
    <option key={titulo} value={titulo}>
      {titulo}
    </option>
  ))}

        </select>

        <select
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
          className="text-white border border-gray-600 rounded px-3 py-2 w-40"
          style={headerStyle}
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
          className="text-white border border-gray-600 rounded px-3 py-2"
          style={headerStyle}
        />


        <div className="flex gap-2 items-center">
          {(filtros.user || filtros.movie || filtros.estado || filtros.date) ? (

            <button
              type="button"
              onClick={handleClearFilters}
              className="border px-4 py-2 rounded text-white hover:bg-gray-700"
              style={headerStyle}
            >
              Limpiar filtros
            </button>
          ) : (
            <div className="border px-4 py-2 rounded invisible" style={headerStyle}>
              Limpiar filtros
            </div>


          )}
        {/*agregar onClick a exportarExcel*/}
        <button
          type="button"
          onClick={() => exportarExcel(reservas)}
          className="border px-4 py-2 rounded text-white hover:bg-gray-700 ml-45"
          style={headerStyle}
        >
          Exportar
        </button> 
        </div>

       

      </form>

      {/* Tabla de reservas */}
      <div className="rounded-lg shadow px-6 py-5 space-y-10 mt-6" style={headerStyle}>
        <h3 className="text-xl font-semibold text-white">Reservas</h3>

        {loading ? (
          <p className="text-gray-400 italic">Cargando reservas...</p>
        ) : reservas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2">Película</th>
                  <th className="px-4 py-2">Función</th>
                  <th className="px-4 py-2">Asientos</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Fecha Reserva</th>
                </tr>
              </thead>

              {/* Renderizado de las reservas*/}
              <tbody>
                {reservas.map((r) => (
                  <tr key={r._id} className="bg-gray-800 border-b border-gray-700 text-white">
                    <td className="px-4 py-2">{r._id}</td>
                    <td className="px-4 py-2">{r.userId?.email ?? "Sin correo"}</td>
                    <td className="px-4 py-2">{r.showtimeId?.movie?.title ?? "Sin título"}</td>
                    <td className="px-4 py-2">
                      {r.showtimeId?.startAt
                        ? new Date(r.showtimeId.startAt).toLocaleDateString()
                        : "Sin fecha"}
                    </td>
                    <td className="px-4 py-2">
                      {r.seats?.length > 0 ? r.seats.join(', ') : "Sin asientos"}
                    </td>
                    <td className="px-4 py-2">Q{r.totalPrice ?? "?"}</td>
                    <td className="px-4 py-2 capitalize">{r.estado ?? "?"}</td>
                    <td className="px-4 py-2">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "Sin fecha"}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        ) : (
          <p className="text-gray-400 italic">No se encontraron reservas.</p>
        )}
      </div>
    </div>
  );


}
