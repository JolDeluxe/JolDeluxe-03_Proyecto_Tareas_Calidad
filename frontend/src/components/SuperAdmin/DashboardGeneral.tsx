import { useState, useEffect, useMemo } from "react";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import { usuariosService } from "../../api/usuarios.service";
import { tareasService } from "../../api/tareas.service";
import { logsService } from "../../api/logs.service";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// --- HELPER FUNCTIONS ---
const resetTime = (date: Date | string | null | undefined): number => {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (isNaN(d.getTime())) return 0;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
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

const DashboardGeneral = () => {
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // Métricas "Calientes"
  const [actividadHoy, setActividadHoy] = useState({ creadas: 0, terminadas: 0 });
  const [erroresRecientes, setErroresRecientes] = useState(0);
  const [totalVencidas, setTotalVencidas] = useState(0);
  const [ping, setPing] = useState<number | null>(null);

  const fetchData = async () => {
    const start = performance.now();
    setLoading(true);

    try {
      // Traemos Logs también para buscar errores
      const [d, u, t, l] = await Promise.all([
        departamentosService.getAll(),
        usuariosService.getAll(),
        tareasService.getAll(),
        logsService.getAll()
      ]);

      const end = performance.now();
      setPing(Math.round(end - start));

      setDeptos(d);
      setTareas(t);

      // 1. Calcular Actividad de HOY (Pulso del negocio)
      let creadasHoy = 0;
      let terminadasHoy = 0;
      let vencidasCount = 0;

      t.forEach(tarea => {
        // CORRECCIÓN: Validamos que fechaRegistro exista antes de pasarlo a isToday
        if (tarea.fechaRegistro && isToday(tarea.fechaRegistro)) {
          creadasHoy++;
        }

        // Terminadas hoy
        if (tarea.estatus === 'CONCLUIDA' && tarea.fechaConclusion && isToday(tarea.fechaConclusion)) {
          terminadasHoy++;
        }

        // Vencidas Globales (Foco Rojo)
        if (tarea.estatus === 'PENDIENTE') {
          const fechaEfectiva = getFechaEfectiva(tarea);
          if (fechaEfectiva) {
            const hoyMs = resetTime(new Date());
            const limiteMs = resetTime(fechaEfectiva);
            if (limiteMs < hoyMs) vencidasCount++;
          }
        }
      });

      setActividadHoy({ creadas: creadasHoy, terminadas: terminadasHoy });
      setTotalVencidas(vencidasCount);

      // 2. Calcular Errores Recientes (Salud Técnica)
      // Filtramos logs que contengan "ERROR" o "FAIL" en la acción o descripción
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

  // Lógica de Eficiencia
  const metricasPorDepto = useMemo(() => {
    const map = new Map<number, any>();
    deptos.forEach(d => map.set(d.id, { nombre: d.nombre, total: 0, pendientes: 0, concluidas: 0, aTiempo: 0 }));

    tareas.forEach(t => {
      const stats = map.get(t.departamentoId);
      if (!stats) return;
      stats.total++;
      if (t.estatus === "PENDIENTE" || t.estatus === "EN_REVISION") stats.pendientes++;
      else if (t.estatus === "CONCLUIDA" && t.fechaConclusion) {
        stats.concluidas++;
        const fechaLimiteFinal = getFechaEfectiva(t);
        const limiteMs = fechaLimiteFinal ? resetTime(fechaLimiteFinal) : 0;
        const conclusionMs = resetTime(t.fechaConclusion);
        if (limiteMs > 0 && conclusionMs <= limiteMs) stats.aTiempo++;
      }
    });

    return Array.from(map.values()).map((m: any) => {
      const eficacia = m.concluidas > 0 ? Math.round((m.aTiempo / m.concluidas) * 100) : (m.pendientes > 0 ? 100 : 0);
      return { ...m, eficacia };
    }).sort((a: any, b: any) => b.eficacia - a.eficacia);
  }, [deptos, tareas]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">

      {/* --- SECCIÓN 1: INTELIGENCIA OPERATIVA (KPIs Reales) --- */}
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

        {/* 2. Salud del Sistema (Errores) */}
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

        {/* 3. Focos Rojos (Vencidas Globales) */}
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

        {/* 4. Eficiencia Global Promedio */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <svg className="w-16 h-16 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-xs font-bold uppercase text-emerald-500 tracking-wider mb-2">Eficacia Promedio</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-slate-800">
              {metricasPorDepto.length > 0
                ? Math.round(metricasPorDepto.reduce((acc: any, curr: any) => acc + curr.eficacia, 0) / metricasPorDepto.length)
                : 0}%
            </span>
            <span className="text-sm font-medium text-slate-400 mb-1">Global</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Promedio de todos los deptos.
          </div>
        </div>

      </div>

      {/* 2. TABLA DE EFICIENCIA OPERATIVA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Desglose por Departamento</h3>
            <p className="text-sm text-slate-500">¿Qué áreas están cumpliendo y cuáles tienen rezago?</p>
          </div>
          {/* Leyenda Simple */}
          <div className="flex gap-3 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> &ge; 80%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 60-79%</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> &lt; 60%</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4 pl-6">Departamento</th>
                <th className="p-4 text-center">Volumen</th>
                <th className="p-4 text-center text-blue-600 bg-blue-50/50">Pendientes</th>
                <th className="p-4 text-center text-slate-600 bg-slate-100/50">Concluidas</th>
                <th className="p-4 text-center text-green-600 bg-green-50/50">A Tiempo</th>
                <th className="p-4 text-center w-24">Score</th>
                <th className="p-4 pr-6 w-1/3">Progreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && deptos.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400 animate-pulse">Calculando métricas...</td></tr>
              ) : metricasPorDepto.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Sin datos registrados.</td></tr>
              ) : (
                metricasPorDepto.map((m: any) => (
                  <tr key={m.nombre} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-700">{m.nombre}</td>
                    <td className="p-4 text-center font-mono text-slate-500">{m.total}</td>
                    <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/30">{m.pendientes}</td>
                    <td className="p-4 text-center font-medium text-slate-600 bg-slate-100/30">{m.concluidas}</td>
                    <td className="p-4 text-center font-bold text-green-700 bg-green-50/30">{m.aTiempo}</td>

                    {/* Score Numérico */}
                    <td className="p-4 text-center">
                      <span className={`text-lg font-black ${m.eficacia >= 80 ? 'text-green-600' : m.eficacia >= 60 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                        {m.eficacia}%
                      </span>
                    </td>

                    {/* Barra Visual */}
                    <td className="p-4 pr-6 align-middle">
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${m.eficacia >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              m.eficacia >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
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

    </div>
  );
};

export default DashboardGeneral;