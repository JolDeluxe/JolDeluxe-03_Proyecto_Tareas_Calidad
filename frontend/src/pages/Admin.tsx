// 📍 src/pages/Admin.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";

// --- Componentes de Administración ---
import TablaAdmin from "../components/Admin/TablaAdmin";
import ResumenPrincipalAdmin from "../components/Admin/ResumenAdmin";
import FiltrosAdmin from "../components/Admin/FiltrosAdmin";
import ModalNueva from "../components/Admin/ModalNueva";
import FechasAdmin from "../components/Admin/FechasAdmin";

// --- Componentes de Métricas ---
import ResumenPrincipalDash from "../components/Principal/ResumenDash";
import DashboardMetricas from "../components/Principal/DashboardMetricas";

// --- API y Tipos ---
import { tareasService, type TareaFilters, type TareasResponse } from "../api/tareas.service";
import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";

// ---> AGREGAR DEBAJO DE LOS IMPORTS EN Admin.tsx <---
export type TipoFiltroFecha = "TODAS" | "HOY" | "MANANA" | "ESTA_SEMANA" | "PERSONALIZADO";

export interface RangoFechaEspecial {
  tipo: TipoFiltroFecha;
  inicio: Date | null;
  fin: Date | null;
}

const defaultRango: RangoFechaEspecial = { tipo: "TODAS", inicio: null, fin: null };

// Helper: Obtener Lunes y Domingo de la semana actual
const getEstaSemana = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 es Domingo, 1 es Lunes
  // Ajuste para que la semana empiece el Lunes
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return { inicio: lunes, fin: domingo };
};

// Helper: Formatear a media noche o fin de día
const getHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

const getManana = () => {
  const i = new Date(); i.setDate(i.getDate() + 1); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setDate(f.getDate() + 1); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

type ViewMode = "TAREAS" | "INDICADORES";

interface AdminProps {
  user: Usuario | null;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  // --- Estados de Filtros ---
  const [filtro, setFiltro] = useState("total");
  const [responsable, setResponsable] = useState<string>("Todos");
  const [asignador, setAsignador] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");

  const [verCanceladas, setVerCanceladas] = useState(false);

  // ✅ Actualizamos el tipo para incluir los nuevos filtros de revisión
  const [filtroUrgencia, setFiltroUrgencia] = useState<"TODAS" | "ALTA" | "MEDIA" | "BAJA">("TODAS");
  const [filtroExtra, setFiltroExtra] = useState<"NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR">("NINGUNO");

  // ---> NUEVOS ESTADOS DE FECHAS <---
  const [filtroFechaRegistro, setFiltroFechaRegistro] = useState<RangoFechaEspecial>(defaultRango);
  const [filtroFechaLimite, setFiltroFechaLimite] = useState<RangoFechaEspecial>(defaultRango);

  const [filtroMisTareas, setFiltroMisTareas] = useState({ asignadasPorMi: false, asignadasAMi: false });



  // --- Estados varios ---
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [resumenData, setResumenData] = useState<TareasResponse['meta']['resumen']['totales'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKaizen, setIsKaizen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("TAREAS");

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const [page, setPage] = useState(1);
  const itemsPerPage = 30;

  const conteoMisTareas = useMemo(() => {
    let porMi = 0;
    let aMi = 0;
    if (!user) return { porMi, aMi };

    tareas.forEach(t => {
      // Filtro Kaizen base para que los números cuadren con la pestaña actual
      const nombreTarea = t.tarea || "";
      const esKaizen = nombreTarea.trim().toUpperCase().startsWith("KAIZEN");
      if (isKaizen ? !esKaizen : esKaizen) return;
      if (t.estatus === "CANCELADA" && !verCanceladas) return;

      if (t.asignadorId === user.id) porMi++;
      if (t.responsables.some(r => r.id === user.id)) aMi++;
    });
    return { porMi, aMi };
  }, [tareas, isKaizen, user, verCanceladas]);



  const handleRefresh = () => {
    setLoading(true);
    fetchTareas();
  };

  const handleNuevaTarea = () => {
    setOpenModal(true);
  };

  const handleFechaChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    setPage(1);
  };

  // ✅ Handler: Reseteamos filtros extra al cambiar de pestaña
  const handleFiltroChange = (nuevoFiltro: string) => {
    setFiltro(nuevoFiltro);
    // Si cambiamos de pestaña, limpiamos cualquier filtro extra activo
    setFiltroExtra("NINGUNO");
  };

  // ---> NUEVO HANDLER PARA FILTROS ESPECIALES DE FECHAS <---
  // Esta función aplica el filtro y sincroniza inteligentemente FechasAdmin
  const handleFiltroEspecialChange = (
    tipoDato: "REGISTRO" | "LIMITE",
    nuevoValor: RangoFechaEspecial
  ) => {
    if (tipoDato === "REGISTRO") setFiltroFechaRegistro(nuevoValor);
    else setFiltroFechaLimite(nuevoValor);

    // LÓGICA DE SINCRONIZACIÓN CON FechasAdmin
    if (nuevoValor.tipo !== "TODAS" && nuevoValor.inicio) {
      const añoInicio = nuevoValor.inicio.getFullYear();
      const mesInicio = nuevoValor.inicio.getMonth() + 1;

      if (nuevoValor.fin) {
        const mesFin = nuevoValor.fin.getMonth() + 1;
        // Si el rango abarca meses diferentes, ponemos el mes en 0 (Todos)
        if (mesInicio !== mesFin) {
          setYear(añoInicio);
          setMonth(0);
        } else {
          // Si es el mismo mes (ej. Hoy, Personalizado de 1 día), vamos a ese mes
          setYear(añoInicio);
          setMonth(mesInicio);
        }
      }
    }
    setPage(1);
  };

  // --- Fetch de Tareas ---
  const fetchTareas = useCallback(async () => {
    setLoading(true);
    try {
      let fechaInicioStr: string | undefined = undefined;
      let fechaFinStr: string | undefined = undefined;

      if (year) {
        const startDate = new Date(year, month === 0 ? 0 : month - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = month === 0
          ? new Date(year, 11, 31, 23, 59, 59)
          : new Date(year, month, 0, 23, 59, 59);

        fechaInicioStr = startDate.toISOString();
        fechaFinStr = endDate.toISOString();
      }

      const apiFilters: TareaFilters = {
        query: query,
        responsableId: responsable !== "Todos" ? Number(responsable) : undefined,
        limit: 1000,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr
      };

      const { data, meta } = await tareasService.getAll(apiFilters);

      const tareasConFechas = data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaEntrega: t.fechaEntrega ? new Date(t.fechaEntrega) : null,
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

      if (meta && meta.resumen) {
        setResumenData(meta.resumen.totales);
      }

    } catch (error) {
      console.error("Error al cargar tareas:", error);
      setTareas([]);
      setResumenData(null);
    } finally {
      setLoading(false);
    }
  }, [responsable, query, year, month]);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  useEffect(() => {
    setPage(1);
  }, [filtro, responsable, query, isKaizen, verCanceladas]);

  // --- Lógica de Filtrado Visual (Cliente) ---
  const tareasFiltradas = useMemo(() => {
    let filtered = tareas.filter((t) => {
      const nombreTarea = t.tarea || "";
      const esKaizen = nombreTarea.trim().toUpperCase().startsWith("KAIZEN");
      return isKaizen ? esKaizen : !esKaizen;
    });

    // 1. Papelera
    if (verCanceladas) {
      return filtered.filter(t => t.estatus === "CANCELADA");
    }

    // 2. Pestañas
    if (filtro === "pendientes") {
      filtered = filtered.filter(t => t.estatus === "PENDIENTE");
    } else if (filtro === "en_revision") {
      filtered = filtered.filter(t => t.estatus === "EN_REVISION");
    } else if (filtro === "concluidas") {
      filtered = filtered.filter(t => t.estatus === "CONCLUIDA");
    } else {
      filtered = filtered.filter(t => t.estatus !== "CANCELADA");
    }

    // 3. Urgencia
    if (filtroUrgencia !== "TODAS") {
      filtered = filtered.filter(t => t.urgencia === filtroUrgencia);
    }

    // 4. Filtros Extras (Lógica Específica)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // -- PENDIENTES --
    if (filtroExtra === "ATRASADAS") {
      filtered = filtered.filter(t => {
        if (t.estatus !== "PENDIENTE") return false;
        if (!t.fechaLimite) return false;
        const fechaLimiteObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : new Date(t.fechaLimite);
        return fechaLimiteObj < hoy;
      });
    }

    if (filtroExtra === "CORRECCIONES") {
      filtered = filtered.filter(t => t.estatus === "PENDIENTE" && t.feedbackRevision);
    }

    // -- EN REVISIÓN --
    if (filtroExtra === "RETRASO") {
      filtered = filtered.filter(t => {
        // 1. Calcular Fecha Límite Efectiva (considerando historial)
        const fechaLimiteObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : (t.fechaLimite ? new Date(t.fechaLimite) : null);

        if (!fechaLimiteObj) return false;
        const limiteTime = fechaLimiteObj.getTime();

        // Caso A: Está EN_REVISIÓN (Comparamos contra fechaEntrega)
        if (t.estatus === "EN_REVISION" && t.fechaEntrega) {
          return new Date(t.fechaEntrega).getTime() > limiteTime;
        }

        // Caso B: Está CONCLUIDA (Tu regla de negocio)
        if (t.estatus === "CONCLUIDA") {
          // Si tiene fechaEntrega (pasó por revisión), la usamos.
          // Si no (la cerró directo el admin), usamos fechaConclusion.
          const fechaReferencia = t.fechaEntrega
            ? new Date(t.fechaEntrega)
            : (t.fechaConclusion ? new Date(t.fechaConclusion) : null);

          if (!fechaReferencia) return false;
          return fechaReferencia.getTime() > limiteTime;
        }

        return false;
      });
    }

    if (filtroExtra === "AUTOCOMPLETAR") {
      // Llevan 4 días o más en revisión
      filtered = filtered.filter(t => {
        if (t.estatus !== "EN_REVISION") return false;
        if (!t.fechaEntrega) return false; // Usamos fechaEntrega como inicio de la revisión

        const fechaEntrega = new Date(t.fechaEntrega);
        // Calculamos diferencia en días
        const diferenciaTiempo = hoy.getTime() - fechaEntrega.getTime();
        const diasEnRevision = diferenciaTiempo / (1000 * 3600 * 24);

        return diasEnRevision >= 4;
      });
    }

    // 5. Filtro de Fecha de Registro / Asignación
    if (filtroFechaRegistro.tipo !== "TODAS" && filtroFechaRegistro.inicio) {
      filtered = filtered.filter(t => {
        if (!t.fechaRegistro) return false;

        // ✅ Envolvemos t.fechaRegistro en new Date() para evitar el error de TypeScript
        const fr = new Date(t.fechaRegistro).getTime();

        const finEfectivo = filtroFechaRegistro.fin ? filtroFechaRegistro.fin.getTime() : filtroFechaRegistro.inicio!.getTime();
        return fr >= filtroFechaRegistro.inicio!.getTime() && fr <= finEfectivo;
      });
    }

    // 6. Filtro de Fecha Límite
    if (filtroFechaLimite.tipo !== "TODAS" && filtroFechaLimite.inicio) {
      filtered = filtered.filter(t => {
        // Obtenemos la fecha límite actual considerando el historial
        const fechaLimiteObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : (t.fechaLimite ? new Date(t.fechaLimite) : null);

        if (!fechaLimiteObj) return false;

        const fl = fechaLimiteObj.getTime();
        const finEfectivo = filtroFechaLimite.fin ? filtroFechaLimite.fin.getTime() : filtroFechaLimite.inicio!.getTime();

        return fl >= filtroFechaLimite.inicio!.getTime() && fl <= finEfectivo;
      });
    }

    // 7. Filtro "Mis Tareas" (Por Mí / A Mí)
    if (filtroMisTareas.asignadasPorMi || filtroMisTareas.asignadasAMi) {
      filtered = filtered.filter(t => {
        const esPorMi = t.asignadorId === user?.id;
        const esAMi = t.responsables.some(r => r.id === user?.id);

        if (filtroMisTareas.asignadasPorMi && filtroMisTareas.asignadasAMi) {
          return esPorMi || esAMi; // Muestra ambas si las dos están seleccionadas
        }
        if (filtroMisTareas.asignadasPorMi) return esPorMi;
        if (filtroMisTareas.asignadasAMi) return esAMi;
        return true;
      });
    }

    return filtered;
  }, [tareas, isKaizen, filtro, verCanceladas, filtroUrgencia, filtroExtra, filtroFechaRegistro, filtroFechaLimite, filtroMisTareas, user]);
  const totalPages = Math.max(1, Math.ceil(tareasFiltradas.length / itemsPerPage));

  const tareasParaTablaPaginadas = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return tareasFiltradas.slice(startIndex, startIndex + itemsPerPage);
  }, [tareasFiltradas, page]);

  const tituloDinamico = useMemo(() => {
    if (viewMode === "INDICADORES") return "DASHBOARD DE MÉTRICAS";
    if (verCanceladas) return "PAPELERA DE RECICLAJE";
    return isKaizen ? "ADMINISTRA KAIZEN" : "ADMINISTRA TAREAS";
  }, [viewMode, isKaizen, verCanceladas]);

  // ✅ CONTEO DINÁMICO REPARADO Y FUERA DE RENDER SWITCH (En Nivel Principal)
  const conteoDinamico = useMemo(() => {
    // 1. Filtramos las tareas cargadas usando ambos filtros y la validación de Kaizen
    const tareasParaConteo = tareas.filter((t) => {
      // Filtro Kaizen (Para que no mezcle métricas de tareas normales con Kaizen)
      const nombreTarea = t.tarea || "";
      const esKaizen = nombreTarea.trim().toUpperCase().startsWith("KAIZEN");
      if (isKaizen ? !esKaizen : esKaizen) return false;

      // Filtro de Responsable
      const pasaResponsable =
        responsable === "Todos" ||
        t.responsables.some((r) => r.id.toString() === responsable);

      // ✅ NUEVO: Filtro de Asignador
      const pasaAsignador =
        asignador === "Todos" || t.asignadorId?.toString() === asignador;

      // Filtro de Urgencia
      const pasaUrgencia =
        filtroUrgencia === "TODAS" || t.urgencia === filtroUrgencia;

      return pasaResponsable && pasaAsignador && pasaUrgencia;
    });

    // 2. Retornamos el objeto con la estructura que espera ResumenAdmin
    return {
      activas: tareasParaConteo.filter(t => t.estatus !== "CANCELADA").length,
      pendientes: tareasParaConteo.filter(t => t.estatus === "PENDIENTE").length,
      enRevision: tareasParaConteo.filter(t => t.estatus === "EN_REVISION").length,
      concluidas: tareasParaConteo.filter(t => t.estatus === "CONCLUIDA").length,
      canceladas: tareasParaConteo.filter(t => t.estatus === "CANCELADA").length,
      todas: tareasParaConteo.length,
    };
  }, [tareas, responsable, filtroUrgencia, isKaizen]);

  const renderSwitch = () => {
    const buttons = [
      {
        type: "TAREAS",
        label: "Gestión Tareas",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
        disabled: false
      },
      {
        type: "INDICADORES",
        label: "Métricas (En mantenimiento 🚧)",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        disabled: true
      },
    ];

    return (
      <div className="mb-6 px-2 lg:px-0">
        <div className="flex w-full max-w-md mx-auto md:max-w-none lg:w-auto lg:mx-auto p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          {buttons.map((btn) => {
            const isActive = viewMode === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => !btn.disabled && setViewMode(btn.type as ViewMode)}
                disabled={btn.disabled}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 
                  text-sm md:text-base font-bold rounded-lg transition-all duration-300
                  ${isActive
                    ? "bg-blue-600 text-white shadow-md transform scale-[1.02]"
                    : btn.disabled
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed border border-transparent"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 border border-transparent hover:border-gray-200"
                  }
                `}
                title={btn.disabled ? "Módulo en mantenimiento" : ""}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`
          p-3 bg-blue-600 text-white rounded-full shadow-xl 
          hover:bg-blue-700 transition-all duration-300
          active:scale-90 
          fixed bottom-20 right-6 z-50
          lg:bottom-180 lg:right-10
          ${loading ? "opacity-75 cursor-wait" : ""}
        `}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 ${loading ? "animate-spin" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {tituloDinamico}
      </h1>

      <div className="mb-4 w-full">
        {/* ✅ Pasamos año y mes directamente a FechasAdmin */}
        <FechasAdmin year={year} month={month} onChange={handleFechaChange} />
      </div>

      {renderSwitch()}

      {viewMode === "TAREAS" ? (
        <>
          <div className="flex justify-end sm:justify-between items-center mb-4">
            <div className="hidden sm:block"></div>
            <button
              onClick={handleNuevaTarea}
              className="flex items-center justify-center gap-2 
                      bg-green-600 hover:bg-green-700 text-white 
                      font-semibold px-4 py-2 rounded-md shadow-md 
                      active:scale-[0.97] transition-all duration-200
                      fixed bottom-40 right-5 sm:static sm:bottom-auto sm:right-auto
                      sm:px-5 sm:py-2 sm:rounded-md sm:shadow 
                      z-50 sm:z-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Agregar nueva tarea</span>
            </button>
          </div>

          <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0 animate-fade-in-up">

            <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
              <ResumenPrincipalAdmin
                conteo={conteoDinamico}
                filtro={filtro}
                onFiltroChange={handleFiltroChange}
                loading={loading}
                verCanceladas={verCanceladas}
              />
              <FiltrosAdmin
                responsable={responsable}
                asignador={asignador}
                busqueda={query}
                onResponsableChange={setResponsable}
                onAsignadorChange={setAsignador}
                onBuscarChange={setQuery}
                user={user}
                verCanceladas={verCanceladas}
                onToggleCanceladas={() => {
                  if (!verCanceladas) {
                    setFiltro("total");
                    setMonth(0);
                    setResponsable("Todos");
                    setAsignador("Todos");
                    setQuery("");
                    setFiltroUrgencia("TODAS");
                    setFiltroExtra("NINGUNO");
                    setFiltroFechaRegistro(defaultRango);
                    setFiltroFechaLimite(defaultRango);
                    setFiltroMisTareas({ asignadasPorMi: false, asignadasAMi: false });
                  } else {
                    const fechaActual = new Date();
                    setYear(fechaActual.getFullYear());
                    setMonth(fechaActual.getMonth() + 1);
                  }
                  setVerCanceladas(!verCanceladas);
                }}
                filtroUrgencia={filtroUrgencia}
                onUrgenciaChange={setFiltroUrgencia}
                filtroExtra={filtroExtra}
                onFiltroExtraChange={setFiltroExtra}
                filtroActivo={filtro}
                totalTareas={tareasFiltradas.length}
                filtroFechaRegistro={filtroFechaRegistro}
                filtroFechaLimite={filtroFechaLimite}
                onFiltroFechaRegistroChange={(val) => handleFiltroEspecialChange("REGISTRO", val)}
                onFiltroFechaLimiteChange={(val) => handleFiltroEspecialChange("LIMITE", val)}
                filtroMisTareas={filtroMisTareas}
                onFiltroMisTareasChange={setFiltroMisTareas}
                conteoMisTareas={conteoMisTareas}
              />
            </div>

            <div className="px-1">
              <TablaAdmin
                filtro={verCanceladas ? "canceladas" : filtro}
                responsable={responsable}
                query={query}
                tareas={tareasParaTablaPaginadas}
                loading={loading}
                onRecargarTareas={fetchTareas}
                user={user}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="animate-fade-in-up">
          <ResumenPrincipalDash
            year={year}
            month={month}
            responsable={responsable}
            query={query}
            tareas={tareas}
            loading={loading}
            user={user}
          />

          <div className="mt-6">
            <DashboardMetricas
              tareas={tareas}
              year={year}
              month={month}
            />
          </div>
        </div>
      )}

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