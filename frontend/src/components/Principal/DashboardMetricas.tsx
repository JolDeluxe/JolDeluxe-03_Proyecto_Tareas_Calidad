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

// Colores para las barras de urgencia
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
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Obtiene la fecha real (última del historial o la original)
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

    let contadores = {
      total: tareasPeriodo.length,
      concluidas: 0,
      pendientes: 0,
      aTiempoReal: 0,
      aTiempoAjustado: 0,
      retrasadas: 0,
      pendientesVencidas: 0,
      pendientesProximas: 0,
      pendientesNormal: 0,
      motivos: {} as Record<string, number>,
      totalCambios: 0,
      // Nueva estructura para urgencia
      urgencia: { ALTA: 0, MEDIA: 0, BAJA: 0 } as Record<string, number>
    };

    const userMap: Record<string, {
      nombre: string;
      rol: string;
      total: number;
      aTiempo: number;
      retrasadas: number
    }> = {};

    const listaVencidas: Tarea[] = [];
    const listaProximas: Tarea[] = [];

    tareasPeriodo.forEach(t => {

      // --- A. Análisis por ESTATUS (Excluyentes) ---
      if (t.estatus === "CONCLUIDA" && t.fechaConclusion) {
        contadores.concluidas++;
        const fechaFin = resetTime(t.fechaConclusion);
        const fechaObjFinal = getFechaEfectiva(t);
        const fechaLimiteFinal = fechaObjFinal ? resetTime(fechaObjFinal) : 0;
        let fechaLimiteOriginal = t.fechaLimite ? resetTime(t.fechaLimite) : 0;

        if (t.historialFechas && t.historialFechas.length > 0) {
          const historialAntiguo = [...t.historialFechas].sort((a, b) => {
            const tA = new Date(a.fechaCambio || "").getTime();
            const tB = new Date(b.fechaCambio || "").getTime();
            return tA - tB;
          });
          if (historialAntiguo[0]?.fechaAnterior) {
            fechaLimiteOriginal = resetTime(historialAntiguo[0].fechaAnterior);
          }
        }

        const cumplioAjustado = fechaLimiteFinal > 0 && fechaFin <= fechaLimiteFinal;
        const cumplioReal = fechaLimiteOriginal > 0 && fechaFin <= fechaLimiteOriginal;

        if (cumplioAjustado) contadores.aTiempoAjustado++;
        else contadores.retrasadas++;

        if (cumplioReal) contadores.aTiempoReal++;

        t.responsables.forEach((resp: any) => {
          const key = resp.id;
          if (!userMap[key]) {
            userMap[key] = { nombre: resp.nombre, rol: resp.rol || "USUARIO", total: 0, aTiempo: 0, retrasadas: 0 };
          }
          userMap[key].total++;
          if (cumplioAjustado) userMap[key].aTiempo++;
          else userMap[key].retrasadas++;
        });
      }
      else if (t.estatus === "PENDIENTE") {
        contadores.pendientes++;
        const fechaReal = getFechaEfectiva(t);
        const estado = getEstadoPendiente(fechaReal);

        if (estado === "vencida") {
          contadores.pendientesVencidas++;
          listaVencidas.push(t);
        } else if (estado === "proxima") {
          contadores.pendientesProximas++;
          listaProximas.push(t);
        } else {
          contadores.pendientesNormal++;
        }
      }

      // --- B. Análisis GLOBAL (Aplica a TODAS las tareas) ---

      // 1. Motivos y Cambios (Ahora fuera del if de concluidas)
      if (t.historialFechas && t.historialFechas.length > 0) {
        t.historialFechas.forEach(h => {
          const motivo = h.motivo || "Sin especificar";
          contadores.motivos[motivo] = (contadores.motivos[motivo] || 0) + 1;
          contadores.totalCambios++;
        });
      }

      // 2. Urgencia (Nueva Métrica)
      const urg = t.urgencia ? t.urgencia.toUpperCase() : "BAJA";
      if (contadores.urgencia[urg] !== undefined) {
        contadores.urgencia[urg]++;
      } else {
        contadores.urgencia["BAJA"]++; // Default seguro
      }

    });

    const topMotivos = Object.entries(contadores.motivos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const rankingUsuarios = Object.values(userMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return { contadores, topMotivos, rankingUsuarios, listaVencidas, listaProximas };

  }, [tareas, year, month]);

  const { contadores, topMotivos, rankingUsuarios, listaVencidas, listaProximas } = data;

  const pctEficienciaAjustada = contadores.concluidas > 0
    ? Math.round((contadores.aTiempoAjustado / contadores.concluidas) * 100) : 0;

  const pctEficienciaReal = contadores.concluidas > 0
    ? Math.round((contadores.aTiempoReal / contadores.concluidas) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* --- SECCIÓN 1: KPIs --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* KPI: EFICIENCIA REAL */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Cumplimiento (Original)</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{pctEficienciaReal}%</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Tareas terminadas sin reprogramar fecha.</p>
          </div>
        </div>

        {/* KPI: EFICIENCIA AJUSTADA */}
        <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Cumplimiento (Ajustado)</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">{pctEficienciaAjustada}%</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Tareas terminadas con cambios en fecha limite.</p>
          </div>
        </div>

        {/* 🔴 KPI: VENCIDAS */}
        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Vencidas (Pendientes)</p>
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
              <button
                onClick={() => setOpenVencidas(!openVencidas)}
                className="w-full py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex justify-center items-center gap-1"
              >
                {openVencidas ? "Ocultar lista" : "Ver lista"}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${openVencidas ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`bg-gray-50 px-4 transition-all duration-300 ease-in-out overflow-y-auto ${openVencidas ? "max-h-60 py-3 border-t border-red-100" : "max-h-0 py-0"}`}>
                <ul className="space-y-3">
                  {listaVencidas.map((t) => (
                    <li key={t.id} className="flex flex-col border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-gray-800" title={t.tarea}>• {t.tarea}</span>
                      <div className="text-[10px] text-gray-500 pl-2 mt-0.5 leading-tight">
                        Resp: <span className="text-red-700 font-semibold break-words">{renderResponsables(t.responsables)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 🟠 KPI: PRÓXIMAS */}
        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden transition-all duration-300">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Próximas a Vencer</p>
                <h3 className="text-3xl font-black text-amber-600 mt-1">{contadores.pendientesProximas}</h3>
              </div>
              <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Vencen en menos de 48 horas.</p>
          </div>
          {listaProximas.length > 0 && (
            <div className="mt-auto">
              <button
                onClick={() => setOpenProximas(!openProximas)}
                className="w-full py-2 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors flex justify-center items-center gap-1"
              >
                {openProximas ? "Ocultar lista" : "Ver lista"}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transform transition-transform ${openProximas ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`bg-gray-50 px-4 transition-all duration-300 ease-in-out overflow-y-auto ${openProximas ? "max-h-60 py-3 border-t border-amber-100" : "max-h-0 py-0"}`}>
                <ul className="space-y-3">
                  {listaProximas.map((t) => (
                    <li key={t.id} className="flex flex-col border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-medium text-gray-800" title={t.tarea}>• {t.tarea}</span>
                      <div className="text-[10px] text-gray-500 pl-2 mt-0.5 leading-tight">
                        Resp: <span className="text-amber-700 font-semibold break-words">{renderResponsables(t.responsables)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- SECCIÓN 2: GRÁFICAS (3 Columnas) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Motivos */}
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
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 italic text-sm bg-gray-50 rounded-lg">Sin datos.</div>
          )}
        </div>

        {/* 2. Salud Tareas */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-amber-100 p-1 rounded text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
            </span>
            Salud Tareas
          </h4>
          <div className="flex-grow flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-red-600">VENCIDAS</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-red-500 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesVencidas / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesVencidas > 0 ? '1.5rem' : '0' }}>
                  {contadores.pendientesVencidas > 0 && contadores.pendientesVencidas}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-amber-600">PRÓXIMAS</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-amber-400 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesProximas / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesProximas > 0 ? '1.5rem' : '0' }}>
                  {contadores.pendientesProximas > 0 && contadores.pendientesProximas}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 text-right text-xs font-bold text-blue-600">NORMAL</div>
              <div className="flex-1 bg-gray-100 h-6 rounded-lg overflow-hidden relative">
                <div className="bg-blue-400 h-full flex items-center justify-end pr-2 text-white text-[10px] font-bold transition-all duration-1000" style={{ width: `${contadores.pendientes > 0 ? (contadores.pendientesNormal / contadores.pendientes) * 100 : 0}%`, minWidth: contadores.pendientesNormal > 0 ? '1.5rem' : '0' }}>
                  {contadores.pendientesNormal > 0 && contadores.pendientesNormal}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. NUEVA MÉTRICA: Distribución por Urgencia */}
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

      {/* --- SECCIÓN 3: RENDIMIENTO EQUIPO --- */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="text-lg font-bold text-gray-800">🏆 Rendimiento de Responsables</h4>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Ordenado por Volumen</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Usuario / Rol</th>
                <th className="px-6 py-3 text-center">Tareas Concluidas</th>
                <th className="px-6 py-3 text-center">A Tiempo (Ajustado)</th>
                <th className="px-6 py-3 text-center">Retrasadas</th>
                <th className="px-6 py-3 text-center">Eficacia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingUsuarios.length > 0 ? (
                rankingUsuarios.map((user, idx) => {
                  const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
                  const eficacia = Math.round((user.aTiempo / user.total) * 100);

                  // 🔹 Lógica de visualización de roles
                  const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium">
                        <div className={colorClass}>{user.nombre}</div>
                        {/* 🔹 Usamos la variable traducida aquí */}
                        <div className="text-[10px] text-gray-400 font-normal">{rolDisplay}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700">{user.total}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-bold">{user.aTiempo}</td>
                      <td className="px-6 py-4 text-center text-red-500 font-bold">{user.retrasadas}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${eficacia >= 80 ? 'bg-green-100 text-green-800' : eficacia >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{eficacia}%</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No hay tareas concluidas en este periodo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DashboardMetricas;