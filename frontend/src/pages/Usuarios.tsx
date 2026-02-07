import React, { useState, useEffect, useCallback } from "react";
import TablaUsuarios from "../components/Usuarios/TablaUsuarios";
import ResumenUsuarios from "../components/Usuarios/ResumenUsuarios";
import FiltrosUsuarios from "../components/Usuarios/FiltrosUsuarios";
import ModalUsuario from "../components/Usuarios/ModalUsuario";
import { usuariosService } from "../api/usuarios.service";
import type { Usuario } from "../types/usuario";

interface UsuariosProps {
  user: Usuario | null;
}

const Usuarios: React.FC<UsuariosProps> = ({ user }) => {
  // Estado para el filtro: "TODOS", "MI_EQUIPO", "INVITADOS"
  const [filtro, setFiltro] = useState<string>("TODOS");
  const [query, setQuery] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const handleRefresh = () => {
    setLoading(true);
    fetchUsuarios();
  };

  const handleNuevoUsuario = () => {
    setOpenModal(true);
  };

  const fetchUsuarios = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Pedimos las dos listas por separado y las unimos
      // 1. getAll() -> Trae usuarios de MI departamento (según tu backend actual)
      // 2. getInvitados() -> Trae todos los invitados
      const [equipo, invitados] = await Promise.all([
        usuariosService.getAll(),
        usuariosService.getInvitados()
      ]);

      const listaEquipo = Array.isArray(equipo) ? equipo : [];
      const listaInvitados = Array.isArray(invitados) ? invitados : [];

      // Unimos las listas evitando duplicados por ID (por seguridad)
      const todos = [...listaEquipo];
      const idsExistentes = new Set(todos.map(u => u.id));

      listaInvitados.forEach(inv => {
        if (!idsExistentes.has(inv.id)) {
          todos.push(inv);
        }
      });

      setUsuarios(todos);

    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  if (!user) return null;

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      {/* Botón Flotante */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`p-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all duration-300 active:scale-90 fixed bottom-20 right-6 z-50 lg:bottom-180 lg:right-10 ${loading ? "opacity-75 cursor-wait" : ""}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 ${loading ? "animate-spin" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        ADMINISTRA USUARIOS
      </h1>

      <div className="flex justify-end sm:justify-between items-center mb-4">
        <div className="hidden sm:block"></div>
        <button
          onClick={handleNuevoUsuario}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md active:scale-[0.97] transition-all duration-200 fixed bottom-40 right-5 sm:static sm:bottom-auto sm:right-auto sm:px-5 sm:py-2 sm:rounded-md sm:shadow z-30 sm:z-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Agregar nuevo usuario</span>
        </button>
      </div>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">

          {/* ✅ AQUÍ CONECTAMOS EL FILTRO */}
          <ResumenUsuarios
            query={query}
            usuarios={usuarios}
            loading={loading}
            filtroActual={filtro}
            onFilterChange={setFiltro}
          />

          <FiltrosUsuarios
            onBuscarChange={setQuery}
            user={user}
          />
        </div>

        <div className="px-1">
          {/* ✅ PASAMOS EL FILTRO A LA TABLA */}
          <TablaUsuarios
            filtro={filtro}
            query={query}
            usuarios={usuarios}
            loading={loading}
            onRecargarUsuarios={fetchUsuarios}
            currentUser={user}
          />
        </div>
      </div>

      {openModal && (
        <ModalUsuario
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSuccess={() => {
            fetchUsuarios();
            setOpenModal(false);
          }}
          usuarioAEditar={null}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default Usuarios;