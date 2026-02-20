// 📍 src/components/Pendientes/Filtros/FiltrosPendientes.tsx

import React, { useState } from "react";
import type { Usuario } from "../../../types/usuario";
import type { RangoFechaEspecial } from "../../../pages/Admin";

import FiltrosPendientesDesktop from "./FiltrosPendientesDesktop";
import FiltrosPendientesMobile from "./FiltrosPendientesMobile";

interface FiltrosProps {
  onBuscarChange?: (query: string) => void;
  user: Usuario | null;
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number;
  filtroFechaRegistro: RangoFechaEspecial;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaRegistroChange: (val: RangoFechaEspecial) => void;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
}

const FiltrosPendientes: React.FC<FiltrosProps> = ({
  onBuscarChange,
  user,
  filtroUrgencia,
  onUrgenciaChange,
  filtroExtra,
  onFiltroExtraChange,
  filtroActivo,
  totalTareas,
  filtroFechaRegistro,
  filtroFechaLimite,
  onFiltroFechaRegistroChange,
  onFiltroFechaLimiteChange
}) => {
  const [searchText, setSearchText] = useState("");

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (onBuscarChange) onBuscarChange(val);
  };

  const handleLimpiarBusqueda = () => {
    setSearchText("");
    if (onBuscarChange) onBuscarChange("");
  };

  return (
    <div className="w-full bg-white font-sans border-b border-gray-200">
      {/* VISTA ESCRITORIO */}
      <FiltrosPendientesDesktop
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        filtroUrgencia={filtroUrgencia}
        onUrgenciaChange={onUrgenciaChange}
        filtroExtra={filtroExtra}
        onFiltroExtraChange={onFiltroExtraChange}
        filtroActivo={filtroActivo}
        totalTareas={totalTareas}
        filtroFechaRegistro={filtroFechaRegistro}
        filtroFechaLimite={filtroFechaLimite}
        onFiltroFechaRegistroChange={onFiltroFechaRegistroChange}
        onFiltroFechaLimiteChange={onFiltroFechaLimiteChange}
      />

      {/* VISTA MOVIL */}
      <FiltrosPendientesMobile
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        filtroUrgencia={filtroUrgencia}
        onUrgenciaChange={onUrgenciaChange}
        filtroExtra={filtroExtra}
        onFiltroExtraChange={onFiltroExtraChange}
        filtroActivo={filtroActivo}
        totalTareas={totalTareas}
        filtroFechaRegistro={filtroFechaRegistro}
        filtroFechaLimite={filtroFechaLimite}
        onFiltroFechaRegistroChange={onFiltroFechaRegistroChange}
        onFiltroFechaLimiteChange={onFiltroFechaLimiteChange}
      />
    </div>
  );
};

export default FiltrosPendientes;