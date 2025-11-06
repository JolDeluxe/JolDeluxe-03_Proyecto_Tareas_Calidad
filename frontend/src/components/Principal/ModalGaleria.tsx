import React, { useState, useEffect } from "react";
// 💡 Asegúrate de que tu tipo Tarea incluya 'imagenes'
import type { Tarea } from "../../types/tarea";

// Asumimos que 'ImagenTarea' es parte de tu tipo Tarea y está exportado
// Si no, puedes definirlo aquí:
// type ImagenTarea = { id: number; url: string; [key: string]: any };
type ImagenTarea = Tarea["imagenes"][0];

interface ModalGaleriaProps {
  imagenes: ImagenTarea[];
  onClose: () => void;
}

// 🔹 Helper para obtener la URL base correcta (igual que en tu api.ts)
const getBaseURL = () => {
  // 🔽 CORRECCIÓN: Volvemos a usar import.meta.env.MODE,
  // que es lo correcto para Vite.
  if (import.meta.env.MODE === "development") {
    // Apunta a la base del backend, NO a /api
    return "http://localhost:3000";
  }
  // En producción, la ruta relativa /uploads/.. funcionará
  return "";
};
const API_BASE_URL = getBaseURL();

const ModalGaleria: React.FC<ModalGaleriaProps> = ({ imagenes, onClose }) => {
  const [indiceActual, setIndiceActual] = useState(0);

  // --- Navegación ---
  const irSiguiente = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el clic cierre el modal
    setIndiceActual((prev) => (prev + 1) % imagenes.length);
  };

  const irAnterior = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el clic cierre el modal
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
  // Construye la URL completa: ej. http://localhost:3000/uploads/imagen-123.png
  const imagenUrl = `${API_BASE_URL}/${imagenActual.url}`;

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
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
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

        {/* Cuerpo: Imagen */}
        <div className="flex-grow flex items-center justify-center p-4 overflow-hidden">
          <img
            src={imagenUrl}
            alt={`Evidencia ${indiceActual + 1}`}
            className="max-w-full max-h-[70vh] h-auto w-auto object-contain"
          />
        </div>
      </div>

      {/* Flechas de Navegación (si hay más de 1 imagen) */}
      {imagenes.length > 1 && (
        <>
          {/* Flecha Izquierda */}
          <button
            onClick={irAnterior}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 
                       bg-white/70 hover:bg-white p-2 rounded-full 
                       shadow-md transition-all"
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
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 
                       bg-white/70 hover:bg-white p-2 rounded-full 
                       shadow-md transition-all"
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
