import React, { useState, useEffect, useCallback } from "react";
import TablaUsuarios from "../components/Usuarios/TablaUsuarios";
import ResumenUsuarios from "../components/Usuarios/ResumenUsuarios";
import FiltrosUsuarios from "../components/Usuarios/FiltrosUsuarios";
import ModalUsuario from "../components/Usuarios/ModalUsuario";
import { usuariosService } from "../api/usuarios.service";
import { departamentosService } from "../api/departamentos.service";
import type { Usuario } from "../types/usuario";
import type { Departamento } from "../api/departamentos.service";

interface UsuariosProps {
  user: Usuario | null;
}

const Usuarios: React.FC<UsuariosProps> = ({ user }) => {
  // --- Estados de Filtros y Paginación ---
  const [filtro, setFiltro] = useState<string>("TODOS");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // --- Estados de Datos ---
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // --- Estados de Metadatos ---
  const [totalItems, setTotalItems] = useState(0);
  const [resumenRoles, setResumenRoles] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState(1);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // --- Carga de Datos ---
  const fetchUsuarios = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        q: query,
      };

      if (filtro !== "TODOS") {
        params.rol = filtro;
      }

      const [responseUsuarios, deptosData] = await Promise.all([
        usuariosService.getAll(params),
        departamentos.length === 0 ? departamentosService.getAll() : Promise.resolve(departamentos)
      ]);

      setUsuarios(responseUsuarios.data);
      setTotalItems(responseUsuarios.meta.totalItems);
      setResumenRoles(responseUsuarios.meta.resumenRoles);
      setTotalPages(responseUsuarios.meta.totalPaginas);

      if (departamentos.length === 0) {
        setDepartamentos(deptosData as Departamento[]);
      }

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }, [user, page, limit, query, filtro]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // ✅ CORRECCIÓN 1: Envolvemos en useCallback para evitar el ciclo infinito con FiltrosUsuarios
  const handleSearchChange = useCallback((nuevaQuery: string) => {
    // Solo actualizamos si el valor es diferente para evitar reseteos innecesarios
    setQuery((prev) => {
      if (prev !== nuevaQuery) {
        setPage(1); // Resetear página solo si cambia la búsqueda
        return nuevaQuery;
      }
      return prev;
    });
  }, []);

  // ✅ CORRECCIÓN 2: También es buena práctica envolver este
  const handleFilterChange = useCallback((nuevoFiltro: string) => {
    setFiltro(nuevoFiltro);
    setPage(1);
  }, []);

  if (!user) return null;

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={fetchUsuarios}
        disabled={loading}
        className={`p-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all fixed bottom-20 right-6 z-50 lg:bottom-180 lg:right-10 ${loading ? "opacity-75 cursor-wait" : ""}`}
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
          onClick={() => setOpenModal(true)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md fixed bottom-40 right-5 sm:static z-30 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Agregar nuevo usuario</span>
        </button>
      </div>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">

          <ResumenUsuarios
            total={totalItems}
            conteos={resumenRoles}
            loading={loading}
            filtroActual={filtro}
            onFilterChange={handleFilterChange}
          />

          <FiltrosUsuarios
            onBuscarChange={handleSearchChange}
            user={user}
          />
        </div>

        <div className="px-1">
          <TablaUsuarios
            usuarios={usuarios}
            loading={loading}
            onRecargarUsuarios={fetchUsuarios}
            currentUser={user}
            departamentos={departamentos}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
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
          departamentos={departamentos}
        />
      )}
    </div>
  );
};

export default Usuarios;