import React from "react";
import type { LogSistema } from "../../../api/logs.service";

interface Props {
  logs: LogSistema[];
  loading: boolean;
}

const TablaLogs = ({ logs, loading }: Props) => {

  // Función auxiliar para determinar el color basado en el texto de la acción
  const getLevelStyle = (accion: string) => {
    const act = accion.toUpperCase();
    if (act.includes("ERROR") || act.includes("FAIL") || act.includes("DELETE")) {
      return "bg-red-900/40 text-red-400 border-red-900/50"; // Nivel Critico
    }
    if (act.includes("WARN") || act.includes("EDIT")) {
      return "bg-yellow-900/40 text-yellow-400 border-yellow-900/50"; // Nivel Advertencia
    }
    if (act.includes("LOGIN") || act.includes("SESION")) {
      return "bg-blue-900/40 text-blue-400 border-blue-900/50"; // Nivel Info/Login
    }
    return "bg-green-900/40 text-green-400 border-green-900/50"; // Nivel Success/Info
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1 custom-scrollbar bg-[#1e1e1e]">

      {loading && logs.length === 0 && (
        <div className="flex items-center gap-2 text-slate-500 p-2 animate-pulse">
          <span className="animate-bounce">_</span> Estableciendo conexión segura...
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="text-slate-500 italic p-2 opacity-50">
          $ cat bitacora.log <br />
          &gt; No events found for today.
        </div>
      )}

      {logs.map((log) => (
        <div
          key={log.id}
          className="flex flex-col sm:flex-row gap-1 sm:gap-3 hover:bg-white/5 p-1.5 rounded transition-colors group border-l-2 border-transparent hover:border-slate-600"
        >
          {/* 1. Timestamp */}
          <span className="text-slate-500 shrink-0 select-none sm:w-36 font-bold opacity-70">
            [{new Date(log.fecha).toLocaleString()}]
          </span>

          {/* 2. Badge de Nivel/Acción */}
          <div className="shrink-0 sm:w-28">
            <span className={`inline-block w-full text-center rounded px-1 py-0.5 select-none text-[10px] font-bold border ${getLevelStyle(log.accion)}`}>
              {log.accion}
            </span>
          </div>

          {/* 3. Usuario (Si existe) */}
          <span className="text-indigo-400 shrink-0 sm:w-32 font-bold truncate">
            {log.usuario ? `@${log.usuario.nombre.split(" ")[0]}` : "system@root"}
          </span>

          {/* 4. Mensaje */}
          <span className="break-all text-slate-300 group-hover:text-white transition-colors flex-1">
            {log.descripcion}
            {log.detalles && (
              <span className="ml-2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {JSON.stringify(log.detalles)}
              </span>
            )}
          </span>
        </div>
      ))}

      {/* Cursor parpadeante al final estilo terminal */}
      <div className="h-4 w-2 bg-slate-500 animate-pulse mt-2"></div>
    </div>
  );
};

export default TablaLogs;