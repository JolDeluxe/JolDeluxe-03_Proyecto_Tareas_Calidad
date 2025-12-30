import { useState, useEffect } from "react";
import { logsService, type LogSistema } from "../../api/logs.service";
import TerminalHeader from "./logs/TerminalHeader";
import TablaLogs from "./logs/TablaLogs";

const GestionLogs = () => {
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarLogs = async () => {
    setLoading(true);
    try {
      const data = await logsService.getAll();
      setLogs(data);
    } catch (error) {
      console.error("Error al obtener bitácora:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial y auto-refresh cada 60 segundos
  useEffect(() => {
    cargarLogs();
    const interval = setInterval(cargarLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-0">

      {/* Título de la sección (Opcional, si quieres mantener consistencia con las otras vistas) */}
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Bitácora del Sistema</h2>
        <p className="text-slate-500 text-sm">Monitorización de eventos, accesos y errores en tiempo real.</p>
      </div>

      {/* Contenedor estilo Terminal */}
      <div className="bg-[#1e1e1e] rounded-xl shadow-2xl border border-slate-700 flex flex-col h-[650px] overflow-hidden">

        {/* Header Modular */}
        <TerminalHeader
          loading={loading}
          onRefresh={cargarLogs}
          totalLogs={logs.length}
        />

        {/* Tabla Modular */}
        <TablaLogs
          logs={logs}
          loading={loading}
        />

      </div>
    </div>
  );
};

export default GestionLogs;