import React, { useState } from "react";
import Tabla from "./Principal/Tabla";
import Fechas from "./Principal/Fechas";
import ResumenPrincipal from "./Principal/Resumen";
import Filtros from "./Principal/Filtros";

const Principal: React.FC = () => {
  const [filtro, setFiltro] = useState<string>("pendientes");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0);
  const [responsable, setResponsable] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");

  const handleFechaChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="mx-auto max-w-7x2 px-6 lg:px-10 py-6 font-sans">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-5 text-center text-black tracking-wide leading-snug">
        TAREAS ASIGNADAS | CALIDAD
      </h1>
      {/* 🔹 Filtros superiores (año / mes) */}
      <Fechas onChange={handleFechaChange} />
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="sm:static sticky top-[100px] bg-white border-b border-gray-200 m-1">
          <ResumenPrincipal
            filtro={filtro}
            onFiltroChange={setFiltro}
            year={year}
            month={month}
            responsable={responsable}
            query={query}
          />
          <Filtros
            onResponsableChange={setResponsable}
            onBuscarChange={setQuery}
          />
        </div>
        <div className="px-1">
          <Tabla
            filtro={filtro}
            year={year}
            month={month}
            responsable={responsable}
            query={query}
          />
        </div>
      </div>
    </div>
  );
};

export default Principal;
