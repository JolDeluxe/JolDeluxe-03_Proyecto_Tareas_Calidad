// 📍 src/components/Admin/FechasAdmin.tsx

import React, { useState, useEffect } from "react";
import { tareasService } from "../../api/tareas.service"; // ✅ Usamos el servicio centralizado

// 1. ACTUALIZA LA INTERFAZ (Agrega year y month)
interface FechasProps {
  year: number;
  month: number;
  onChange?: (year: number, month: number) => void;
}

// 2. MODIFICA EL COMPONENTE (Elimina la inicialización local basada en currentDate)
const FechasAdmin: React.FC<FechasProps> = ({ year, month, onChange }) => {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar tareas desde backend para extraer años disponibles
  useEffect(() => {
    const fetchFechas = async () => {
      try {
        setLoading(true);
        // Pedimos un límite alto para analizar todo el historial de fechas
        const response = await tareasService.getAll({ limit: 2000 });
        const tareasData = response.data;

        // Extrae años únicos
        const uniqueYears = new Set<number>();

        tareasData.forEach((t: any) => {
          const fechas = [
            t.fechaRegistro,
            t.fechaLimite,
            t.fechaConclusion,
            ...(t.historialFechas?.map((h: any) => h.nuevaFecha) || []),
          ];

          fechas.forEach((f) => {
            if (f) {
              const date = new Date(f);
              const y = date.getFullYear();
              if (!isNaN(y)) uniqueYears.add(y);
            }
          });
        });

        const yearsArray = Array.from(uniqueYears).sort((a, b) => a - b);
        setYears(yearsArray);

      } catch (error) {
        console.error("Error al cargar rango de fechas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFechas();
  }, []);

  // 3. CAMBIA LOS HANDLERS PARA QUE SOLO EMITAN EL EVENTO
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    onChange?.(newYear, 0); // Emite el nuevo año y mes 0 (Todos)
  };

  const handleMonthChange = (m: number) => {
    onChange?.(year, m); // Emite el mismo año y el nuevo mes
  };

  const meses = [
    { num: 1, name: "Enero" },
    { num: 2, name: "Febrero" },
    { num: 3, name: "Marzo" },
    { num: 4, name: "Abril" },
    { num: 5, name: "Mayo" },
    { num: 6, name: "Junio" },
    { num: 7, name: "Julio" },
    { num: 8, name: "Agosto" },
    { num: 9, name: "Septiembre" },
    { num: 10, name: "Octubre" },
    { num: 11, name: "Noviembre" },
    { num: 12, name: "Diciembre" },
  ];

  if (loading && years.length === 0) {
    return <div className="text-center text-xs text-gray-400 py-2">Cargando fechas...</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-5 mb-8 font-sans w-full px-3">
      {/* 🔸 Selector de Año (desktop) */}
      <div className="hidden sm:flex justify-center mb-6">
        <form className="flex items-center space-x-2 w-full sm:w-auto justify-center">
          <label
            htmlFor="year"
            className="text-md font-bold text-black whitespace-nowrap"
          >
            Año:
          </label>
          <select
            id="year"
            name="year"
            value={year}
            onChange={handleYearChange}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm font-sans
                       focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            {/* Fallback por si la lista está vacía */}
            {years.length === 0 && <option value={year}>{year}</option>}
          </select>
        </form>
      </div>

      {/* 🔸 Barra de meses (desktop) */}
      <div className="hidden sm:flex justify-center flex-wrap gap-2 mb-6 text-sm font-bold uppercase font-sans">
        <button
          onClick={() => handleMonthChange(0)}
          className={`px-4 py-2 text-lg rounded-full transition-all duration-200 mr-7 ${month === 0
            ? "bg-amber-950 text-white shadow-md"
            : "hover:bg-gray-200 hover:text-amber-800 focus:bg-gray-200 focus:text-amber-800 transition"
            }`}
        >
          Todos
        </button>

        {meses.map((m) => (
          <button
            key={m.num}
            onClick={() => handleMonthChange(m.num)}
            className={`px-4 py-2 text-lg rounded-full transition-all duration-200 ${month === m.num
              ? "bg-amber-950 text-white shadow-md"
              : "hover:bg-gray-200 hover:text-amber-800 focus:bg-gray-200 focus:text-amber-800 transition"
              }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* 📱 Selector móvil */}
      <div className="sm:hidden w-full px-4 mb-3 space-y-3">
        {/* 🔹 Selector de Año */}
        <div className="relative w-full">
          <label
            htmlFor="year-mobile"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            Año
          </label>

          <select
            id="year-mobile"
            value={year}
            onChange={(e) => handleYearChange(e as any)}
            className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2.5 pl-4 pr-10
                      text-[15px] font-medium text-gray-800 focus:border-amber-700 focus:ring-amber-700
                      focus:ring-2 shadow focus:shadow-md transition-all"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            {years.length === 0 && <option value={year}>{year}</option>}
          </select>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-[2.6rem] w-5 h-5 text-gray-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* 🔸 Selector de Mes */}
        <div className="relative w-full">
          <label
            htmlFor="month-mobile"
            className="block text-sm font-bold text-gray-700 mb-1"
          >
            Mes
          </label>

          <select
            id="month-mobile"
            value={month}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="w-full appearance-none bg-white border border-gray-300 rounded-md py-2.5 pl-4 pr-10
                      text-[15px] font-medium text-gray-800 focus:border-amber-700 focus:ring-amber-700
                      focus:ring-2 shadow focus:shadow-md transition-all"
          >
            <option value={0}>Todos</option>
            {meses.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-[2.6rem] w-5 h-5 text-gray-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FechasAdmin;