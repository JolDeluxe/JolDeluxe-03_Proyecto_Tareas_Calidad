import React from "react";
import type { Usuario } from "../../types/usuario";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  usuario: Usuario | null;
  isSubmitting: boolean;
}

const ModalConfirmarEstatus: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  usuario,
  isSubmitting,
}) => {
  if (!isOpen || !usuario) return null;

  const esActivo = usuario.estatus === "ACTIVO";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
          disabled={isSubmitting}
        >
          ×
        </button>

        {/* Título Dinámico */}
        <h2 className={`text-lg font-bold mb-4 text-center ${esActivo ? "text-amber-600" : "text-green-600"}`}>
          {esActivo ? "Confirmar desactivación" : "Confirmar reactivación"}
        </h2>

        {/* Ícono de Alerta (Warning) */}
        <div className="flex justify-center mb-5">
          {esActivo ? (
            // Triángulo de Advertencia para Desactivar
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-amber-500">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          ) : (
            // Círculo de Check para Reactivar
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-green-500">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Texto descriptivo */}
        <div className="text-gray-700 text-center mb-6 space-y-3">
          <p className="text-base">
            ¿Seguro que deseas {esActivo ? <span className="font-bold text-amber-700">ELIMINAR</span> : <span className="font-bold text-green-700">REACTIVAR</span>} al usuario?
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <span className="block font-bold text-gray-900 text-lg">{usuario.nombre}</span>
            <span className="block text-sm text-gray-500 font-mono">@{usuario.username}</span>
          </div>

          {esActivo && (
            <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded-md border border-red-100">
              ⚠️ Advertencia: Este usuario dejará de formar parte de su equipo visible y perderá acceso al sistema.
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`font-semibold px-6 py-2 rounded-md transition-all duration-200 text-white shadow-md cursor-pointer flex items-center gap-2
              ${esActivo
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-green-600 hover:bg-green-700"
              } ${isSubmitting ? "opacity-70 cursor-wait" : ""}`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {esActivo ? "Sí, desactivar" : "Sí, reactivar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmarEstatus;