import React from "react";

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
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          ×
        </button>

        {/* Título */}
        <h2 className="text-lg font-bold text-red-700 mb-4 text-center">
          Confirmar cancelación
        </h2>

        {/* Texto descriptivo */}
        <p className="text-gray-700 text-center mb-6">
          ¿Seguro que deseas{" "}
          <span className="font-semibold text-red-700">cancelar</span> la tarea:
          <br />
          <span className="font-bold text-amber-950 block mt-1">
            “{tareaNombre}”
          </span>
        </p>

        {/* Ícono de alerta */}
        <div className="flex justify-center mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="w-12 h-12 text-red-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200"
          >
            No, volver
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200"
          >
            Sí, cancelar tarea
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEliminar;
