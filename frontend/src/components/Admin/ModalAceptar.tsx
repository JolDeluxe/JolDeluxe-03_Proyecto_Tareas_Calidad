// 📍 src/components/Admin/ModalAceptar.tsx

import React, { useRef } from "react";

interface ModalAceptarProps {
  onClose: () => void;
  onConfirm: () => void;
  tareaNombre: string;
}

const ModalAceptar: React.FC<ModalAceptarProps> = ({
  onClose,
  onConfirm,
  tareaNombre,
}) => {
  // ✅ 2. Creamos la referencia para rastrear dónde inicia el clic
  const mouseDownInside = useRef(false);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 cursor-pointer"
      // ✅ 3. Reemplazamos onClick por onMouseDown y onMouseUp
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          mouseDownInside.current = false;
        }
      }}
      onMouseUp={(e) => {
        if (!mouseDownInside.current && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[90%] max-w-lg relative flex flex-col animate-fade-in-up cursor-default overflow-hidden"
        // ✅ 4. Marcamos que el clic inició dentro de la caja blanca
        onMouseDown={() => {
          mouseDownInside.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-green-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6 text-green-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-green-800 uppercase tracking-wide">
              Confirmar Finalización
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-green-700 text-2xl font-bold leading-none cursor-pointer transition-colors"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 text-gray-800">
          <p className="text-base text-gray-700 leading-relaxed mb-4">
            Estás a punto de cambiar el estatus de esta tarea a <span className="font-bold text-green-700">CONCLUIDA</span>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 shadow-inner">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre de la tarea:</span>
            <span className="block text-base font-semibold text-gray-900 break-words">
              {tareaNombre}
            </span>
          </div>

          {/* ⚠️ AVISO SOLICITADO: Cierre Directo */}
          <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-3 rounded-r-md shadow-sm flex gap-3 items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-0.5">Verificación Requerida</p>
              <p className="text-sm font-medium leading-snug text-amber-800">
                Esta tarea no fue entregada por el responsable (no pasó por el estatus "En Revisión"). Por favor, asegúrate de que el trabajo se realizó correctamente antes de finalizarla.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-md transition-all duration-200 shadow-sm cursor-pointer"
          >
            No, volver
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-md transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            Sí, finalizar tarea
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAceptar;