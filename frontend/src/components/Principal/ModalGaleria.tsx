// 📍 src/components/Principal/ModalGaleria.tsx

import React, { useState, useEffect, useRef } from "react";
import type { Tarea } from "../../types/tarea";

// Asegúrate de importar tu tipo ImagenTarea
type ImagenTarea = Tarea["imagenes"][0];

interface ModalGaleriaProps {
  imagenes: ImagenTarea[];
  onClose: () => void;
  // 🚀 NUEVA PROP: Define el contexto de las fotos
  tipo?: "REFERENCIA" | "EVIDENCIA";
}

const ModalGaleria: React.FC<ModalGaleriaProps> = ({
  imagenes: initialImagenes,
  onClose,
  tipo = "REFERENCIA", // Por defecto será referencia
}) => {
  const mouseDownInside = useRef(false);
  const [imagenes, setImagenes] = useState(initialImagenes);
  const [indiceActual, setIndiceActual] = useState(0);

  // Si cambian las imágenes prop, reseteamos el estado local
  useEffect(() => {
    setImagenes(initialImagenes);
    setIndiceActual(0);
  }, [initialImagenes]);

  // Manejo de borrado de índice si la lista cambia dinámicamente
  useEffect(() => {
    if (indiceActual >= imagenes.length && imagenes.length > 0) {
      setIndiceActual(imagenes.length - 1);
    } else if (imagenes.length === 0) {
      onClose();
    }
  }, [imagenes.length, indiceActual, onClose]);

  const irSiguiente = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceActual((prev) => (prev + 1) % imagenes.length);
  };

  const irAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceActual((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!imagenes || imagenes.length === 0) return null;

  const imagenActual = imagenes[indiceActual];
  const imagenUrl = imagenActual.url;

  return (
    <div
      // Fondo oscuro
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      // ✅ 3. Quitamos onClick={onClose} y ponemos esto:
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
      {/* Contenedor del Modal (evita cierre al hacer clic) */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        // ✅ 4. Agregamos onMouseDown a la caja blanca
        onMouseDown={() => {
          mouseDownInside.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- HEADER DEL MODAL --- */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-100 bg-white z-10">

          <div className="flex items-center gap-3">
            {/* 🏷️ AQUÍ ESTÁ EL BADGE DIFERENCIADOR */}
            {tipo === "EVIDENCIA" ? (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1">
                ✅ EVIDENCIA DE ENTREGA
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                📁 REFERENCIA / GUÍA
              </span>
            )}

            <span className="text-sm text-gray-500 font-medium ml-2 border-l pl-3 border-gray-300">
              {indiceActual + 1} / {imagenes.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- CUERPO: IMAGEN --- */}
        <div className="flex-grow flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative">
          <img
            src={imagenUrl}
            alt={`Imagen ${indiceActual + 1}`}
            className="max-w-full max-h-[75vh] object-contain shadow-sm rounded"
          />
        </div>
      </div>

      {/* --- BOTONES DE NAVEGACIÓN --- */}
      {imagenes.length > 1 && (
        <>
          <button
            onClick={irAnterior}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={irSiguiente}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default ModalGaleria;