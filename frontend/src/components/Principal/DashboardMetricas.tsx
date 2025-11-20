// 📍 src/components/Principal/DashboardMetricas.tsx

import React, { useMemo, useState } from "react";
import type { Tarea } from "../../types/tarea";

// Definimos los colores de rol
const COLOR_ROL = {
  ENCARGADO: "text-blue-600 font-bold",
  USUARIO: "text-red-700 font-bold",
  OTROS: "text-gray-600 font-semibold"
};

const ROLE_LABELS: Record<string, string> = {
  ENCARGADO: "Coordinador/a",
  USUARIO: "Inspector/a",
  ADMIN: "Administrador/a",
  INVITADO: "Invitado/a"
};

const COLOR_URGENCIA: Record<string, string> = {
  ALTA: "bg-red-500",
  MEDIA: "bg-amber-500",
  BAJA: "bg-green-500"
};

interface Props {
  tareas: Tarea[];
  year: number;
  month: number;
}

// --- 1. FUNCIONES HELPER ---

const resetTime = (date: Date | string | null | undefined): number => {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return 0;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getFechaEfectiva = (tarea: Tarea): Date | null => {
  // Si hay historial, tomamos la fecha más reciente del historial (reprogramación)
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
  // Si no, la fecha original
  return tarea.fechaLimite ? new Date(tarea.fechaLimite) : null;
};

const getEstadoPendiente = (fechaEfectiva: Date | null) => {
  if (!fechaEfectiva) return "normal";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(fechaEfectiva);
  limite.setHours(0, 0, 0, 0);
  const diffMs = limite.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return "vencida";
  if (diasRestantes >= 0 && diasRestantes <= 2) return "proxima";
  return "normal";
};

const renderResponsables = (responsables: any[]) => {
  if (!responsables || responsables.length === 0) return "Sin asignar";
  return responsables.map((r) => r.nombre).join(", ");
};

const DashboardMetricas: React.FC<Props> = ({ tareas, year, month }) => {

  const [openVencidas, setOpenVencidas] = useState(false);
  const [openProximas, setOpenProximas] = useState(false);

  // --- 2. CÁLCULO MASIVO DE DATOS ---
  const data = useMemo(() => {

    const tareasPeriodo = tareas.filter(t => {
      if (!t.fechaRegistro) return false;
      const d = new Date(t.fechaRegistro);
      return d.getFullYear() === year && (month === 0 || d.getMonth() + 1 === month);
    });

    // Contadores Globales (Tu lógica original se mantiene para los KPIs de arriba)
    let contadores = {
      total: tareasPeriodo.length,
      concluidas: 0,
      pendientes: 0,
      aTiempoReal: 0,
      aTiempoAjustado: 0,
      retrasadas: 0,
      sinCambiosTotal: 0,
      sinCambiosOk: 0,
      conCambiosTotal: 0,
      conCambiosOk: 0,
      pendientesVencidas: 0,
      pendientesProximas: 0,
      pendientesNormal: 0,
      motivos: {} as Record<string, number>,
      totalCambios: 0,
      urgencia: { ALTA: 0, MEDIA: 0, BAJA: 0 } as Record<string, number>
    };

    // 📍 MAPA DE USUARIOS (ESTRUCTURA DEFINITIVA)
    const userMap: Record<string, {
      nombre: string;
      rol: string;
      total: number;       // Suma de Pendientes + Concluidas
      pendientes: number;  // Actualmente abiertas
      concluidas: number;  // Cerradas
      aTiempo: number;     // Cerradas exitosamente en fecha (original o reprogramada)
      vencidas: number;    // SUMA DE: (Pendientes ya vencidas) + (Concluidas Tarde)
    }> = {};

    const listaVencidas: Tarea[] = [];
    const listaProximas: Tarea[] = [];

    tareasPeriodo.forEach(t => {
      // Cálculos de fechas para lógica global y personal
      const fechaObjFinal = getFechaEfectiva(t); // Fecha "Real" (Original o Reprogramada)
      const fechaLimiteFinal = fechaObjFinal ? resetTime(fechaObjFinal) : 0;

      // ------------------------------------------------------------
      // LÓGICA GLOBAL (KPIs Superiores)
      // ------------------------------------------------------------
      if (t.estatus === "CONCLUIDA" && t.fechaConclusion) {
        contadores.concluidas++;
        const fechaFin = resetTime(t.fechaConclusion);

        // AJUSTADO: Se compara contra fechaLimiteFinal (que ya considera reprogramaciones)
        const cumplioAjustado = fechaLimiteFinal > 0 && fechaFin <= fechaLimiteFinal;

        // REAL: Se compara contra la original (para estadísticas de planeación)
        let fechaLimiteOriginal = t.fechaLimite ? resetTime(t.fechaLimite) : 0;
        let tieneCambios = false;
        if (t.historialFechas && t.historialFechas.length > 0) {
          tieneCambios = true;
          const historialAntiguo = [...t.historialFechas].sort((a, b) => new Date(a.fechaCambio || "").getTime() - new Date(b.fechaCambio || "").getTime());
          if (historialAntiguo[0]?.fechaAnterior) fechaLimiteOriginal = resetTime(historialAntiguo[0].fechaAnterior);
        }
        const cumplioReal = fechaLimiteOriginal > 0 && fechaFin <= fechaLimiteOriginal;

        if (cumplioReal) contadores.aTiempoReal++;
        if (cumplioAjustado) contadores.aTiempoAjustado++; else contadores.retrasadas++;

        if (tieneCambios) {
          contadores.conCambiosTotal++;
          if (cumplioAjustado) contadores.conCambiosOk++;
        } else {
          contadores.sinCambiosTotal++;
          if (cumplioReal) contadores.sinCambiosOk++;
        }

        // 📍 LÓGICA USUARIO: TAREA CONCLUIDA
        t.responsables.forEach((resp: any) => {
          const key = resp.id;
          if (!userMap[key]) userMap[key] = { nombre: resp.nombre, rol: resp.rol || "USUARIO", total: 0, pendientes: 0, concluidas: 0, aTiempo: 0, vencidas: 0 };

          userMap[key].total++;      // Suma al total histórico
          userMap[key].concluidas++; // Suma a concluidas

          if (cumplioAjustado) {
            userMap[key].aTiempo++; // Punto positivo
          } else {
            userMap[key].vencidas++; // Punto negativo (Concluida fuera de tiempo)
          }
        });

      } else if (t.estatus === "PENDIENTE") {
        contadores.pendientes++;
        const estado = getEstadoPendiente(fechaObjFinal);

        if (estado === "vencida") {
          contadores.pendientesVencidas++;
          listaVencidas.push(t);
        } else if (estado === "proxima") {
          contadores.pendientesProximas++;
          listaProximas.push(t);
        } else {
          contadores.pendientesNormal++;
        }

        // 📍 LÓGICA USUARIO: TAREA PENDIENTE
        t.responsables.forEach((resp: any) => {
          const key = resp.id;
          if (!userMap[key]) userMap[key] = { nombre: resp.nombre, rol: resp.rol || "USUARIO", total: 0, pendientes: 0, concluidas: 0, aTiempo: 0, vencidas: 0 };

          userMap[key].total++;      // Suma al total asignado
          userMap[key].pendientes++; // Suma a carga actual

          if (estado === "vencida") {
            userMap[key].vencidas++; // Punto negativo (Pendiente que ya caducó)
          }
        });
      }

      // Lógica Global Extra (Motivos y Urgencia)
      if (t.historialFechas) {
        t.historialFechas.forEach(h => {
          const motivo = h.motivo || "Sin especificar";
          contadores.motivos[motivo] = (contadores.motivos[motivo] || 0) + 1;
          contadores.totalCambios++;
        });
      }
      const urg = t.urgencia ? t.urgencia.toUpperCase() : "BAJA";
      if (contadores.urgencia[urg] !== undefined) contadores.urgencia[urg]++; else contadores.urgencia["BAJA"]++;
    });

    const topMotivos = Object.entries(contadores.motivos).sort(([, a], [, b]) => b - a).slice(0, 5);
    const rankingUsuarios = Object.values(userMap).sort((a, b) => b.total - a.total).slice(0, 8);

    return { contadores, topMotivos, rankingUsuarios, listaVencidas, listaProximas };

  }, [tareas, year, month]);

  const { contadores, topMotivos, rankingUsuarios, listaVencidas, listaProximas } = data;

  // Porcentajes Globales
  const pctEficienciaGlobal = contadores.concluidas > 0 ? Math.round((contadores.aTiempoAjustado / contadores.concluidas) * 100) : 0;
  const pctSinCambios = contadores.sinCambiosTotal > 0 ? Math.round((contadores.sinCambiosOk / contadores.sinCambiosTotal) * 100) : 0;
  const pctConCambios = contadores.conCambiosTotal > 0 ? Math.round((contadores.conCambiosOk / contadores.conCambiosTotal) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* --- SECCIÓN 1: KPIs PRINCIPALES --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* 🌟 KPI MAESTRO */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl shadow border-l-4 border-blue-600 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Cumplimiento Global</p>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">Maestro</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-5xl font-black text-gray-800">{pctEficienciaGlobal}%</h3>
              <span className="text-sm text-gray-500 font-medium">eficiencia total</span>
            </div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${pctEficienciaGlobal >= 80 ? 'bg-green-500' : pctEficienciaGlobal >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pctEficienciaGlobal}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">Mide el éxito total considerando la fecha vigente.</p>
          </div>
        </div>

        {/* 📊 KPI DIVIDIDO */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600 uppercase">Análisis de Planeación</span>
            <span className="text-[10px] text-gray-400">Total: {contadores.concluidas}</span>
          </div>
          <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex-1 p-4 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition">
              <div className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Fecha Original
              </div>
              <h4 className="text-3xl font-bold text-gray-800">{pctSinCambios}%</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">{contadores.sinCambiosOk} de {contadores.sinCambiosTotal} tareas<br />a la primera.</p>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition">
              <div className="text-xs font-semibold text-purple-600 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Reprogramadas
              </div>
              <h4 className="text-3xl font-bold text-gray-800">{pctConCambios}%</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">{contadores.conCambiosOk} de {contadores.conCambiosTotal} tareas<br />cumplieron prórroga.</p>
            </div>
          </div>
        </div>

        {/* 🔴 KPI: VENCIDAS Y PRÓXIMAS */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className={`bg-white rounded-xl shadow flex flex-col border-t-4 border-red-500 transition-all duration-300 h-full ${openVencidas ? 'ring-2 ring-red-50' : ''}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Vencidas</p>
                  <h3 className="text-3xl font-black text-red-600 mt-1">{contadores.pendientesVencidas}</h3>
                </div>
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Requieren atención inmediata.</p>
            </div>
            {listaVencidas.length > 0 && (
              <div className="mt-auto">
                <button onClick={() => setOpenVencidas(!openVencidas)} className="w-full py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex justify-center items-center gap-1 border-t border-red-100">
                  {openVencidas ? "Ocultar lista" : "Ver lista"}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${openVencidas ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`bg-gray-50 px-4 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar ${openVencidas ? "max-h-60 py-3 border-t border-red-200" : "max-h-0 py-0"}`}>
                  <ul className="space-y-2">
                    {listaVencidas.map(t => (
                      <li key={t.id} className="flex flex-col bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-800 truncate" title={t.tarea}>{t.tarea}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5"><span className="font-semibold text-red-700">{renderResponsables(t.responsables)}</span></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className={`bg-white rounded-xl shadow flex flex-col border-t-4 border-amber-500 transition-all duration-300 h-full ${openProximas ? 'ring-2 ring-amber-50' : ''}`}>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Próximas</p>
                  <h3 className="text-3xl font-black text-amber-600">{contadores.pendientesProximas}</h3>
                </div>
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">Vencen en menos de 48 horas.</p>
            </div>
            {listaProximas.length > 0 && (
              <div className="mt-auto">
                <button onClick={() => setOpenProximas(!openProximas)} className="w-full py-2 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors flex justify-center items-center gap-1 border-t border-amber-100">
                  {openProximas ? "Ocultar lista" : "Ver lista"}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${openProximas ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className={`bg-gray-50 px-4 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar ${openProximas ? "max-h-60 py-3 border-t border-amber-200" : "max-h-0 py-0"}`}>
                  <ul className="space-y-2">
                    {listaProximas.map(t => (
                      <li key={t.id} className="flex flex-col bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-800 truncate" title={t.tarea}>{t.tarea}</span>
                        <div className="text-[10px] text-gray-500 mt-0.5"><span className="font-semibold text-amber-700">{renderResponsables(t.responsables)}</span></div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: GRÁFICAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 p-1 rounded text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
            </span>
            Top Motivos
          </h4>
          {topMotivos.length > 0 ? (
            <div className="space-y-4">
              {topMotivos.map(([motivo, cantidad], idx) => (
                <div key={idx} className="relative">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate w-3/4">{motivo}</span>
                    <span className="font-bold text-gray-900">{cantidad}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(cantidad / contadores.totalCambios) * 100}%` }}></div>
                  </div>
                </div>
              ))}
              <div className="text-right text-xs text-gray-400 mt-2">Cambios totales: {contadores.totalCambios}</div>
            </div>
          ) : (<div className="h-32 flex items-center justify-center text-gray-400 italic text-sm bg-gray-50 rounded-lg">Sin datos.</div>)}
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex flex-col">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-amber-100 p-1 rounded text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
            </span>
            Salud Tareas (Pendientes)
          </h4>
          <div className="flex-grow flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-red-600">VENCIDAS</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-red-500 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesVencidas / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesVencidas > 0 ? '1.5rem' : '0' }}>{contadores.pendientesVencidas > 0 && contadores.pendientesVencidas}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-amber-600">PRÓXIMAS</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-amber-400 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesProximas / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesProximas > 0 ? '1.5rem' : '0' }}>{contadores.pendientesProximas > 0 && contadores.pendientesProximas}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-blue-600">NORMAL</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-blue-400 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesNormal / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesNormal > 0 ? '1.5rem' : '0' }}>{contadores.pendientesNormal > 0 && contadores.pendientesNormal}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex flex-col">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-red-100 p-1 rounded text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </span>
            Carga por Urgencia
          </h4>
          <div className="flex-grow flex flex-col justify-center space-y-3">
            {(['ALTA', 'MEDIA', 'BAJA'] as const).map(nivel => (
              <div key={nivel} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-8 rounded ${COLOR_URGENCIA[nivel]}`}></div>
                  <span className="text-sm font-bold text-gray-600">{nivel}</span>
                </div>
                <span className="text-xl font-black text-gray-800">{contadores.urgencia[nivel]}</span>
              </div>
            ))}
            <div className="text-right text-xs text-gray-400 pt-1">Total tareas en periodo: {contadores.total}</div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: RENDIMIENTO EQUIPO (ACTUALIZADA) --- */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="text-lg font-bold text-gray-800">🏆 Rendimiento de Responsables</h4>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Ordenado por Volumen</span>
        </div>

        {/* ==========================================
            VISTA ESCRITORIO 
            ========================================== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Usuario / Rol</th>
                <th className="px-6 py-3 text-center">Total</th>
                <th className="px-6 py-3 text-center text-blue-600 bg-blue-50/30">Pendientes</th>
                <th className="px-6 py-3 text-center text-gray-600 bg-gray-50/30">Concluidas</th>
                <th className="px-6 py-3 text-center text-green-600 bg-green-50/30">A Tiempo</th>
                <th className="px-6 py-3 text-center text-red-600 bg-red-50/30">Vencidas</th>
                <th className="px-6 py-3 text-center">Eficacia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingUsuarios.length > 0 ? (
                rankingUsuarios.map((user, idx) => {
                  const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
                  const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

                  // 📊 CÁLCULO DE EFICACIA CORREGIDO:
                  // Numerador: Concluidas A Tiempo
                  // Denominador: Total de Tareas que ya tuvieron fecha límite (Concluidas + Pendientes Vencidas)
                  // Tareas pendientes normales no cuentan para el score (ni bien ni mal)
                  const totalEvaluables = user.concluidas + (user.vencidas - (user.concluidas - user.aTiempo));
                  // Nota: user.vencidas incluye (Concluidas Tarde + Pendientes Vencidas).
                  // Simplificación matemática: user.concluidas + (Pendientes Vencidas).
                  // Para obtener Pendientes Vencidas: user.vencidas - (user.concluidas - user.aTiempo).
                  // Por tanto: Denominador = user.aTiempo + (user.concluidas - user.aTiempo) + (user.vencidas - (user.concluidas - user.aTiempo)) = user.aTiempo + user.vencidas(solo pendientes) + retrasadas.
                  // MÁS FÁCIL: Denominador = user.concluidas + (Pendientes Vencidas).
                  // Pendientes Vencidas = user.vencidas (Total Malas) - (user.concluidas - user.aTiempo) (Malas ya cerradas).

                  const malasCerradas = user.concluidas - user.aTiempo;
                  const malasAbiertas = user.vencidas - malasCerradas;
                  const baseCalculo = user.concluidas + malasAbiertas;

                  const eficacia = baseCalculo > 0
                    ? Math.round((user.aTiempo / baseCalculo) * 100)
                    : (user.pendientes > 0 ? 100 : 0); // Si solo tiene pendientes al día, 100%

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">
                        <div className={colorClass}>{user.nombre}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{rolDisplay}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-800">{user.total}</td>
                      <td className="px-6 py-4 text-center font-semibold text-blue-700 bg-blue-50/30">{user.pendientes}</td>
                      <td className="px-6 py-4 text-center font-semibold text-gray-600 bg-gray-50/30">{user.concluidas}</td>
                      <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{user.aTiempo}</td>
                      <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30">
                        {user.vencidas > 0 ? user.vencidas : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${eficacia >= 80 ? 'bg-green-100 text-green-800' : eficacia >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {eficacia}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 italic">No hay datos disponibles.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==========================================
            VISTA MÓVIL 
            ========================================== */}
        <div className="md:hidden bg-gray-50 p-2 space-y-2">
          {rankingUsuarios.length > 0 ? (
            rankingUsuarios.map((user, idx) => {
              const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
              const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

              const malasCerradas = user.concluidas - user.aTiempo;
              const malasAbiertas = user.vencidas - malasCerradas;
              const baseCalculo = user.concluidas + malasAbiertas;
              const eficacia = baseCalculo > 0 ? Math.round((user.aTiempo / baseCalculo) * 100) : (user.pendientes > 0 ? 100 : 0);

              return (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <div>
                      <div className={`text-sm ${colorClass}`}>{user.nombre}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{rolDisplay}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 font-bold uppercase">Eficacia</div>
                      <span className={`text-sm font-black ${eficacia >= 80 ? 'text-green-600' : eficacia >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {eficacia}%
                      </span>
                    </div>
                  </div>

                  {/* Grid de Métricas 3x2 */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded p-1 border border-gray-100">
                      <span className="block text-[9px] text-gray-400 uppercase font-bold">Total</span>
                      <span className="text-xs font-black text-gray-700">{user.total}</span>
                    </div>
                    <div className="bg-blue-50 rounded p-1 border border-blue-100">
                      <span className="block text-[9px] text-blue-600 uppercase font-bold">Pend.</span>
                      <span className="text-xs font-black text-blue-700">{user.pendientes}</span>
                    </div>
                    <div className="bg-gray-50 rounded p-1 border border-gray-100">
                      <span className="block text-[9px] text-gray-500 uppercase font-bold">Concl.</span>
                      <span className="text-xs font-black text-gray-700">{user.concluidas}</span>
                    </div>
                    <div className="bg-green-50 rounded p-1 border border-green-100 col-span-1">
                      <span className="block text-[9px] text-green-600 uppercase font-bold">A Tiempo</span>
                      <span className="text-xs font-black text-green-700">{user.aTiempo}</span>
                    </div>
                    <div className="bg-red-50 rounded p-1 border border-red-100 col-span-2 flex items-center justify-between px-3">
                      <span className="block text-[9px] text-red-600 uppercase font-bold">Vencidas (Totales)</span>
                      <span className="text-sm font-black text-red-700">{user.vencidas}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-gray-400 italic text-xs">No hay datos disponibles.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardMetricas;