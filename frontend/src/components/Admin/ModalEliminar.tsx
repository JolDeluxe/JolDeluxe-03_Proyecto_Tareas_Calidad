// 📍 src/components/Admin/ModalEliminar.tsx

import React, { useRef } from "react"; // <-- 1. Importar useRef

interface ModalEliminarProps {
  onClose: () => void;
  onConfirm: () => void;
  tareaNombre: string;
}

const ModalEliminar: React.FC<ModalEliminarProps> = ({
  onClose,
  onConfirm,
  tareaNombre,
}) => {
  // 2. Creamos una referencia para rastrear si el clic inició dentro del modal
  const mouseDownInside = useRef(false);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 cursor-pointer"
      // 3. Controlamos dónde empieza y dónde termina el clic
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          mouseDownInside.current = false; // Empezó en el fondo oscuro
        }
      }}
      onMouseUp={(e) => {
        // Solo cerramos si NO empezó dentro y si soltamos en el fondo oscuro
        if (!mouseDownInside.current && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[90%] max-w-lg relative flex flex-col animate-fade-in-up cursor-default overflow-hidden"
        // 4. Marcamos que el clic empezó dentro del área blanca
        onMouseDown={() => {
          mouseDownInside.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-red-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-red-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-red-800 uppercase tracking-wide">
              Confirmar Cancelación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 text-2xl font-bold leading-none cursor-pointer transition-colors"
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 text-gray-800">
          <p className="text-base text-gray-700 leading-relaxed mb-4">
            Estás a punto de enviar esta tarea a la papelera. Su estatus cambiará a <span className="font-bold text-red-700">CANCELADA</span>.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2 shadow-inner">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre de la tarea:</span>
            <span className="block text-base font-semibold text-gray-900 break-words">
              {tareaNombre}
            </span>
          </div>

          <p className="text-sm text-gray-500 italic mt-4">
            ¿Estás completamente seguro de que deseas realizar esta acción?
            Esta operación <strong>NO</strong> puede deshacerse.
          </p>
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
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-md transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            Sí, cancelar tarea
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEliminar;