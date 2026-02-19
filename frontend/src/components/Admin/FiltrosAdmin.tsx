// 📍 src/components/Admin/FiltrosAdmin.tsx

import React, { useState, useEffect } from "react";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import type { RangoFechaEspecial } from "../../pages/Admin";

// Importamos los dos componentes nuevos
import FiltrosAdminDesktop from "./FiltrosAdminDesktop";
import FiltrosAdminMobile from "./FiltrosAdminMobile";

interface FiltrosProps {
  onResponsableChange: (usuarioId: string) => void;
  onBuscarChange?: (query: string) => void;
  user: Usuario | null;
  verCanceladas: boolean;
  onToggleCanceladas: () => void;
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  // ✅ CORRECCIÓN: Definición completa de tipos
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number;
  // ✅ Props de Fechas Específicas
  filtroFechaRegistro: RangoFechaEspecial;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaRegistroChange: (val: RangoFechaEspecial) => void;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
}

const FiltrosAdmin: React.FC<FiltrosProps> = ({
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
  // ✅ 1. RECIBIMOS LAS PROPS AQUÍ
  filtroFechaRegistro,
  filtroFechaLimite,
  onFiltroFechaRegistroChange,
  onFiltroFechaLimiteChange
}) => {
  // --- Estados ---
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("Todos"); // ID seleccionado
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); // Objetos Usuario completos
  const [searchText, setSearchText] = useState(""); // ✅ Estado para el texto del buscador
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

  // --- HANDLERS (Compartidos para Movil y Desktop) ---

  // Helper para mostrar el nombre resumido (Primer Nombre)
  const getSelectedUsuarioNombreResumido = () => {
    if (selectedUsuarioId === "Todos") return "Todos";
    const usuario = usuarios.find((u) => u.id.toString() === selectedUsuarioId);
    if (!usuario) return "Desconocido";
    return usuario.nombre.split(" ")[0];
  };

  const handleUsuarioSelect = (id: string) => {
    setSelectedUsuarioId(id);
    onResponsableChange(id);
  };

  const handleLimpiarResponsable = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedUsuarioId("Todos");
    onResponsableChange("Todos");
  };

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
      <FiltrosAdminDesktop
        usuarios={usuarios}
        loading={loading}
        selectedUsuarioId={selectedUsuarioId}
        nombreResumido={getSelectedUsuarioNombreResumido()}
        searchText={searchText}
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
        // ✅ 2. PASAMOS LAS PROPS A DESKTOP
        filtroFechaRegistro={filtroFechaRegistro}
        filtroFechaLimite={filtroFechaLimite}
        onFiltroFechaRegistroChange={onFiltroFechaRegistroChange}
        onFiltroFechaLimiteChange={onFiltroFechaLimiteChange}
      />

      {/* VISTA MOVIL */}
      <FiltrosAdminMobile
        usuarios={usuarios}
        loading={loading}
        selectedUsuarioId={selectedUsuarioId}
        nombreResumido={getSelectedUsuarioNombreResumido()}
        searchText={searchText}
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
      // ✅ 3. PASAMOS LAS PROPS A MÓVIL
      // filtroFechaRegistro={filtroFechaRegistro}
      // filtroFechaLimite={filtroFechaLimite}
      // onFiltroFechaRegistroChange={onFiltroFechaRegistroChange}
      // onFiltroFechaLimiteChange={onFiltroFechaLimiteChange}
      />

    </div>
  );
};

export default FiltrosAdmin;