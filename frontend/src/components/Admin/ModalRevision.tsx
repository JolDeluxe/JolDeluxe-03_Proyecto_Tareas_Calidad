// 📍 src/components/Admin/ModalRevision.tsx

import React, { useState, useMemo } from "react";
import type { Tarea, ImagenTarea } from "../../types/tarea";
import { tareasService } from "../../api/tareas.service";

interface ModalRevisionProps {
  tarea: Tarea;
  onClose: () => void;
  onSuccess: () => void;
  onVerImagenes: (imagenes: ImagenTarea[]) => void;
}

const ModalRevision: React.FC<ModalRevisionProps> = ({
  tarea,
  onClose,
  onSuccess,
  onVerImagenes,
}) => {
  const [decision, setDecision] = useState<"APROBAR" | "RECHAZAR">("APROBAR");
  const [feedback, setFeedback] = useState(tarea.feedbackRevision || "");
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFeedbackRequired = decision === "RECHAZAR";
  const tieneImagenes = tarea.imagenes && tarea.imagenes.length > 0;

  // ✅ LÓGICA PARA DETECTAR ENTREGA TARDÍA
  const esFueraDeTiempo = useMemo(() => {
    if (!tarea.fechaLimite || !tarea.fechaEntrega) return false;
    const limite = new Date(tarea.fechaLimite).getTime();
    const entrega = new Date(tarea.fechaEntrega).getTime();
    return entrega > limite;
  }, [tarea.fechaLimite, tarea.fechaEntrega]);

  const formateaFechaInput = (date: Date | string | null): string => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  useMemo(() => {
    setNuevaFechaLimite(formateaFechaInput(tarea.fechaLimite));
  }, [tarea.fechaLimite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isFeedbackRequired && !feedback.trim()) {
      setError("El motivo de rechazo (feedback) es obligatorio.");
      return;
    }
    const finalFeedback = feedback.trim().length > 0 ? feedback.trim() : undefined;

    let finalDate: Date | undefined;
    if (isFeedbackRequired && nuevaFechaLimite) {
      try {
        finalDate = new Date(nuevaFechaLimite);
        if (isNaN(finalDate.getTime())) {
          setError("La fecha límite proporcionada es inválida.");
          return;
        }
      } catch (e) {
        setError("Error al procesar la nueva fecha límite.");
        return;
      }
    }

    setLoading(true);

    try {
      await tareasService.revisar(
        tarea.id,
        decision,
        finalFeedback,
        finalDate
      );
      onSuccess();
    } catch (err: any) {
      console.error("Error al revisar tarea:", err);
      setError(
        err.response?.data?.error ||
        "Error al procesar la revisión. Intente de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold leading-none"
            disabled={loading}
          >
            &times;
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center uppercase">
            REVISAR TAREA #{tarea.id}
          </h2>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto p-6 text-gray-800">
            <div className="flex flex-col gap-5">

              {/* ⚠️ ALERTA DE TAREA FUERA DE TIEMPO (NUEVO) */}
              {esFueraDeTiempo && (
                <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-3 rounded shadow-sm flex items-center gap-3 animate-pulse">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-extrabold uppercase text-sm">Tarea fuera de tiempo</p>
                    <p className="text-xs">
                      Esta tarea se entregó después de la fecha límite establecida.
                    </p>
                  </div>
                </div>
              )}

              {/* Info Tarea */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tarea
                </label>
                <p className="text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded-md font-medium text-sm">
                  {tarea.tarea}
                </p>
              </div>

              {/* Evidencia del Responsable */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs uppercase font-bold text-blue-800 mb-1">
                  Comentario de Entrega:
                </p>
                <p className="text-sm italic text-gray-700 mb-3 bg-white p-2 rounded border border-blue-100">
                  "{tarea.comentarioEntrega || "Sin comentario."}"
                </p>

                {tieneImagenes ? (
                  <button
                    type="button"
                    onClick={() => onVerImagenes(tarea.imagenes)}
                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-blue-300 text-sm font-semibold rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2">
                      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97z" clipRule="evenodd" />
                    </svg>
                    Ver Evidencias ({tarea.imagenes.length})
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 italic">Sin evidencias adjuntas.</span>
                )}
              </div>

              {/* Selector de Decisión */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Decisión</label>
                <div className="flex gap-3">
                  <label className={`flex-1 cursor-pointer border rounded-md p-3 text-center transition-all ${decision === 'APROBAR' ? 'bg-green-50 border-green-500 ring-1 ring-green-500 shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      value="APROBAR"
                      checked={decision === "APROBAR"}
                      onChange={() => setDecision("APROBAR")}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-xl">✅</span>
                      <span className={`text-sm font-bold mt-1 ${decision === 'APROBAR' ? 'text-green-700' : 'text-gray-600'}`}>
                        Aprobar
                      </span>
                    </div>
                  </label>

                  <label className={`flex-1 cursor-pointer border rounded-md p-3 text-center transition-all ${decision === 'RECHAZAR' ? 'bg-red-50 border-red-500 ring-1 ring-red-500 shadow-sm' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      value="RECHAZAR"
                      checked={decision === "RECHAZAR"}
                      onChange={() => setDecision("RECHAZAR")}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className="flex flex-col items-center">
                      <span className="text-xl">❌</span>
                      <span className={`text-sm font-bold mt-1 ${decision === 'RECHAZAR' ? 'text-red-700' : 'text-gray-600'}`}>
                        Rechazar
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Inputs condicionales de rechazo */}
              {decision === "RECHAZAR" && (
                <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-100 animate-fade-in">
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-bold text-red-800 mb-1">
                      Motivo del Rechazo <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full border border-red-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      placeholder="Explica qué debe corregir..."
                      disabled={loading}
                      required={isFeedbackRequired}
                    />
                  </div>

                  <div>
                    <label htmlFor="nuevaFechaLimite" className="block text-sm font-bold text-red-800 mb-1">
                      Nueva Fecha Límite (Opcional)
                    </label>
                    <input
                      id="nuevaFechaLimite"
                      type="date"
                      value={nuevaFechaLimite}
                      onChange={(e) => setNuevaFechaLimite(e.target.value)}
                      className="w-full border border-red-300 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      disabled={loading}
                    />
                    <p className="text-[11px] text-red-600 mt-1 leading-tight">
                      * Si no extiendes la fecha, podría marcarse como vencida.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded border border-red-200 text-center">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 shadow-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`font-semibold px-4 py-2 rounded-md text-white transition-all duration-200 disabled:opacity-70 shadow-sm ${decision === "APROBAR"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
                }`}
            >
              {loading
                ? "Procesando..."
                : decision === "APROBAR"
                  ? "Confirmar Aprobación"
                  : "Confirmar Rechazo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRevision;