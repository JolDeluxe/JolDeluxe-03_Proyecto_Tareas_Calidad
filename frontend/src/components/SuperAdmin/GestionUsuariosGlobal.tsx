import React, { useState, useEffect, useMemo } from "react";
import { usuariosService } from "../../api/usuarios.service";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import { type Usuario, Rol } from "../../types/usuario";
import { toast } from "react-toastify";

// Componentes modulares
import TablaUsuarios from "./usuarios/TablaUsuarios";
import ModalUsuario from "./usuarios/ModalUsuario";
import ResumenUsuarios from "./usuarios/ResumenUsuarios";
import ModalConfirmarEstatus from "../../components/Usuarios/ModalConfirmarEstatus";

// Utilidad para normalizar texto (Quita acentos y pasa a minúsculas)
const normalizeText = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const GestionUsuariosGlobal = () => {
  // --- Estados de Datos ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de Filtros Avanzados y UI ---
  const [filtroRol, setFiltroRol] = useState("ALL");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDepto, setFiltroDepto] = useState("TODOS");

  // --- Estados de Paginación y Ordenamiento ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] = useState<string>("rolJerarquia");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // --- Estados del Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [usuarioConfirmar, setUsuarioConfirmar] = useState<Usuario | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // --- Carga de Datos ---
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const estatusRequest = mostrarInactivos ? 'INACTIVO' : 'ACTIVO';
      const [usersResponse, deptosData] = await Promise.all([
        usuariosService.getAll({
          estatus: estatusRequest,
          limit: 10000,
          page: 1
        }),
        departamentosService.getAll()
      ]);

      setUsuarios(usersResponse.data);
      setDeptos(deptosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error al cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    setPage(1);
  }, [mostrarInactivos]);

  // --- Manejadores (CRUD) ---
  const handleGuardar = async (payload: any) => {
    try {
      if (usuarioEditar) {
        await usuariosService.update(usuarioEditar.id, payload);
        toast.success("Usuario actualizado correctamente.");
      } else {
        await usuariosService.create(payload);
        toast.success("Usuario creado correctamente.");
      }
      setModalOpen(false);
      cargarDatos();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Error al procesar la solicitud.";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("ya existe")) {
        throw new Error("El nombre de usuario ya está en uso.");
      }
      toast.error(msg);
      throw error;
    }
  };

  const handleToggleStatus = async () => {
    if (!usuarioConfirmar) return;
    setIsConfirming(true);
    const nuevoEstatus = usuarioConfirmar.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    try {
      await usuariosService.updateEstatus(usuarioConfirmar.id, nuevoEstatus);
      toast.success(`Usuario ${nuevoEstatus === 'ACTIVO' ? 'reactivado' : 'desactivado'} correctamente.`);
      cargarDatos();
      setConfirmModalOpen(false);
      setUsuarioConfirmar(null);
    } catch (error) {
      console.error("Error cambiando estatus:", error);
      toast.error("No se pudo cambiar el estatus del usuario.");
    } finally {
      setIsConfirming(false);
    }
  };

  const abrirModalCrear = () => {
    setUsuarioEditar(null);
    setModalOpen(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditar(usuario);
    setModalOpen(true);
  };

  const solicitarCambioEstatus = (usuario: Usuario) => {
    setUsuarioConfirmar(usuario);
    setConfirmModalOpen(true);
  };

  // =========================================================================
  // 🧠 LÓGICA DEL PADRE COMO CEREBRO (DOBLE FILTRADO)
  // =========================================================================

  // 1. FILTRO BASE (Departamento y Búsqueda). Este alimenta a las tarjetas (ResumenUsuarios)
  const usuariosParaResumen = useMemo(() => {
    return usuarios.filter(u => {
      if (u.rol === "INVITADO") return false;

      // Filtro por Departamento
      if (filtroDepto !== "TODOS") {
        if (filtroDepto === "GLOBAL" && u.departamentoId !== null) return false;
        if (filtroDepto !== "GLOBAL" && String(u.departamentoId) !== filtroDepto) return false;
      }

      // Búsqueda por Nombre / Username
      if (busqueda.trim() !== "") {
        const queryTerm = normalizeText(busqueda);
        const nombreNorm = normalizeText(u.nombre);
        const usernameNorm = normalizeText(u.username);
        if (!nombreNorm.includes(queryTerm) && !usernameNorm.includes(queryTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [usuarios, filtroDepto, busqueda]);

  // 2. FILTRO FINAL (Añade el Rol seleccionado). Este alimenta a la Tabla.
  const usuariosParaTabla = useMemo(() => {
    if (filtroRol === "ALL") return usuariosParaResumen;
    return usuariosParaResumen.filter(u => u.rol === filtroRol);
  }, [usuariosParaResumen, filtroRol]);

  // 3. ORDENAMIENTO (Sobre la tabla final)
  const usuariosOrdenados = useMemo(() => {
    const sorted = [...usuariosParaTabla];

    sorted.sort((a, b) => {
      if (sortBy === "rolJerarquia") {
        const roleWeight: Record<string, number> = {
          [Rol.SUPER_ADMIN]: 0, [Rol.ADMIN]: 1, [Rol.ENCARGADO]: 2, [Rol.USUARIO]: 3, [Rol.INVITADO]: 4
        };
        const weightA = roleWeight[a.rol] ?? 99;
        const weightB = roleWeight[b.rol] ?? 99;

        if (weightA < weightB) return sortDirection === "asc" ? -1 : 1;
        if (weightA > weightB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      const valA = String(a[sortBy as keyof Usuario] || "").toLowerCase();
      const valB = String(b[sortBy as keyof Usuario] || "").toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [usuariosParaTabla, sortBy, sortDirection]);

  // 4. PAGINACIÓN
  const usuariosPaginados = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return usuariosOrdenados.slice(startIndex, startIndex + limit);
  }, [usuariosOrdenados, page, limit]);

  const paginasReales = Math.max(1, Math.ceil(usuariosOrdenados.length / limit));

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-0">

      {/* 1. Resumen y Filtros Rápidos (Píldoras Superiores) */}
      <ResumenUsuarios
        usuarios={usuariosParaResumen} // ✅ ¡AHORA RECIBE LA LISTA FILTRADA POR DEPTO!
        onFilterChange={(val) => { setFiltroRol(val); setPage(1); }}
        filtroActual={filtroRol}
        loading={loading}
      />

      {/* 2. Barra de Herramientas y Búsqueda Avanzada */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-5">

        {/* Fila Superior: Buscador y Select de Departamento rediseñados */}
        <div className="flex flex-col md:flex-row gap-4 w-full">

          {/* Input Buscador Moderno */}
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm shadow-sm transition-all hover:border-indigo-300"
            />
          </div>

          {/* Select Filtro Departamento */}
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <select
              value={filtroDepto}
              onChange={(e) => { setFiltroDepto(e.target.value); setPage(1); }}
              className="block w-full pl-11 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm appearance-none font-medium text-slate-700 shadow-sm transition-all cursor-pointer hover:border-indigo-300"
            >
              <option value="TODOS">Todos los usuarios</option>
              <option value="GLOBAL">Global / Sin Departamento</option>

              {/* Uso de OptGroup para agrupar visualmente sin emojis */}
              <optgroup label="Departamentos Específicos">
                {deptos.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.nombre}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

        </div>

        {/* Fila Inferior: Switch Inactivos y Botón Nuevo */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 border-t border-slate-200/60">
          <div className="flex items-center gap-3 select-none bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className={`text-sm font-bold transition-colors ${mostrarInactivos ? 'text-slate-400' : 'text-indigo-900'}`}>Ver Activos</span>
            <button
              onClick={() => setMostrarInactivos(!mostrarInactivos)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shadow-inner ${mostrarInactivos ? 'bg-red-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${mostrarInactivos ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-bold transition-colors flex items-center gap-1 ${mostrarInactivos ? 'text-red-600' : 'text-slate-400'}`}>
              Ver Papelera
            </span>
          </div>

          <button
            onClick={abrirModalCrear}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-200 shadow-md flex items-center gap-2 cursor-pointer active:scale-95 w-full md:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* 3. Tabla de Resultados (Dumb Component) */}
      <TablaUsuarios
        usuarios={usuariosPaginados}
        total={usuariosOrdenados.length}
        deptos={deptos}
        loading={loading}
        onEdit={abrirModalEditar}
        onToggleStatus={solicitarCambioEstatus}
        page={page}
        totalPages={paginasReales}
        onPageChange={setPage}
        sortConfig={{ key: sortBy as any, direction: sortDirection }}
        onSortChange={(key, direction) => {
          setSortBy(key);
          setSortDirection(direction);
          setPage(1);
        }}
      />

      {/* 4. Modales Inquebrantables */}
      {modalOpen && (
        <ModalUsuario
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardar}
          usuarioAEditar={usuarioEditar}
          departamentos={deptos}
        />
      )}

      {confirmModalOpen && (
        <ModalConfirmarEstatus
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setUsuarioConfirmar(null);
          }}
          onConfirm={handleToggleStatus}
          usuario={usuarioConfirmar}
          isSubmitting={isConfirming}
        />
      )}
    </div>
  );
};

export default GestionUsuariosGlobal;