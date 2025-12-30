import { useState, useEffect } from "react";
import { usuariosService } from "../../api/usuarios.service";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import { type Usuario } from "../../types/usuario";

// Componentes modulares
import TablaUsuarios from "./usuarios/TablaUsuarios";
import ModalUsuario from "./usuarios/ModalUsuario";
import ResumenUsuarios from "./usuarios/ResumenUsuarios";

const GestionUsuariosGlobal = () => {
  // --- Estados de Datos ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de Filtros y UI ---
  const [filtroRol, setFiltroRol] = useState("ALL");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // --- Estados del Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);

  // --- Carga de Datos ---
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Pedimos usuarios (Si mostrarInactivos es true, pedimos INACTIVOS, sino ACTIVOS por defecto)
      const estatusRequest = mostrarInactivos ? 'INACTIVO' : 'ACTIVO';

      const [usersData, deptosData] = await Promise.all([
        usuariosService.getAll({ estatus: estatusRequest }),
        departamentosService.getAll()
      ]);

      setUsuarios(usersData);
      setDeptos(deptosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambia el switch de inactivos
  useEffect(() => {
    cargarDatos();
  }, [mostrarInactivos]);


  // --- Manejadores (CRUD) ---

  const handleGuardar = async (payload: any) => {
    try {
      if (usuarioEditar) {
        await usuariosService.update(usuarioEditar.id, payload);
      } else {
        await usuariosService.create(payload);
      }
      setModalOpen(false);
      cargarDatos(); // Refrescar tabla
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert("Error al guardar usuario. Verifique los datos.");
    }
  };

  const handleToggleStatus = async (usuario: Usuario) => {
    const nuevoEstatus = usuario.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstatus === 'INACTIVO' ? 'desactivar' : 'reactivar';

    if (!window.confirm(`¿Estás seguro de que deseas ${accion} a ${usuario.nombre}?`)) return;

    try {
      await usuariosService.updateEstatus(usuario.id, nuevoEstatus);
      cargarDatos();
    } catch (error) {
      console.error("Error cambiando estatus:", error);
      alert("No se pudo cambiar el estatus del usuario.");
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

  // --- Lógica de Filtrado Frontend (Roles) ---
  const usuariosFiltrados = usuarios.filter(u => {
    if (filtroRol === "ALL") return true;
    return u.rol === filtroRol;
  });

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-0">

      {/* 1. Resumen y Filtros Rápidos */}
      <ResumenUsuarios
        usuarios={usuarios}
        onFilterChange={setFiltroRol}
        filtroActual={filtroRol}
      />

      {/* 2. Barra de Herramientas (Switch Inactivos + Botón Nuevo) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

        {/* Switch para ver Inactivos */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${mostrarInactivos ? 'text-slate-400' : 'text-slate-800'}`}>Ver Activos</span>

          <button
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mostrarInactivos ? 'bg-red-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mostrarInactivos ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>

          <span className={`text-sm font-bold ${mostrarInactivos ? 'text-red-600' : 'text-slate-400'}`}>Ver Papelera (Inactivos)</span>
        </div>

        {/* Botón Nuevo */}
        <button
          onClick={abrirModalCrear}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Nuevo Usuario
        </button>
      </div>

      {/* 3. Tabla de Resultados */}
      <TablaUsuarios
        usuarios={usuariosFiltrados}
        deptos={deptos}
        loading={loading}
        onEdit={abrirModalEditar}
        onToggleStatus={handleToggleStatus}
        mostrarInactivos={mostrarInactivos}
      />

      {/* 4. Modal (Create/Edit) */}
      <ModalUsuario
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        usuarioAEditar={usuarioEditar}
        departamentos={deptos}
      />

    </div>
  );
};

export default GestionUsuariosGlobal;