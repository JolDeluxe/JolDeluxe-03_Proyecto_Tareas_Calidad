import React, { useState } from "react";
import type { Tarea } from "../../types/tarea";
import { tareasService } from "../../api/tareas.service";
import { toast } from "react-toastify";

interface ModalEntregaProps {
  tarea: Tarea;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalEntrega: React.FC<ModalEntregaProps> = ({
  tarea,
  onClose,
  onSuccess,
}) => {
  const [comentario, setComentario] = useState(tarea.comentarioEntrega || "");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  // Eliminamos el estado 'error' local si prefieres que TODO salga por Toast
  // Pero lo mantendré por si quieres mostrar errores de servidor en el modal también.
  const [error, setError] = useState<string | null>(null);

  // --- Manejadores de Archivos (Con Toastify) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);

      // 🛑 1. VALIDACIÓN DE TAMAÑO (5MB)
      const TAMANO_MAXIMO = 5 * 1024 * 1024;

      const archivoPesado = nuevosArchivos.find((file) => file.size > TAMANO_MAXIMO);

      if (archivoPesado) {
        // 🔔 REEMPLAZO DE ALERT POR TOAST ERROR
        toast.error(
          `⚠️ El archivo "${archivoPesado.name}" pesa más de 5MB. Por favor comprímelo o elige otro.`
        );
        e.target.value = ""; // Limpiar input
        return;
      }

      // 🛑 2. VALIDACIÓN DE CANTIDAD
      if (archivos.length + nuevosArchivos.length > 5) {
        // 🔔 REEMPLAZO DE ALERT POR TOAST WARNING
        toast.warning("Solo puedes subir un máximo de 5 evidencias en total.");
        e.target.value = "";
        return;
      }

      setArchivos((prev) => [...prev, ...nuevosArchivos]);
      e.target.value = "";
    }
  };

  const handleRemoveArchivo = (indexToRemove: number) => {
    setArchivos((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comentario.trim()) {
      // Opcional: También podrías usar toast aquí en lugar de setError
      toast.warn("El comentario de entrega es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await tareasService.entregar(tarea.id, comentario, archivos);

      // ✅ Éxito con Toast
      toast.success("¡Tarea entregada correctamente!");
      onSuccess(); // Cierra el modal y recarga
    } catch (err: any) {
      console.error("Error al entregar tarea:", err);
      const msg = err.response?.data?.error || "Error al enviar. Intente de nuevo.";

      // ❌ Error con Toast (más visible)
      toast.error(msg);
      setError(msg); // Mantengo el error visual dentro del modal por si acaso
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
            {tarea.feedbackRevision ? "CORREGIR TAREA" : "ENTREGAR TAREA"} #{tarea.id}
          </h2>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          <div className="flex-grow overflow-y-auto p-6 text-gray-800">
            <div className="flex flex-col gap-5">

              {/* Info Tarea */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Tarea
                </label>
                <div className="text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded-md font-medium text-sm">
                  {tarea.tarea}
                </div>
              </div>

              {/* Alerta de Corrección */}
              {tarea.estatus === "PENDIENTE" && tarea.feedbackRevision && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex gap-2">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase">
                        Corrección Requerida
                      </p>
                      <p className="text-sm text-red-800 italic">
                        "{tarea.feedbackRevision}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comentario */}
              <div>
                <label htmlFor="comentario" className="block text-sm font-semibold mb-1">
                  Comentario de Entrega <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none resize-none"
                  placeholder="Describe brevemente el trabajo realizado..."
                  disabled={loading}
                  required
                />
              </div>

              {/* Zona de Archivos */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Evidencias (Fotos)
                </label>

                <label
                  htmlFor="file-upload-entrega"
                  className={`w-full flex items-center justify-center gap-2 
                    bg-amber-100 text-amber-900 
                    font-semibold px-4 py-2 rounded-md 
                    transition-all duration-200
                    border border-amber-200
                    ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-amber-200"}
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10.5 3.5a.5.5 0 00-1 0V9H4a.5.5 0 000 1h5.5v5.5a.5.5 0 001 0V10H16a.5.5 0 000-1h-5.5V3.5z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {archivos.length > 0 ? "Agregar más fotos" : "Subir Evidencia"}
                  </span>
                </label>

                <input
                  id="file-upload-entrega"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />

                {/* Lista de archivos */}
                {archivos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {archivos.length} archivo(s) seleccionado(s):
                    </p>
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {archivos.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md border border-gray-200">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-10 h-10 object-cover rounded bg-white border border-gray-300"
                              onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                            />
                            <span className="text-sm text-gray-700 truncate max-w-[150px]">
                              {file.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArchivo(index)}
                            disabled={loading}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Mensaje de Error (Opcional si usas Toast, pero bueno tenerlo de respaldo) */}
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 shadow-sm flex items-center gap-2 ${tarea.feedbackRevision
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
                }`}
            >
              {loading ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <span>
                    {tarea.feedbackRevision ? "Re-Enviar" : "Entregar"}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEntrega;