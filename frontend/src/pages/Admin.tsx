// 📍 src/pages/Admin.tsx

import React, { useState, useEffect, useCallback } from "react";
import TablaAdmin from "../components/Admin/TablaAdmin";
import ResumenPrincipalAdmin from "../components/Admin/ResumenAdmin";
import FiltrosAdmin from "../components/Admin/FiltrosAdmin";
import ModalNueva from "../components/Admin/ModalNueva";
import { tareasService } from "../api/tareas.service";
import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";

interface AdminProps {
  user: Usuario | null;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  const [filtro, setFiltro] = useState<string>("pendientes");
  const [responsable, setResponsable] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ 1. NUEVO ESTADO PARA EL MODO KAIZEN
  const [isKaizen, setIsKaizen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleNuevaTarea = () => {
    setOpenModal(true);
  };

  const fetchTareas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tareasService.getAll();
      console.log("TAREAS RECIBIDAS POR LA API:", res);
      setTareas(res);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTareas();
  }, [refreshKey, fetchTareas]);

  // ✅ 2. LÓGICA DE FILTRADO KAIZEN
  // Separa las tareas antes de enviarlas a la tabla/resumen
  const tareasFiltradasPorModo = tareas.filter((t) => {
    const nombreTarea = t.tarea || "";
    const esKaizen = nombreTarea.trim().toUpperCase().startsWith("KAIZEN");
    return isKaizen ? esKaizen : !esKaizen;
  });

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={handleRefresh}
        className="
          p-2 bg-blue-600 text-white rounded-full shadow-lg 
          hover:bg-blue-700 active:scale-95 transition-all
          fixed bottom-40 right-6 z-50
          lg:absolute lg:top-20 lg:right-10 lg:bottom-auto
        "
        aria-label="Actualizar tareas"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      {/* ✅ 3. TÍTULO DINÁMICO */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {isKaizen ? "ADMINISTRA KAIZEN" : "ADMINISTRA TAREAS"}
      </h1>

      <div className="flex justify-end sm:justify-between items-center mb-4">
        <button
          onClick={handleNuevaTarea}
          className="flex items-center justify-center gap-2 
                     bg-green-600 hover:bg-green-700 text-white 
                     font-semibold px-4 py-2 rounded-md shadow-md 
                     active:scale-[0.97] transition-all duration-200
                     fixed bottom-20 right-5 sm:static sm:bottom-auto sm:right-auto
                     sm:px-5 sm:py-2 sm:rounded-md sm:shadow 
                     z-30 sm:z-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 "
          >
            <path
              fillRule="evenodd"
              d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Agregar nueva tarea</span>
        </button>
      </div>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          <ResumenPrincipalAdmin
            filtro={filtro}
            onFiltroChange={setFiltro}
            responsable={responsable}
            query={query}
            // ✅ 4. PASAR TAREAS FILTRADAS AL RESUMEN
            tareas={tareasFiltradasPorModo}
            loading={loading}
            user={user}
          />
          <FiltrosAdmin
            onResponsableChange={setResponsable}
            onBuscarChange={setQuery}
            user={user}
            // ✅ 5. CONECTAR EL SWITCH KAIZEN
            onKaizenChange={setIsKaizen}
          />
        </div>

        <div className="px-1">
          <TablaAdmin
            filtro={filtro}
            responsable={responsable}
            query={query}
            // ✅ 6. PASAR TAREAS FILTRADAS A LA TABLA
            tareas={tareasFiltradasPorModo}
            loading={loading}
            onRecargarTareas={fetchTareas}
            user={user}
          />
        </div>
      </div>

      {openModal && (
        <ModalNueva
          onClose={() => setOpenModal(false)}
          onTareaAgregada={fetchTareas}
          user={user}
        />
      )}
    </div>
  );
};

export default Admin;
