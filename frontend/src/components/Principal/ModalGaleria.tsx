import React, { useState, useEffect } from "react";
import { toast } from "react-toastify"; // 🚀 Importar toast
import { tareasService } from "../../api/tareas.service"; // 🚀 Importar servicio
import type { Tarea } from "../../types/tarea";

// Asumimos que 'ImagenTarea' es parte de tu tipo Tarea y está exportado
type ImagenTarea = Tarea["imagenes"][0];

interface ModalGaleriaProps {
  imagenes: ImagenTarea[];
  onClose: () => void;
  // 🚀 NUEVO: Callback para notificar al padre sobre la eliminación
}

// ❌ ELIMINADO: Ya no se necesita, la URL viene completa de Cloudinary.
// const getBaseURL = () => { /* ... */ };
// const API_BASE_URL = getBaseURL();

const ModalGaleria: React.FC<ModalGaleriaProps> = ({
  imagenes: initialImagenes, // Renombramos la prop
  onClose,
}) => {
  // 🚀 ESTADO LOCAL: Mantenemos la lista de imágenes aquí para permitir la eliminación sin cerrar el modal
  const [imagenes, setImagenes] = useState(initialImagenes);
  const [indiceActual, setIndiceActual] = useState(0);
  const [loading, setLoading] = useState(false); // Para el spinner de borrado

  // Si la imagen actual se borra, ajustamos el índice
  useEffect(() => {
    if (indiceActual >= imagenes.length && imagenes.length > 0) {
      setIndiceActual(imagenes.length - 1);
    } else if (imagenes.length === 0) {
      // Si se borran todas, cerramos el modal
      onClose();
    }
  }, [imagenes.length, indiceActual, onClose]);

  // --- Navegación ---
  const irSiguiente = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceActual((prev) => (prev + 1) % imagenes.length);
  };

  const irAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceActual((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  // --- Cierre con tecla Escape ---
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!imagenes || imagenes.length === 0) {
    return null;
  }

  const imagenActual = imagenes[indiceActual];
  // 🚀 CORRECCIÓN: La URL ya viene completa de Cloudinary.
  const imagenUrl = imagenActual.url;

  return (
    <div
      // Fondo oscuro
      className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                  flex items-center justify-center z-[100] p-4"
      onClick={onClose} // Cierra al hacer clic en el fondo
    >
      {/* Contenedor del Modal (evita cierre al hacer clic) */}
      <div
        className="relative bg-white rounded-lg shadow-xl 
                    max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: "Imagen 1 de 3" y botón X */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-700">
            Imagen {indiceActual + 1} de {imagenes.length}
          </span>
          <div className="flex items-center gap-2">
            {/* Botón de Cerrar */}
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
              aria-label="Cerrar galería"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Cuerpo: Imagen */}
        <div className="flex-grow flex items-center justify-center p-4 overflow-hidden">
          {loading ? (
            <div className="text-gray-500">Eliminando imagen...</div>
          ) : (
            <img
              src={imagenUrl}
              alt={`Evidencia ${indiceActual + 1}`}
              // La URL ya es la final, solo la usamos
              className="max-w-full max-h-[70vh] h-auto w-auto object-contain"
            />
          )}
        </div>
      </div>

      {/* Flechas de Navegación (si hay más de 1 imagen) */}
      {imagenes.length > 1 && (
        <>
          {/* Flecha Izquierda */}
          <button
            onClick={irAnterior}
            disabled={loading}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 
                      bg-white/70 hover:bg-white p-2 rounded-full 
                        shadow-md transition-all disabled:opacity-50"
            aria-label="Imagen anterior"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          {/* Flecha Derecha */}
          <button
            onClick={irSiguiente}
            disabled={loading}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 
                    bg-white/70 hover:bg-white p-2 rounded-full 
                      shadow-md transition-all disabled:opacity-50"
            aria-label="Siguiente imagen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default ModalGaleria;
