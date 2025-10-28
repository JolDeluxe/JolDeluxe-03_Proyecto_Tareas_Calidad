import React, { useState, useEffect } from "react";
import TablaAdmin from "./Admin/TablaAdmin";
// import FechasAdmin from "./Admin/FechasAdmin";
import ResumenPrincipalAdmin from "./Admin/ResumenAdmin";
import FiltrosAdmin from "./Admin/FiltrosAdmin";
import ModalNueva from "./Admin/ModalNueva";
import ModalAceptar from "./Admin/ModalAceptar";
import { api } from "./data/api";
import { Estatus, type Tarea } from "../types/tarea";

const Admin: React.FC = () => {
  const [filtro, setFiltro] = useState<string>("pendientes");
  // const [year, setYear] = useState<number>(new Date().getFullYear());
  // const [month, setMonth] = useState<number>(0);
  const [responsable, setResponsable] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTareas = async () => {
    try {
      setLoading(true);
      const res = await api.get<any[]>("/tareas"); // Convertimos strings ISO a objetos Date REALES

      const tareasConFechas = res.data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaConclusion: t.fechaConclusion ? new Date(t.fechaConclusion) : null,
        historialFechas:
          t.historialFechas?.map((h: any) => ({
            ...h,
            fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
            fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
            nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
          })) || [],
      }));

      setTareas(tareasConFechas as Tarea[]);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTareas();
  }, []);

  // const handleFechaChange = (newYear: number, newMonth: number) => {
  //   setYear(newYear);
  //   setMonth(newMonth);
  // };

  const handleNuevaTarea = () => {
    setOpenModal(true);
  };

  return (
    <div className="mx-auto max-w-7x2 px-6 lg:px-10 py-6 font-sans">
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-5 text-center text-black tracking-wide leading-snug">
        TAREAS ASIGNADAS | CALIDAD
      </h1>
      {/* <FechasAdmin onChange={handleFechaChange} /> */}
      <div className="flex justify-end sm:justify-between items-center mb-4">
        <button
          onClick={handleNuevaTarea}
          className="flex items-center justify-center gap-2 
                    bg-green-600 hover:bg-green-700 text-white 
                      font-semibold px-4 py-2 rounded-md shadow-md 
                      active:scale-[0.97] transition-all duration-200
                      fixed bottom-5 right-5 sm:static sm:bottom-auto sm:right-auto
                      sm:px-5 sm:py-2 sm:rounded-md sm:shadow opacity-70 z-50"
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
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="sm:static sticky top-[100px] z-40 bg-white border-b border-gray-200 m-1">
          <ResumenPrincipalAdmin
            filtro={filtro}
            onFiltroChange={setFiltro}
            // year={year}
            // month={month}
            responsable={responsable}
            query={query}
            tareas={tareas}
            loading={loading}
          />
          <FiltrosAdmin
            onResponsableChange={setResponsable}
            onBuscarChange={setQuery}
          />
        </div>
        <div className=" px-1">
          <TablaAdmin
            filtro={filtro}
            // year={year}
            // month={month}
            responsable={responsable}
            query={query}
            tareas={tareas}
            loading={loading}
            onRecargarTareas={fetchTareas}
          />
        </div>
      </div>
      {openModal && (
        <ModalNueva
          onClose={() => setOpenModal(false)}
          onTareaAgregada={fetchTareas}
        />
      )}
    </div>
  );
};

export default Admin;
