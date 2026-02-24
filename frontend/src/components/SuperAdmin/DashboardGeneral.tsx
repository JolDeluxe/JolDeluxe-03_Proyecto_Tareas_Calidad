// 📍 src/components/SuperAdmin/DashboardGeneral.tsx

import React, { useState, useEffect, useMemo } from "react";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import { usuariosService } from "../../api/usuarios.service";
import { tareasService } from "../../api/tareas.service";
import { logsService } from "../../api/logs.service";
import type { Tarea } from "../../types/tarea";

// --- Importaciones para la Vista de Drill-Down ---
import TablaAdmin from "../Admin/TablaAdmin";
import ResumenPrincipalAdmin from "../Admin/ResumenAdmin";
import FiltrosAdmin from "../Admin/FiltrosAdmin";
import DashboardMetricas from "../Principal/DashboardMetricas";
import { MicrosoftExcel } from "../../assets/MicrosoftExcel";
import ModalExportar from "../Admin/ModalExportar";
import FechasAdmin from "../Admin/FechasAdmin";
import type { RangoFechaEspecial } from "../../pages/Admin";

// --- HELPER FUNCTIONS ---
const getTimestamp = (date: Date | string | null | undefined): number => {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getFechaEfectiva = (tarea: Tarea): Date | null => {
  if (tarea.historialFechas && tarea.historialFechas.length > 0) {
    const historialOrdenado = [...tarea.historialFechas].sort((a, b) => {
      const fechaA = new Date(a.fechaCambio || "").getTime();
      const fechaB = new Date(b.fechaCambio || "").getTime();
      return fechaB - fechaA;
    });
    if (historialOrdenado[0].nuevaFecha) {
      return new Date(historialOrdenado[0].nuevaFecha);
    }
  }
  return tarea.fechaLimite ? new Date(tarea.fechaLimite) : null;
};

const isToday = (dateString: string | Date) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const defaultRango: RangoFechaEspecial = { tipo: "TODAS", inicio: null, fin: null };

const DashboardGeneral = () => {
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADO DE FECHAS GLOBAL ---
  // ✅ Esto sincronizará el Dashboard General y el Drill-Down
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  // --- ESTADO PARA EL DRILL-DOWN ---
  const [deptoSeleccionado, setDeptoSeleccionado] = useState<Departamento | null>(null);

  // --- ESTADOS DE VISTA DE DETALLE ---
  const [viewModeDepto, setViewModeDepto] = useState<"TAREAS" | "INDICADORES">("TAREAS");
  const [filtro, setFiltro] = useState("total");
  const [responsable, setResponsable] = useState<string>("Todos");
  const [asignador, setAsignador] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");
  const [verCanceladas, setVerCanceladas] = useState(false);
  const [filtroUrgencia, setFiltroUrgencia] = useState<"TODAS" | "ALTA" | "MEDIA" | "BAJA">("TODAS");
  const [filtroExtra, setFiltroExtra] = useState<"NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR">("NINGUNO");
  const [filtroFechaRegistro, setFiltroFechaRegistro] = useState<RangoFechaEspecial>(defaultRango);
  const [filtroFechaLimite, setFiltroFechaLimite] = useState<RangoFechaEspecial>(defaultRango);
  const [filtroMisTareas, setFiltroMisTareas] = useState({ asignadasPorMi: false, asignadasAMi: false });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | "atrasadas" }>({ key: "fechaRegistro", direction: "desc" });
  const [page, setPage] = useState(1);
  const itemsPerPage = 30;
  const [openModalExportar, setOpenModalExportar] = useState<boolean>(false);

  // Métricas "Calientes" (Vista Global)
  const [actividadHoy, setActividadHoy] = useState({ creadas: 0, terminadas: 0 });
  const [erroresRecientes, setErroresRecientes] = useState(0);
  const [totalVencidas, setTotalVencidas] = useState(0);
  const [ping, setPing] = useState<number | null>(null);

  const fetchData = async () => {
    const start = performance.now();
    setLoading(true);

    try {
      const [d, uRes, tRes, l] = await Promise.all([
        departamentosService.getAll(),
        usuariosService.getAll(),
        tareasService.getAll({ limit: 5000 }),
        logsService.getAll()
      ]);

      const end = performance.now();
      setPing(Math.round(end - start));

      const t = tRes.data.map((tar: any) => ({
        ...tar,
        fechaRegistro: tar.fechaRegistro ? new Date(tar.fechaRegistro) : null,
        fechaLimite: tar.fechaLimite ? new Date(tar.fechaLimite) : null,
        fechaEntrega: tar.fechaEntrega ? new Date(tar.fechaEntrega) : null,
        fechaConclusion: tar.fechaConclusion ? new Date(tar.fechaConclusion) : null,
      }));

      setDeptos(d);
      setTareas(t);

      // Calcular Actividad Global de HOY (Esto siempre es de HOY, no depende del mes/año)
      let creadasHoy = 0; let terminadasHoy = 0; let vencidasCount = 0;
      const ahoraMs = new Date().getTime();

      t.forEach((tarea: Tarea) => {
        if (tarea.fechaRegistro && isToday(tarea.fechaRegistro)) creadasHoy++;
        if (tarea.estatus === 'CONCLUIDA' && tarea.fechaConclusion && isToday(tarea.fechaConclusion)) terminadasHoy++;
        if (tarea.estatus === 'PENDIENTE') {
          const fechaObjFinal = getFechaEfectiva(tarea);
          const fechaLimiteFinal = fechaObjFinal ? getTimestamp(fechaObjFinal) : 0;
          if (fechaLimiteFinal > 0 && ahoraMs > fechaLimiteFinal) vencidasCount++;
        }
      });

      setActividadHoy({ creadas: creadasHoy, terminadas: terminadasHoy });
      setTotalVencidas(vencidasCount);

      const errores = l.filter(log =>
        (log.accion.toUpperCase().includes('ERROR') || log.descripcion.toUpperCase().includes('FALLO'))
      ).length;
      setErroresRecientes(errores);

    } catch (error) {
      console.error("Error crítico:", error);
      setPing(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 🧠 LÓGICA MAESTRA ESTRICTA DE EFICIENCIA GLOBAL (AHORA RESPETA AÑO Y MES)
  const metricasPorDepto = useMemo(() => {
    const map = new Map<number, any>();
    deptos.forEach(d => map.set(d.id, {
      id: d.id, nombre: d.nombre, total: 0, pendientes: 0, concluidas: 0,
      universoEvaluable: 0, exitosATiempo: 0, aTiempo: 0
    }));

    const ahoraMs = new Date().getTime();

    // ✅ MAGIA AQUÍ: Filtramos las tareas exactamente como lo hace DashboardMetricas
    const tareasValidas = tareas.filter(t => {
      if (t.estatus.toUpperCase() === "CANCELADA") return false;
      if (!t.fechaRegistro) return false;

      const d = new Date(t.fechaRegistro);
      const coincideFecha = d.getFullYear() === year && (month === 0 || d.getMonth() + 1 === month);

      return coincideFecha;
    });

    tareasValidas.forEach(t => {
      const stats = map.get(t.departamentoId);
      if (!stats) return;

      stats.total++;
      const estatus = t.estatus.toUpperCase();
      const isPendiente = estatus === "PENDIENTE";
      const isEnRevision = estatus === "EN_REVISION";
      const isConcluida = estatus === "CONCLUIDA";

      if (isPendiente || isEnRevision) stats.pendientes++;
      if (isConcluida) stats.concluidas++;

      const fechaObjFinal = getFechaEfectiva(t);
      const fechaLimiteFinal = fechaObjFinal ? getTimestamp(fechaObjFinal) : 0;

      const estaVencida = isPendiente && (fechaLimiteFinal > 0 && ahoraMs > fechaLimiteFinal);
      const debeEvaluarse = isConcluida || isEnRevision || estaVencida;

      let cumplioAjustado = false;

      if (debeEvaluarse) {
        stats.universoEvaluable++;
        if (isConcluida && t.fechaConclusion) {
          cumplioAjustado = fechaLimiteFinal > 0 && getTimestamp(t.fechaConclusion) <= fechaLimiteFinal;
        } else if (isEnRevision && t.fechaEntrega) {
          cumplioAjustado = fechaLimiteFinal > 0 && getTimestamp(t.fechaEntrega) <= fechaLimiteFinal;
        }
        if (cumplioAjustado) {
          stats.exitosATiempo++;
          stats.aTiempo++;
        }
      }
    });

    return Array.from(map.values()).map((m: any) => {
      const eficacia = m.universoEvaluable > 0 ? Math.round((m.exitosATiempo / m.universoEvaluable) * 100) : 0;
      return { ...m, eficacia };
    }).sort((a: any, b: any) => b.eficacia - a.eficacia);
  }, [deptos, tareas, year, month]); // Añadimos year y month como dependencias

  const eficienciaGlobalReal = useMemo(() => {
    let universo = 0; let exitos = 0;
    metricasPorDepto.forEach(m => { universo += m.universoEvaluable; exitos += m.exitosATiempo; });
    return universo > 0 ? Math.round((exitos / universo) * 100) : 0;
  }, [metricasPorDepto]);

  // ======================================================================
  // 🔽 LÓGICA DE FILTRADO PARA LA VISTA DETALLADA (DRILL-DOWN) 🔽
  // ======================================================================

  const tareasDeptoSeleccionado = useMemo(() => {
    if (!deptoSeleccionado) return [];
    return tareas.filter(t => t.departamentoId === deptoSeleccionado.id);
  }, [tareas, deptoSeleccionado]);

  const handleFiltroEspecialChange = (tipoDato: "REGISTRO" | "LIMITE", nuevoValor: RangoFechaEspecial) => {
    if (tipoDato === "REGISTRO") setFiltroFechaRegistro(nuevoValor);
    else setFiltroFechaLimite(nuevoValor);

    if (nuevoValor.tipo !== "TODAS" && nuevoValor.inicio) {
      const añoInicio = nuevoValor.inicio.getFullYear();
      const mesInicio = nuevoValor.inicio.getMonth() + 1;
      if (nuevoValor.fin) {
        const mesFin = nuevoValor.fin.getMonth() + 1;
        if (mesInicio !== mesFin) { setYear(añoInicio); setMonth(0); }
        else { setYear(añoInicio); setMonth(mesInicio); }
      }
    }
    setPage(1);
  };

  const tareasDeptoFiltradasYOrdenadas = useMemo(() => {
    let filtered = [...tareasDeptoSeleccionado];

    if (year) {
      filtered = filtered.filter(t => {
        if (!t.fechaRegistro) return false;
        const d = new Date(t.fechaRegistro);
        if (month === 0) return d.getFullYear() === year;
        return d.getFullYear() === year && (d.getMonth() + 1) === month;
      });
    }

    if (verCanceladas) {
      filtered = filtered.filter(t => t.estatus === "CANCELADA");
    } else {
      if (filtro === "pendientes") filtered = filtered.filter(t => t.estatus === "PENDIENTE");
      else if (filtro === "en_revision") filtered = filtered.filter(t => t.estatus === "EN_REVISION");
      else if (filtro === "concluidas") filtered = filtered.filter(t => t.estatus === "CONCLUIDA");
      else filtered = filtered.filter(t => t.estatus !== "CANCELADA");
    }

    if (filtroUrgencia !== "TODAS") filtered = filtered.filter(t => t.urgencia === filtroUrgencia);
    if (responsable !== "Todos") filtered = filtered.filter(t => t.responsables.some(r => r.id.toString() === responsable));
    if (asignador !== "Todos") filtered = filtered.filter(t => t.asignadorId?.toString() === asignador);
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t => t.tarea?.toLowerCase().includes(q) || t.id.toString().includes(q));
    }

    const ahoraExacto = new Date();

    if (filtroExtra === "ATRASADAS") {
      filtered = filtered.filter(t => {
        if (t.estatus !== "PENDIENTE") return false;
        const fl = getFechaEfectiva(t);
        if (!fl) return false;
        return fl.getTime() < ahoraExacto.getTime();
      });
    }

    if (filtroExtra === "CORRECCIONES") filtered = filtered.filter(t => t.estatus === "PENDIENTE" && t.feedbackRevision);

    if (filtroExtra === "RETRASO") {
      filtered = filtered.filter(t => {
        const limiteObj = getFechaEfectiva(t);
        if (!limiteObj) return false;
        if (t.estatus === "EN_REVISION" && t.fechaEntrega) return new Date(t.fechaEntrega).getTime() > limiteObj.getTime();
        if (t.estatus === "CONCLUIDA") {
          const ref = t.fechaEntrega ? new Date(t.fechaEntrega) : (t.fechaConclusion ? new Date(t.fechaConclusion) : null);
          return ref ? ref.getTime() > limiteObj.getTime() : false;
        }
        return false;
      });
    }

    if (filtroFechaRegistro.tipo !== "TODAS" && filtroFechaRegistro.inicio) {
      filtered = filtered.filter(t => {
        if (!t.fechaRegistro) return false;
        const fr = new Date(t.fechaRegistro).getTime();
        const finEfectivo = filtroFechaRegistro.fin ? filtroFechaRegistro.fin.getTime() : filtroFechaRegistro.inicio!.getTime();
        return fr >= filtroFechaRegistro.inicio!.getTime() && fr <= finEfectivo;
      });
    }

    if (filtroFechaLimite.tipo !== "TODAS" && filtroFechaLimite.inicio) {
      filtered = filtered.filter(t => {
        const flObj = getFechaEfectiva(t);
        if (!flObj) return false;
        const finEfectivo = filtroFechaLimite.fin ? filtroFechaLimite.fin.getTime() : filtroFechaLimite.inicio!.getTime();
        return flObj.getTime() >= filtroFechaLimite.inicio!.getTime() && flObj.getTime() <= finEfectivo;
      });
    }

    filtered.sort((a, b) => {
      let valA: any = ""; let valB: any = "";
      switch (sortConfig.key) {
        case "asignador": valA = (a.asignador?.nombre || "").toLowerCase(); valB = (b.asignador?.nombre || "").toLowerCase(); break;
        case "responsables": valA = a.responsables.map(r => r.nombre).join("").toLowerCase(); valB = b.responsables.map(r => r.nombre).join("").toLowerCase(); break;
        case "urgencia":
          const weights: any = { ALTA: 3, MEDIA: 2, BAJA: 1 };
          valA = weights[a.urgencia] || 0; valB = weights[b.urgencia] || 0;
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        case "fechaRegistro":
          valA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0; valB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        case "fechaLimite":
          valA = getFechaEfectiva(a)?.getTime() || 0; valB = getFechaEfectiva(b)?.getTime() || 0;
          if (sortConfig.direction === "atrasadas") {
            const hoy = Date.now();
            const aV = a.estatus === "PENDIENTE" && valA > 0 && valA < hoy;
            const bV = b.estatus === "PENDIENTE" && valB > 0 && valB < hoy;
            if (aV && !bV) return -1; if (!aV && bV) return 1;
            return valA - valB;
          }
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        case "estatus": valA = a.estatus; valB = b.estatus; break;
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tareasDeptoSeleccionado, filtro, verCanceladas, filtroUrgencia, filtroExtra, query, responsable, asignador, sortConfig, filtroFechaRegistro, filtroFechaLimite, year, month]);

  const totalPages = Math.max(1, Math.ceil(tareasDeptoFiltradasYOrdenadas.length / itemsPerPage));
  const tareasDeptoPaginadas = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return tareasDeptoFiltradasYOrdenadas.slice(start, start + itemsPerPage);
  }, [tareasDeptoFiltradasYOrdenadas, page]);

  const conteoDepto = useMemo(() => {
    const base = tareasDeptoSeleccionado.filter(t => {
      const pR = responsable === "Todos" || t.responsables.some(r => r.id.toString() === responsable);
      const pA = asignador === "Todos" || t.asignadorId?.toString() === asignador;
      const pU = filtroUrgencia === "TODAS" || t.urgencia === filtroUrgencia;
      let pF = true;
      if (year && t.fechaRegistro) {
        const d = new Date(t.fechaRegistro);
        if (month === 0) pF = d.getFullYear() === year;
        else pF = d.getFullYear() === year && (d.getMonth() + 1) === month;
      }
      return pR && pA && pU && pF;
    });

    return {
      activas: base.filter(t => t.estatus !== "CANCELADA").length,
      pendientes: base.filter(t => t.estatus === "PENDIENTE").length,
      enRevision: base.filter(t => t.estatus === "EN_REVISION").length,
      concluidas: base.filter(t => t.estatus === "CONCLUIDA").length,
      canceladas: base.filter(t => t.estatus === "CANCELADA").length,
      todas: base.length,
    };
  }, [tareasDeptoSeleccionado, responsable, asignador, filtroUrgencia, year, month]);


  // ======================================================================
  // RENDERIZADO
  // ======================================================================

  return (
    <div className="space-y-6 animate-fadeIn pb-10">

      {/* --- RENDERIZADO CONDICIONAL DEL DRILL-DOWN --- */}
      {deptoSeleccionado ? (

        // 🌟 VISTA DETALLADA DEL DEPARTAMENTO (Estilo Admin.tsx) 🌟
        <div className="animate-fade-in space-y-4">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <button
                onClick={() => setDeptoSeleccionado(null)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-2 mb-1 transition-transform active:scale-95 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Volver al Resumen Global
              </button>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                Dpto: <span className="text-indigo-600">{deptoSeleccionado.nombre}</span>
              </h2>
            </div>

            <div className="flex mt-3 sm:mt-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewModeDepto("TAREAS")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${viewModeDepto === "TAREAS" ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Gestión de Tareas
              </button>
              <button
                onClick={() => setViewModeDepto("INDICADORES")}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all cursor-pointer ${viewModeDepto === "INDICADORES" ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Indicadores KPI
              </button>
            </div>
          </div>

          <div className="w-full">
            <FechasAdmin year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); setPage(1); }} />
          </div>

          {viewModeDepto === "TAREAS" ? (
            <>
              <div className="flex justify-start mb-2">
                <button
                  onClick={() => setOpenModalExportar(true)}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-4 py-2 rounded-md shadow-sm active:scale-[0.97] transition-all duration-200 cursor-pointer sm:px-5 sm:py-2"
                >
                  <MicrosoftExcel className="w-6 h-6" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                </button>
              </div>

              <div className="shadow-lg rounded-xl border border-gray-300 bg-white overflow-visible pb-5 lg:pb-0">
                <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4 rounded-t-xl">
                  <ResumenPrincipalAdmin
                    conteo={conteoDepto}
                    filtro={filtro}
                    onFiltroChange={(f) => { setFiltro(f); setFiltroExtra("NINGUNO"); setPage(1); }}
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
                    user={null}
                    verCanceladas={verCanceladas}
                    onToggleCanceladas={() => {
                      if (!verCanceladas) {
                        setFiltro("total"); setMonth(0); setResponsable("Todos"); setAsignador("Todos");
                        setQuery(""); setFiltroUrgencia("TODAS"); setFiltroExtra("NINGUNO");
                        setFiltroFechaRegistro(defaultRango); setFiltroFechaLimite(defaultRango);
                      } else {
                        const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth() + 1);
                      }
                      setVerCanceladas(!verCanceladas);
                    }}
                    filtroUrgencia={filtroUrgencia}
                    onUrgenciaChange={setFiltroUrgencia}
                    filtroExtra={filtroExtra}
                    onFiltroExtraChange={setFiltroExtra}
                    filtroActivo={filtro}
                    totalTareas={tareasDeptoFiltradasYOrdenadas.length}
                    filtroFechaRegistro={filtroFechaRegistro}
                    filtroFechaLimite={filtroFechaLimite}
                    onFiltroFechaRegistroChange={(val) => handleFiltroEspecialChange("REGISTRO", val)}
                    onFiltroFechaLimiteChange={(val) => handleFiltroEspecialChange("LIMITE", val)}
                    filtroMisTareas={filtroMisTareas}
                    onFiltroMisTareasChange={setFiltroMisTareas}
                    conteoMisTareas={{ porMi: 0, aMi: 0 }}
                  />
                </div>

                <div className="px-1">
                  <TablaAdmin
                    filtro={verCanceladas ? "canceladas" : filtro}
                    responsable={responsable}
                    query={query}
                    tareas={tareasDeptoPaginadas}
                    loading={loading}
                    onRecargarTareas={fetchData}
                    user={null}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    sortConfig={sortConfig as any}
                    onSortChange={(key, direction) => { setSortConfig({ key, direction }); setPage(1); }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <DashboardMetricas
                tareas={tareasDeptoSeleccionado}
                year={year}
                month={month}
              />
            </div>
          )}

          {openModalExportar && (
            <ModalExportar
              onClose={() => setOpenModalExportar(false)}
              user={null}
            />
          )}

        </div>

      ) : (

        // 🌍 VISTA GENERAL MAESTRA 🌍
        <>
          {/* ✅ AÑADIDO: Filtro de Fechas Global para el Super Admin */}
          <div className="w-full mb-4">
            <FechasAdmin year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* 1. Pulso Diario */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <svg className="w-16 h-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-2">Movimiento Hoy</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">{actividadHoy.terminadas}</span>
                <span className="text-sm font-medium text-slate-400 mb-1">Finalizadas</span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500 bg-indigo-50 inline-block px-2 py-1 rounded">
                + {actividadHoy.creadas} Nuevas tareas hoy
              </div>
            </div>

            {/* 2. Errores */}
            <div className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${erroresRecientes > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${erroresRecientes > 0 ? 'text-red-600' : 'text-slate-400'}`}>Salud Técnica (Logs)</p>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-black ${erroresRecientes > 0 ? 'text-red-600' : 'text-slate-800'}`}>{erroresRecientes}</span>
                <span className={`text-sm font-medium mb-1 ${erroresRecientes > 0 ? 'text-red-400' : 'text-slate-400'}`}>Errores</span>
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                {ping ? `Latencia API: ${ping}ms` : 'Conectando...'}
              </div>
            </div>

            {/* 3. Vencidas */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <svg className="w-16 h-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs font-bold uppercase text-orange-500 tracking-wider mb-2">Atención Requerida</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">{totalVencidas}</span>
                <span className="text-sm font-medium text-slate-400 mb-1">Vencidas</span>
              </div>
              <div className="mt-2 text-xs text-orange-600 font-bold">
                Acumulado Global
              </div>
            </div>

            {/* 4. Eficiencia Global */}
            <div className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden transition-all
                ${eficienciaGlobalReal >= 80 ? 'bg-emerald-50 border-emerald-200' : eficienciaGlobalReal >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}
            `}>
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <svg className="w-16 h-16 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2
                ${eficienciaGlobalReal >= 80 ? 'text-emerald-700' : eficienciaGlobalReal >= 60 ? 'text-amber-700' : 'text-red-700'}
              `}>Eficiencia Maestra</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-slate-800">
                  {eficienciaGlobalReal}%
                </span>
                <span className="text-sm font-medium text-slate-500 mb-1.5">Global</span>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500 bg-white/60 inline-block px-2 py-1 rounded">
                Universo evaluado: {metricasPorDepto.reduce((a, b) => a + b.universoEvaluable, 0)}
              </div>
            </div>

          </div>

          {/* TABLA DE DEPARTAMENTOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Desglose por Departamento</h3>
                <p className="text-sm text-indigo-500 font-medium">💡 Clic en un departamento para gestionarlo como Administrador.</p>
              </div>
              <div className="flex gap-3 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> &ge; 80%</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> 60-79%</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> &lt; 60%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Departamento</th>
                    <th className="p-4 text-center">Volumen</th>
                    <th className="p-4 text-center text-blue-600 bg-blue-50/50">Pendientes</th>
                    <th className="p-4 text-center text-slate-600 bg-slate-100/50">Concluidas</th>
                    <th className="p-4 text-center text-emerald-600 bg-emerald-50/50">A Tiempo</th>
                    <th className="p-4 text-center w-24">Score</th>
                    <th className="p-4 pr-6 w-1/4 sm:w-1/3">Progreso Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && deptos.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 animate-pulse font-medium">Sincronizando métricas globales...</td></tr>
                  ) : metricasPorDepto.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Sin datos registrados.</td></tr>
                  ) : (
                    metricasPorDepto.map((m: any) => (
                      <tr
                        key={m.nombre}
                        onClick={() => setDeptoSeleccionado(m)}
                        className="hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                        title="Gestionar tareas de este departamento"
                      >
                        <td className="p-4 pl-6 font-bold text-slate-700 group-hover:text-indigo-700 flex items-center gap-2">
                          {m.nombre}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-500">{m.total}</td>
                        <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/20">{m.pendientes}</td>
                        <td className="p-4 text-center font-medium text-slate-600 bg-slate-100/20">{m.concluidas}</td>
                        <td className="p-4 text-center font-bold text-emerald-700 bg-emerald-50/20">{m.aTiempo}</td>
                        <td className="p-4 text-center">
                          <span className={`text-lg font-black ${m.eficacia >= 80 ? 'text-emerald-600' : m.eficacia >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {m.eficacia}%
                          </span>
                        </td>
                        <td className="p-4 pr-6 align-middle">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${m.eficacia >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : m.eficacia >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                              style={{ width: `${m.eficacia}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardGeneral;