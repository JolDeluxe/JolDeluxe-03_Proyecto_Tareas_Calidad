// 📍 src/components/Admin/FiltrosAdmin.tsx

import React, { useState, useEffect } from "react";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import type { RangoFechaEspecial } from "../../pages/Admin";

// Importamos los dos componentes nuevos
import FiltrosAdminDesktop from "./FiltrosAdminDesktop";
import FiltrosAdminMobile from "./FiltrosAdminMobile";

interface FiltrosProps {
  responsable: string;
  asignador: string;
  busqueda: string;
  onResponsableChange: (usuarioId: string) => void;
  onBuscarChange?: (query: string) => void;
  user: Usuario | null;
  verCanceladas: boolean;
  onToggleCanceladas: () => void;
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
  onAsignadorChange: (usuarioId: string) => void;
  filtroMisTareas: { asignadasPorMi: boolean; asignadasAMi: boolean };
  onFiltroMisTareasChange: (val: { asignadasPorMi: boolean; asignadasAMi: boolean }) => void;
  conteoMisTareas: { porMi: number; aMi: number };
}

const FiltrosAdmin: React.FC<FiltrosProps> = ({
  responsable,
  asignador,
  busqueda,
  onResponsableChange,
  onBuscarChange,
  user,
  verCanceladas,
  onToggleCanceladas,
  filtroUrgencia,
  onUrgenciaChange,
  filtroExtra,
  onFiltroExtraChange,
  filtroActivo,
  totalTareas,
  filtroFechaRegistro,
  filtroFechaLimite,
  onFiltroFechaRegistroChange,
  onFiltroFechaLimiteChange,
  onAsignadorChange,
  filtroMisTareas,
  onFiltroMisTareasChange,
  conteoMisTareas
}) => {
  // --- Estados ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar Usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Pedimos un límite alto (1000) para llenar el Select con todos los usuarios
        const response = await usuariosService.getAll({ limit: 1000 });

        let todosLosUsuarios: Usuario[] = [];
        if (Array.isArray(response)) {
          todosLosUsuarios = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          todosLosUsuarios = response.data;
        }

        // Filtramos para que SOLO aparezcan usuarios internos (No Invitados)
        const data = todosLosUsuarios.filter(u => u.rol !== "INVITADO");

        const listaOrdenada = data.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        setUsuarios(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [user]);

  // --- HANDLERS RESPONSABLE ---
  const getSelectedUsuarioNombreResumido = () => {
    if (responsable === "Todos") return "Todos";
    const usuario = usuarios.find((u) => u.id.toString() === responsable);
    if (!usuario) return "Desconocido";
    return usuario.nombre.split(" ")[0];
  };

  const handleUsuarioSelect = (id: string) => {
    onResponsableChange(id);
  };

  const handleLimpiarResponsable = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onResponsableChange("Todos");
  };

  // --- HANDLERS ASIGNADOR ---
  const handleAsignadorSelect = (id: string) => {
    onAsignadorChange(id);
  };

  const handleLimpiarAsignador = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onAsignadorChange("Todos");
  };

  // --- HANDLERS BÚSQUEDA ---
  const handleSearchChange = (val: string) => {
    if (onBuscarChange) onBuscarChange(val);
  };

  const handleLimpiarBusqueda = () => {
    if (onBuscarChange) onBuscarChange("");
  };

  return (
    <div className="w-full bg-white font-sans border-b border-gray-200">

      {/* VISTA ESCRITORIO */}
      <FiltrosAdminDesktop
        user={user}
        usuarios={usuarios}
        loading={loading}
        selectedUsuarioId={responsable}
        nombreResumido={getSelectedUsuarioNombreResumido()}
        searchText={busqueda}
        onUsuarioSelect={handleUsuarioSelect}
        onLimpiarResponsable={handleLimpiarResponsable}
        onSearchChange={handleSearchChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        verCanceladas={verCanceladas}
        onToggleCanceladas={onToggleCanceladas}
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
        selectedAsignadorId={asignador}
        onAsignadorSelect={handleAsignadorSelect}
        onLimpiarAsignador={handleLimpiarAsignador}
        filtroMisTareas={filtroMisTareas}
        onFiltroMisTareasChange={onFiltroMisTareasChange}
        conteoMisTareas={conteoMisTareas}
      />

      {/* VISTA MOVIL */}
      <FiltrosAdminMobile
        usuarios={usuarios}
        loading={loading}
        selectedUsuarioId={responsable}
        nombreResumido={getSelectedUsuarioNombreResumido()}
        searchText={busqueda}
        onUsuarioSelect={handleUsuarioSelect}
        onLimpiarResponsable={handleLimpiarResponsable}
        onSearchChange={handleSearchChange}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        verCanceladas={verCanceladas}
        onToggleCanceladas={onToggleCanceladas}
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
        selectedAsignadorId={asignador}
        onAsignadorSelect={handleAsignadorSelect}
        onLimpiarAsignador={handleLimpiarAsignador}
        user={user}
        filtroMisTareas={filtroMisTareas}
        onFiltroMisTareasChange={onFiltroMisTareasChange}
        conteoMisTareas={conteoMisTareas}
      />

    </div>
  );
};

export default FiltrosAdmin;