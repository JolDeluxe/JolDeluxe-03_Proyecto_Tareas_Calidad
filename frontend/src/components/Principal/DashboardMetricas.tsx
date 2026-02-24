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
  ENCARGADO: "Supervisión",
  USUARIO: "Operativo",
  ADMIN: "Gestión",
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

  // 👇 Lógica de colores AMPLIADA 👇
  let colorEficienciaBarra = "bg-gray-300";
  let colorEficienciaBorde = "border-gray-200";
  let colorEficienciaTexto = "text-gray-800";
  let colorEficienciaFondo = "bg-gray-50";
  let colorEficienciaGlow = "shadow-gray-500/20";

  if (contadores.universoEvaluable > 0) {
    if (pctEficienciaGlobal >= 80) { // Verde
      colorEficienciaBarra = "bg-emerald-500";
      colorEficienciaBorde = "border-emerald-200";
      colorEficienciaTexto = "text-emerald-600";
      colorEficienciaFondo = "bg-emerald-50";
      colorEficienciaGlow = "shadow-emerald-500/30";
    } else if (pctEficienciaGlobal >= 60) { // Amarillo
      colorEficienciaBarra = "bg-amber-400";
      colorEficienciaBorde = "border-amber-200";
      colorEficienciaTexto = "text-amber-600";
      colorEficienciaFondo = "bg-amber-50";
      colorEficienciaGlow = "shadow-amber-500/30";
    } else if (pctEficienciaGlobal >= 50) { // Naranja
      colorEficienciaBarra = "bg-orange-500";
      colorEficienciaBorde = "border-orange-200";
      colorEficienciaTexto = "text-orange-600";
      colorEficienciaFondo = "bg-orange-50";
      colorEficienciaGlow = "shadow-orange-500/30";
    } else { // Rojo
      colorEficienciaBarra = "bg-red-500";
      colorEficienciaBorde = "border-red-200";
      colorEficienciaTexto = "text-red-600";
      colorEficienciaFondo = "bg-red-50";
      colorEficienciaGlow = "shadow-red-500/30";
    }
  }

  const tareasValidasGlobal = tareas.filter(t => {
    if (!t.fechaRegistro) return false;
    const d = new Date(t.fechaRegistro);
    const coincideFecha = d.getFullYear() === year && (month === 0 || d.getMonth() + 1 === month);
    return coincideFecha && t.estatus.toUpperCase() !== "CANCELADA";
  });

  let metricaEstados = {
    pendOk: 0, pendVencida: 0,
    entOk: 0, entTarde: 0,
    concOk: 0, concTarde: 0,
    total: tareasValidasGlobal.length
  };

  const ahoraGlobalMs = new Date().getTime();

  tareasValidasGlobal.forEach(t => {
    const estatus = t.estatus.toUpperCase();
    const fechaObjFinal = getFechaEfectiva(t);
    const fechaLimiteFinal = fechaObjFinal ? getTimestamp(fechaObjFinal) : 0;

    let cumplio = false;
    if (estatus === "CONCLUIDA" && t.fechaConclusion) {
      cumplio = fechaLimiteFinal > 0 && getTimestamp(t.fechaConclusion) <= fechaLimiteFinal;
    } else if (estatus === "EN_REVISION" && t.fechaEntrega) {
      cumplio = fechaLimiteFinal > 0 && getTimestamp(t.fechaEntrega) <= fechaLimiteFinal;
    }

    if (estatus === "PENDIENTE") {
      const estaVencida = fechaLimiteFinal > 0 && ahoraGlobalMs > fechaLimiteFinal;
      if (estaVencida) metricaEstados.pendVencida++; else metricaEstados.pendOk++;
    } else if (estatus === "EN_REVISION") {
      if (cumplio) metricaEstados.entOk++; else metricaEstados.entTarde++;
    } else if (estatus === "CONCLUIDA") {
      if (cumplio) metricaEstados.concOk++; else metricaEstados.concTarde++;
    }
  });

  // Función segura para sacar porcentaje (evita error de dividir entre cero)
  const safeTotal = metricaEstados.total > 0 ? metricaEstados.total : 1;
  const getPct = (val: number) => Math.round((val / safeTotal) * 100);

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* --- SECCIÓN 1: KPIs MAESTROS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Opción 1: SaaS Moderno */}
        <div className={`p-6 rounded-2xl shadow-sm border ${colorEficienciaBorde} ${colorEficienciaFondo} relative overflow-hidden transition-all duration-500`}>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className={`text-xs font-black uppercase tracking-widest ${colorEficienciaTexto} opacity-80`}>Eficiencia Real</p>
                <h3 className={`text-6xl font-black tracking-tighter mt-1 ${colorEficienciaTexto}`}>
                  {contadores.universoEvaluable === 0 ? "N/A" : `${pctEficienciaGlobal}%`}
                </h3>
              </div>
              <span className="bg-white text-gray-600 text-[10px] uppercase font-black px-2 py-1 rounded-md shadow-sm">GLOBAL</span>
            </div>

            <div className="mt-6 w-full bg-white/60 rounded-full h-3 backdrop-blur-sm border border-white/50 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${colorEficienciaBarra}`}
                style={{ width: `${pctEficienciaGlobal}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow flex flex-col overflow-hidden border border-gray-100">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-extrabold text-gray-600 uppercase tracking-widest">Distribución del Trabajo</span>
            <span className="text-xs text-gray-500 font-bold bg-white px-2.5 py-1 rounded border shadow-sm">
              Total: {metricaEstados.total} Tareas
            </span>
          </div>

          <div className="flex-grow p-5 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x divide-gray-100">

            {/* 1. PENDIENTES */}
            <div className="flex flex-col px-2 md:px-4">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Pendientes</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> A Tiempo</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.pendOk}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.pendOk)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Atrasadas</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.pendVencida}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.pendVencida)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ENTREGADAS (EN REVISIÓN) */}
            <div className="flex flex-col px-2 md:px-4">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Entregadas</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div> A Tiempo</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.entOk}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.entOk)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Con Retraso</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.entTarde}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.entTarde)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CONCLUIDAS */}
            <div className="flex flex-col px-2 md:px-4">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Concluidas</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> A Tiempo</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.concOk}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.concOk)}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-orange-600 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> Con Retraso</span>
                  <div className="text-right flex items-center">
                    <span className="text-sm font-black text-gray-800">{metricaEstados.concTarde}</span>
                    <span className="text-[10px] font-bold text-gray-400 ml-2 w-7 text-right">{getPct(metricaEstados.concTarde)}%</span>
                  </div>
                </div>
              </div>
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
                <th className="px-6 py-4 text-center border-l border-gray-200">Eficiencia Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rankingUsuarios.length > 0 ? (
                rankingUsuarios.map((user, idx) => {
                  const colorClass = user.rol === 'ENCARGADO' ? COLOR_ROL.ENCARGADO : user.rol === 'USUARIO' ? COLOR_ROL.USUARIO : COLOR_ROL.OTROS;
                  const rolDisplay = ROLE_LABELS[user.rol] || user.rol;

                  // Cálculos de porcentajes sobre el total de asignadas
                  const pctPendOk = user.asignadas > 0 ? Math.round((user.pendientesOk / user.asignadas) * 100) : 0;
                  const pctPendVencidas = user.asignadas > 0 ? Math.round((user.pendientesVencidas / user.asignadas) * 100) : 0;
                  const pctEntTarde = user.asignadas > 0 ? Math.round((user.entregadasTarde / user.asignadas) * 100) : 0;
                  const pctATiempo = user.asignadas > 0 ? Math.round((user.aTiempo / user.asignadas) * 100) : 0;

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
                      <td className="px-4 py-4 text-center font-semibold text-blue-700 bg-blue-50/20">
                        {user.pendientesOk} <span className="text-[10px] font-bold opacity-60 ml-0.5">({pctPendOk}%)</span>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-red-600 bg-red-50/20">
                        {user.pendientesVencidas} <span className="text-[10px] font-bold opacity-60 ml-0.5">({pctPendVencidas}%)</span>
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-amber-600 bg-amber-50/20">
                        {user.entregadasTarde} <span className="text-[10px] font-bold opacity-60 ml-0.5">({pctEntTarde}%)</span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-emerald-600 bg-emerald-50/20">
                        {user.aTiempo} <span className="text-[10px] font-bold opacity-60 ml-0.5">({pctATiempo}%)</span>
                      </td>
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

              // Cálculos para versión móvil
              const pctPendOk = user.asignadas > 0 ? Math.round((user.pendientesOk / user.asignadas) * 100) : 0;
              const pctPendVencidas = user.asignadas > 0 ? Math.round((user.pendientesVencidas / user.asignadas) * 100) : 0;
              const pctEntTarde = user.asignadas > 0 ? Math.round((user.entregadasTarde / user.asignadas) * 100) : 0;
              const pctATiempo = user.asignadas > 0 ? Math.round((user.aTiempo / user.asignadas) * 100) : 0;
              const pctEval = user.asignadas > 0 ? Math.round((user.evaluadas / user.asignadas) * 100) : 0;

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
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Eficacia Real</div>
                      {eficaciaNum === -1 ? (
                        <span className="text-sm font-black text-gray-400 bg-gray-100 px-2 py-1 rounded">N/A</span>
                      ) : (
                        <span className={`text-xl font-black tracking-tighter ${eficaciaNum >= 85 ? 'text-emerald-600' : eficaciaNum >= 70 ? 'text-amber-500' : 'text-red-600'}`}>
                          {eficaciaNum}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grid Responsivo de 2x3 */}
                  <div className="grid grid-cols-3 gap-2 text-center pr-2">
                    <div className="bg-gray-50 rounded-lg py-2 border border-gray-100 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-gray-500 uppercase font-extrabold tracking-wider">Total</span>
                      <span className="text-sm font-black text-gray-800">{user.asignadas}</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg py-2 border border-blue-100 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-blue-600 uppercase font-extrabold tracking-wider">Pend. OK</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-blue-700">{user.pendientesOk}</span>
                        <span className="text-[9px] font-bold text-blue-500/70">({pctPendOk}%)</span>
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg py-2 border border-red-100 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-red-600 uppercase font-extrabold tracking-wider">Vencidas</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-red-700">{user.pendientesVencidas}</span>
                        <span className="text-[9px] font-bold text-red-500/70">({pctPendVencidas}%)</span>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg py-2 border border-gray-200 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-gray-600 uppercase font-extrabold tracking-wider">Eval.</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-gray-700">{user.evaluadas}</span>
                        <span className="text-[9px] font-bold text-gray-500/70">({pctEval}%)</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg py-2 border border-amber-100 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-amber-700 uppercase font-extrabold tracking-wider">Tarde</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-amber-700">{user.entregadasTarde}</span>
                        <span className="text-[9px] font-bold text-amber-600/70">({pctEntTarde}%)</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg py-2 border border-emerald-100 flex flex-col justify-center items-center">
                      <span className="block text-[8px] text-emerald-700 uppercase font-extrabold tracking-wider">A Tiempo</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-emerald-700">{user.aTiempo}</span>
                        <span className="text-[9px] font-bold text-emerald-600/70">({pctATiempo}%)</span>
                      </div>
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