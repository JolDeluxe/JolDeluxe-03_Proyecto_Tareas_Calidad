import React from "react";

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
        <h2 className="text-lg font-bold text-green-700 mb-4 text-center">
          Confirmar finalización
        </h2>

        {/* Texto descriptivo */}
        <p className="text-gray-700 text-center mb-6">
          ¿Deseas marcar como{" "}
          <span className="font-semibold text-green-700">completada</span> la
          siguiente tarea?
          <br />
          <span className="font-bold text-amber-950 block mt-1">
            “{tareaNombre}”
          </span>
        </p>

        {/* Ícono de confirmación */}
        <div className="flex justify-center mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="w-12 h-12 text-green-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
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
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200"
          >
            Sí, marcar como completada
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAceptar;
