import React from "react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
  totalLogs: number;
}

const TerminalHeader = ({ loading, onRefresh, totalLogs }: Props) => {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-[#252526] border-b border-black/40 select-none">
      {/* Botones de ventana (Decorativos) */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors"></div>
        </div>
        <span className="text-slate-400 text-xs font-mono opacity-60">
          root@sistema:~/var/log/bitacora.log — lines: {totalLogs}
        </span>
      </div>

      {/* Botón Refresh */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1 rounded transition border border-white/10 flex items-center gap-2 disabled:opacity-50"
      >
        <span className={loading ? "animate-spin" : ""}>↻</span>
        {loading ? "SYNCING..." : "REFRESH"}
      </button>
    </div>
  );
};

export default TerminalHeader;