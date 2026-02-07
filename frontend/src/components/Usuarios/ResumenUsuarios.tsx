import React, { useMemo } from "react";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface Props {
  usuarios: Usuario[];
  loading?: boolean;
  query?: string;
  filtroActual: string;
  onFilterChange: (filtro: string) => void;
}

const ResumenUsuarios: React.FC<Props> = ({
  usuarios,
  onFilterChange,
  filtroActual,
  loading,
  query
}) => {

  // --- 1. Cálculo de Métricas ---
  const metricas = useMemo(() => {
    if (!usuarios || !Array.isArray(usuarios)) {
      return { miEquipo: 0, invitados: 0, total: 0 };
    }

    const total = usuarios.length;
    // Invitados: Rol explícito INVITADO
    const invitados = usuarios.filter((u) => u.rol === Rol.INVITADO).length;
    // Mi Equipo: Todo lo demás (ADMIN, ENCARGADO, USUARIO del mismo depto)
    const miEquipo = total - invitados;

    return { miEquipo, invitados, total };
  }, [usuarios]);

  // --- 2. Loading State ---
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-pulse">
        <div className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
        <div className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
      </div>
    );
  }

  // --- 3. Componente de Botón (Estilo Super Admin) ---
  const FilterButton = ({ label, sublabel, count, value, colorClass }: any) => {
    const isActive = filtroActual === value;

    // Si hago clic en el que ya está activo, lo desactivo ("TODOS"), si no, activo el nuevo valor.
    const handleClick = () => {
      onFilterChange(isActive ? "TODOS" : value);
    };

    return (
      <button
        onClick={handleClick}
        className={`flex items-center justify-between p-4 rounded-xl border transition-all w-full text-left group
          ${isActive
            ? `bg-white border-${colorClass}-500 ring-1 ring-${colorClass}-500 shadow-md`
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm opacity-90 hover:opacity-100'
          }`}
      >
        <div>
          <p className={`text-xs font-bold uppercase mb-1 transition-colors ${isActive ? `text-${colorClass}-600` : 'text-slate-500'}`}>
            {label}
          </p>
          <p className="text-xs text-slate-400 font-medium mb-1">{sublabel}</p>
          <p className="text-3xl font-black text-slate-800">{count}</p>
        </div>

        {/* Indicador visual (círculo) */}
        <div className={`w-3 h-3 rounded-full transition-colors ${isActive ? `bg-${colorClass}-500` : 'bg-slate-200 group-hover:bg-slate-300'}`}></div>
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* Mensaje de búsqueda si existe */}
      {query && (
        <div className="mb-4 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-yellow-700 rounded-r-md flex items-center gap-2">
          <span>🔍</span> Resultados para: <span className="font-bold">"{query}"</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* Tarjeta Mi Equipo (Indigo) */}
        <FilterButton
          label="Mi Equipo"
          sublabel="Personal de mi Departamento"
          count={metricas.miEquipo}
          value="MI_EQUIPO"
          colorClass="indigo"
        />

        {/* Tarjeta Invitados (Amber) */}
        <FilterButton
          label="Invitados"
          sublabel="Usuarios Externos"
          count={metricas.invitados}
          value="INVITADOS"
          colorClass="amber"
        />

      </div>
    </div>
  );
};

export default ResumenUsuarios;