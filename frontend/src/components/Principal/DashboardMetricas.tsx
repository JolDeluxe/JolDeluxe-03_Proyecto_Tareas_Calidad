// 📍 src/components/Principal/DashboardMetricas.tsx

import React, { useMemo, useState, useEffect } from "react";
import type { Tarea } from "../../types/tarea";
import { usuariosService } from "../../api/usuarios.service";

// Colores ejecutivos para la UI
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

// --- 1. FUNCIONES HELPER DE FECHAS ---
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

const DashboardMetricas: React.FC<Props> = ({ tareas, year, month }) => {

  // --- ESTADO PARA USUARIOS DEL DEPARTAMENTO ---
  const [empleadosDepto, setEmpleadosDepto] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        // Obtenemos todos los usuarios (El backend ya filtra por departamentoId automáticamente si es ADMIN/ENCARGADO)
        const res = await usuariosService.getAll({ limit: 1000 });
        if (res.data) {
          // Filtramos solo a los que ejecutan tareas
          const filtrados = res.data.filter((u: any) => u.rol === 'ENCARGADO' || u.rol === 'USUARIO');
          setEmpleadosDepto(filtrados);
        }
      } catch (error) {
        console.error("Error al cargar la plantilla de usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  // --- 2. CÁLCULO MASIVO (MINERÍA DE DATOS) ---
  const data = useMemo(() => {
    const tareasValidas = tareas.filter(t => {
      if (!t.fechaRegistro) return false;
      const d = new Date(t.fechaRegistro);
      const coincideFecha = d.getFullYear() === year && (month === 0 || d.getMonth() + 1 === month);
      return coincideFecha && t.estatus.toUpperCase() !== "CANCELADA";
    });

    let contadores = {
      activasParaUrgencia: 0,
      universoEvaluable: 0,
      exitosATiempo: 0,
      sinCambiosTotal: 0,
      sinCambiosOk: 0,
      conCambiosTotal: 0,
      conCambiosOk: 0,
      motivos: {} as Record<string, number>,
      totalCambios: 0,
      urgencia: { ALTA: 0, MEDIA: 0, BAJA: 0 } as Record<string, number>
    };

    // 👤 MAPA DE RENDIMIENTO: Inicializamos con TODOS los empleados (Tengan o no tareas)
    const userMap: Record<string, {
      nombre: string;
      rol: string;
      asignadas: number;
      pendientesOk: number;
      pendientesVencidas: number;
      entregadasTarde: number;
      aTiempo: number;
      evaluadas: number;
    }> = {};

    empleadosDepto.forEach(emp => {
      userMap[emp.id] = {
        nombre: emp.nombre,
        rol: emp.rol,
        asignadas: 0,
        pendientesOk: 0,
        pendientesVencidas: 0,
        entregadasTarde: 0,
        aTiempo: 0,
        evaluadas: 0
      };
    });

    const ahoraMs = new Date().getTime();

    tareasValidas.forEach(t => {
      const estatus = t.estatus.toUpperCase();
      const isPendiente = estatus === "PENDIENTE";
      const isEnRevision = estatus === "EN_REVISION";
      const isConcluida = estatus === "CONCLUIDA";

      const fechaObjFinal = getFechaEfectiva(t);
      const fechaLimiteFinal = fechaObjFinal ? getTimestamp(fechaObjFinal) : 0;

      // --- A. CARGA DE TRABAJO ---
      if (isPendiente || isEnRevision) {
        contadores.activasParaUrgencia++;
        const urg = t.urgencia ? t.urgencia.toUpperCase() : "BAJA";
        if (contadores.urgencia[urg] !== undefined) contadores.urgencia[urg]++;
        else contadores.urgencia["BAJA"]++;
      }

      // --- B. MINERÍA DE HISTORIAL ---
      let tieneCambios = false;
      let fechaLimiteOriginal = t.fechaLimite ? getTimestamp(t.fechaLimite) : 0;

      if (t.historialFechas && t.historialFechas.length > 0) {
        tieneCambios = true;
        t.historialFechas.forEach(h => {
          const motivo = h.motivo || "No especificado";
          contadores.motivos[motivo] = (contadores.motivos[motivo] || 0) + 1;
          contadores.totalCambios++;
        });
        const historialAntiguo = [...t.historialFechas].sort((a, b) => new Date(a.fechaCambio || "").getTime() - new Date(b.fechaCambio || "").getTime());
        if (historialAntiguo[0]?.fechaAnterior) fechaLimiteOriginal = getTimestamp(historialAntiguo[0].fechaAnterior);
      }

      // --- C. ESTADO EXACTO DE LA TAREA ---
      const estaVencida = isPendiente && (fechaLimiteFinal > 0 && ahoraMs > fechaLimiteFinal);
      const debeEvaluarse = isConcluida || isEnRevision || estaVencida;

      let cumplioAjustado = false;

      if (debeEvaluarse) {
        contadores.universoEvaluable++;
        if (isConcluida && t.fechaConclusion) {
          cumplioAjustado = fechaLimiteFinal > 0 && getTimestamp(t.fechaConclusion) <= fechaLimiteFinal;
        } else if (isEnRevision && t.fechaEntrega) {
          cumplioAjustado = fechaLimiteFinal > 0 && getTimestamp(t.fechaEntrega) <= fechaLimiteFinal;
        }

        if (cumplioAjustado) contadores.exitosATiempo++;

        if (isConcluida) {
          const cumplioReal = t.fechaConclusion && fechaLimiteOriginal > 0 && getTimestamp(t.fechaConclusion) <= fechaLimiteOriginal;
          if (tieneCambios) {
            contadores.conCambiosTotal++;
            if (cumplioAjustado) contadores.conCambiosOk++;
          } else {
            contadores.sinCambiosTotal++;
            if (cumplioReal) contadores.sinCambiosOk++;
          }
        }
      }

      // --- D. REPARTO DE RESPONSABILIDAD EXACTA ---
      t.responsables.forEach((resp: any) => {
        const key = resp.id;
        // Si el usuario no estaba en el mapa (ej. un INVITADO), lo creamos al vuelo
        if (!userMap[key]) {
          userMap[key] = { nombre: resp.nombre, rol: resp.rol || "OTROS", asignadas: 0, pendientesOk: 0, pendientesVencidas: 0, entregadasTarde: 0, aTiempo: 0, evaluadas: 0 };
        }

        userMap[key].asignadas++;

        if (isPendiente && !estaVencida) {
          userMap[key].pendientesOk++;
        } else if (isPendiente && estaVencida) {
          userMap[key].pendientesVencidas++;
          userMap[key].evaluadas++;
        } else if (isConcluida || isEnRevision) {
          userMap[key].evaluadas++;
          if (cumplioAjustado) {
            userMap[key].aTiempo++;
          } else {
            userMap[key].entregadasTarde++;
          }
        }
      });
    });

    const topMotivos = Object.entries(contadores.motivos).sort(([, a], [, b]) => b - a).slice(0, 5);

    // Ordenamos el Leaderboard: Primero los que tienen más tareas asignadas, luego por nombre
    const rankingUsuarios = Object.values(userMap).sort((a, b) => b.asignadas - a.asignadas || a.nombre.localeCompare(b.nombre));

    return { contadores, topMotivos, rankingUsuarios };

  }, [tareas, year, month, empleadosDepto]);

  const { contadores, topMotivos, rankingUsuarios } = data;

  const pctEficienciaGlobal = contadores.universoEvaluable > 0 ? Math.round((contadores.exitosATiempo / contadores.universoEvaluable) * 100) : 0;
  const pctSinCambios = contadores.sinCambiosTotal > 0 ? Math.round((contadores.sinCambiosOk / contadores.sinCambiosTotal) * 100) : 0;
  const pctConCambios = contadores.conCambiosTotal > 0 ? Math.round((contadores.conCambiosOk / contadores.conCambiosTotal) * 100) : 0;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* --- SECCIÓN 1: KPIs MAESTROS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-indigo-600 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-indigo-900" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500 uppercase font-extrabold tracking-widest">Eficiencia Real</p>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-black px-2 py-1 rounded border border-indigo-100">GLOBAL</span>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <h3 className="text-6xl font-black text-gray-800 tracking-tighter">
                {contadores.universoEvaluable === 0 ? "N/A" : `${pctEficienciaGlobal}%`}
              </h3>
              {contadores.universoEvaluable > 0 && <span className="text-sm text-gray-500 font-medium">de éxito</span>}
            </div>
            <div className="mt-6 w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${pctEficienciaGlobal >= 85 ? 'bg-green-500' : pctEficienciaGlobal >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pctEficienciaGlobal}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest">Análisis de Planeación</span>
            <span className="text-xs text-gray-400 font-semibold bg-white px-2 py-1 rounded border">Solo Tareas Concluidas</span>
          </div>
          <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center hover:bg-gray-50/50 transition">
              <div className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fecha Original
              </div>
              <h4 className="text-4xl font-black text-gray-800">{contadores.sinCambiosTotal === 0 ? "N/A" : `${pctSinCambios}%`}</h4>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center hover:bg-gray-50/50 transition">
              <div className="text-xs font-bold text-violet-600 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Reprogramadas
              </div>
              <h4 className="text-4xl font-black text-gray-800">{contadores.conCambiosTotal === 0 ? "N/A" : `${pctConCambios}%`}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: LEADERBOARD DE RENDIMIENTO --- */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
          <h4 className="text-md font-extrabold text-gray-800 uppercase tracking-wide">Métricas Detalladas por Usuario</h4>
        </div>

        {/* 💻 VISTA ESCRITORIO */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4">Usuario / Rol</th>
                <th className="px-4 py-4 text-center border-l border-gray-200">Total Asignadas</th>
                <th className="px-4 py-4 text-center text-blue-700 bg-blue-50/30">Pendientes (En tiempo)</th>
                <th className="px-4 py-4 text-center text-red-700 bg-red-50/30">Pendientes Vencidas</th>
                <th className="px-4 py-4 text-center text-amber-700 bg-amber-50/30">Entregadas Tarde</th>
                <th className="px-4 py-4 text-center text-emerald-700 bg-emerald-50/30">Entregadas A Tiempo</th>
                <th className="px-6 py-4 text-center border-l border-gray-200">Eficacia Real</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingUsuarios.length > 0 ? (
                rankingUsuarios.map((user, idx) => {
                  const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
                  const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

                  let eficaciaNode;
                  if (user.evaluadas === 0) {
                    eficaciaNode = <span className="px-3 py-1 rounded text-xs font-bold bg-gray-100 text-gray-400">N/A</span>;
                  } else {
                    const eficacia = Math.round((user.aTiempo / user.evaluadas) * 100);
                    eficaciaNode = (
                      <span className={`px-2.5 py-1 rounded text-xs font-black shadow-sm ${eficacia >= 85 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : eficacia >= 70 ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {eficacia}%
                      </span>
                    );
                  }

                  return (
                    <tr key={idx} className={`transition-colors ${user.asignadas === 0 ? 'bg-gray-50/30 opacity-70' : 'hover:bg-gray-50/80'}`}>
                      <td className="px-6 py-4 font-medium">
                        <div className={`text-sm ${colorClass}`}>{user.nombre}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">{rolDisplay}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-gray-800 border-l border-gray-100">{user.asignadas}</td>
                      <td className="px-4 py-4 text-center font-semibold text-blue-700 bg-blue-50/20">{user.pendientesOk}</td>
                      <td className="px-4 py-4 text-center font-bold text-red-600 bg-red-50/20">{user.pendientesVencidas}</td>
                      <td className="px-4 py-4 text-center font-bold text-amber-600 bg-amber-50/20">{user.entregadasTarde}</td>
                      <td className="px-4 py-4 text-center font-black text-emerald-600 bg-emerald-50/20">{user.aTiempo}</td>
                      <td className="px-6 py-4 text-center border-l border-gray-100">{eficaciaNode}</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-semibold italic">No hay usuarios registrados en este departamento.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 VISTA MÓVIL Y TABLET */}
        <div className="lg:hidden bg-gray-50/50 p-3 space-y-3">
          {rankingUsuarios.length > 0 ? (
            rankingUsuarios.map((user, idx) => {
              const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
              const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

              let eficaciaNum = -1;
              let bgPill = 'bg-gray-200';
              if (user.evaluadas > 0) {
                eficaciaNum = Math.round((user.aTiempo / user.evaluadas) * 100);
                bgPill = eficaciaNum >= 85 ? 'bg-emerald-500' : eficaciaNum >= 70 ? 'bg-amber-400' : 'bg-red-500';
              }

              return (
                <div key={idx} className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative overflow-hidden ${user.asignadas === 0 ? 'opacity-80' : ''}`}>
                  <div className={`absolute top-0 right-0 h-full w-2 ${bgPill}`}></div>

                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-3 pr-2">
                    <div>
                      <div className={`text-[15px] ${colorClass} leading-tight`}>{user.nombre}</div>
                      <div className="text-[10px] text-gray-400 font-extrabold uppercase mt-0.5 tracking-wider">{rolDisplay}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Eficacia</div>
                      {eficaciaNum === -1 ? (
                        <span className="text-sm font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">N/A</span>
                      ) : (
                        <span className={`text-xl font-black tracking-tighter ${eficaciaNum >= 85 ? 'text-emerald-600' : eficaciaNum >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                          {eficaciaNum}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid Responsivo de 2x3 para alojar los 6 datos clave */}
                  <div className="grid grid-cols-3 gap-2 text-center pr-2">
                    <div className="bg-gray-50 rounded-lg py-2 border border-gray-100">
                      <span className="block text-[8px] text-gray-500 uppercase font-extrabold tracking-wider">Total</span>
                      <span className="text-sm font-black text-gray-800">{user.asignadas}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg py-2 border border-blue-100">
                      <span className="block text-[8px] text-blue-600 uppercase font-extrabold tracking-wider">Pend. OK</span>
                      <span className="text-sm font-black text-blue-700">{user.pendientesOk}</span>
                    </div>
                    <div className="bg-red-50 rounded-lg py-2 border border-red-100">
                      <span className="block text-[8px] text-red-600 uppercase font-extrabold tracking-wider">Vencidas</span>
                      <span className="text-sm font-black text-red-700">{user.pendientesVencidas}</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg py-2 border border-gray-200">
                      <span className="block text-[8px] text-gray-600 uppercase font-extrabold tracking-wider">Eval.</span>
                      <span className="text-sm font-black text-gray-700">{user.evaluadas}</span>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-2 border border-amber-100">
                      <span className="block text-[8px] text-amber-700 uppercase font-extrabold tracking-wider">Tarde</span>
                      <span className="text-sm font-black text-amber-700">{user.entregadasTarde}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-lg py-2 border border-emerald-100">
                      <span className="block text-[8px] text-emerald-700 uppercase font-extrabold tracking-wider">A Tiempo</span>
                      <span className="text-sm font-black text-emerald-700">{user.aTiempo}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-gray-400 font-semibold italic text-sm">No hay usuarios registrados.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardMetricas;