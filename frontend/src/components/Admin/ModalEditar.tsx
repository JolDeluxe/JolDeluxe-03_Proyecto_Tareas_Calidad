import React, { useState } from "react";
import { api } from "../data/api"; // 👈 Asegúrate que la ruta sea correcta
import { toast } from "react-toastify";
// 👇 Asegúrate que la ruta a tus tipos sea correcta
import type {
  Tarea,
  HistorialFecha,
  Urgencia,
  ImagenTarea,
} from "../../types/tarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Props del Modal ---
interface ModalEditarProps {
  onClose: () => void; // Función para cerrar el modal
  tarea: Tarea; // La tarea original a editar (con objetos Date)
  // 👇 CAMBIO CLAVE para recarga automática
  onTareaAgregada: () => void; // Función para refrescar la tabla padre
}

// --- Helper para formatear Date a YYYY-MM-DD ---
const formatDateToInput = (fecha?: Date | null): string => {
  if (!fecha) return "";
  try {
    // Verifica si ya es un objeto Date válido
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
      // Si no lo es, intenta convertirlo (puede venir de la API como string)
      const parsedDate = new Date(fecha as any);
      if (isNaN(parsedDate.getTime())) return ""; // Si falla, retorna vacío
      fecha = parsedDate;
    }
    const anio = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getUTCDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
  } catch {
    return ""; // En caso de cualquier error inesperado
  }
};

// --- Lista de Responsables (Considera moverla a un archivo de constantes) ---
const RESPONSABLES_VALIDOS = [
  "Juan Pérez",
  "María López",
  "Carlos Ramírez",
  "Sofía Méndez",
  "Luis García",
  "Pedro Ortega",
  "Ana Torres",
  "Recursos Humanos",
  "Miguel López",
  "Ximena Álvarez",
  "Joel Rodríguez",
  "Luis Hernández",
];

const PRIORIDADES_VALIDAS: { value: Urgencia; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

const MOTIVOS_CAMBIO_FECHA = [
  "Solicitud del responsable",
  "Retraso en tarea previa",
  "Falta de información/recursos",
  "Cambio de prioridades",
  "Ajuste de planificación",
  "Otro", // Opción genérica
];

const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:3000";
  }
  return "";
};
const API_BASE_URL = getBaseURL();

// --- Componente ModalEditar ---
const ModalEditar: React.FC<ModalEditarProps> = ({
  onClose,
  tarea,
  onTareaAgregada, // 👈 RECIBIMOS la nueva prop
}) => {
  // --- Estados del Formulario ---

  // 👇 CAMBIO 1: Guarda la fecha original en formato 'YYYY-MM-DD'
  // Esta será nuestra referencia fija para saber si el usuario cambió la fecha.
  const fechaOriginalFormateada = formatDateToInput(tarea.fechaLimite);

  const [nombre, setNombre] = useState(tarea.tarea);
  const [comentario, setComentario] = useState(tarea.observaciones || "");
  const [responsable, setResponsable] = useState(
    (tarea.responsable || "").trim()
  );
  const [prioridad, setPrioridad] = useState<Urgencia>(tarea.urgencia);
  const [fechaInput, setFechaInput] = useState(fechaOriginalFormateada);
  const [motivoCambio, setMotivoCambio] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isResponsableModalOpen, setIsResponsableModalOpen] = useState(false);
  const [isPrioridadModalOpen, setIsPrioridadModalOpen] = useState(false);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenTarea[]>(
    tarea.imagenes || []
  );
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);

  const [idsParaBorrar, setIdsParaBorrar] = useState<number[]>([]);
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null);

  // 1. Convierte tu string 'DD-MM-YYYY' (estado) a un Date (para el picker)
  const getSelectedDate = () => {
    if (!fechaInput) return null;
    // Usamos UTC para ser consistentes con tu lógica de 'handleSubmit'
    const dateObj = new Date(`${fechaInput}T00:00:00.000Z`);
    // Evita errores si el string de fecha es inválido
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  };

  // 2. Convierte el Date (del picker) de vuelta a tu string 'DD-MM-YYYY' (para el estado)
  const handleDateChange = (date: Date | null) => {
    // Reutiliza tu propia función 'formatDateToInput' que ya tienes
    setFechaInput(formatDateToInput(date));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevos = Array.from(e.target.files);
      setArchivosNuevos((prev) => [...prev, ...nuevos]);
      e.target.value = ""; // Limpia el input
    }
  };

  const handleRemoveNuevoArchivo = (indexToRemove: number) => {
    setArchivosNuevos((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleDeleteImagenExistente = (
    imagenABorrar: ImagenTarea,
    index: number
  ) => {
    setIdsParaBorrar((prevIds) => [...prevIds, imagenABorrar.id]);

    setImagenesExistentes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(true);

    // --- Validaciones ---
    if (
      !nombre ||
      !responsable ||
      !prioridad ||
      !fechaInput ||
      !comentario.trim()
    ) {
      setLoading(false);
      return;
    }
    const nuevaFechaLimiteObj = fechaInput
      ? new Date(`${fechaInput}T00:00:00.000Z`)
      : null;
    if (!nuevaFechaLimiteObj || isNaN(nuevaFechaLimiteObj.getTime())) {
      toast.error("❌ Fecha límite inválida.");
      setLoading(false);
      return;
    }
    const fechaCambiada = fechaInput !== fechaOriginalFormateada;
    if (fechaCambiada && !motivoCambio.trim()) {
      toast.warning("⚠️ Debes indicar el motivo del cambio de fecha.");
      setLoading(false);
      return;
    }

    // --- Payload para la API ---
    const payload: Partial<
      Omit<
        Tarea,
        | "historialFechas"
        | "fechaRegistro"
        | "asignador"
        | "fechaConclusion"
        | "estatus"
      >
    > & { id: number; motivoCambioFecha?: string } = {
      id: tarea.id,
      tarea: nombre,
      observaciones: comentario || null,
      responsable: responsable,
      urgencia: prioridad,
      fechaLimite: nuevaFechaLimiteObj,
    };

    if (fechaCambiada) {
      payload.motivoCambioFecha = motivoCambio;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("❌ No autorizado. Inicia sesión.");
        setLoading(false);
        return;
      }

      // --- Decodifica el usuario logueado del token ---
      let usuarioLogueado = "Desconocido";
      try {
        const payloadToken = JSON.parse(atob(token.split(".")[1]));
        usuarioLogueado =
          payloadToken.nombre || payloadToken.username || "Desconocido";
      } catch (error) {
        console.error("Error decodificando token para obtener usuario:", error);
      }

      // 🔽 --- LÓGICA DE GUARDADO ACTUALIZADA --- 🔽

      // 1️⃣ (NUEVO) Borrar las imágenes marcadas
      if (idsParaBorrar.length > 0) {
        console.log(`Borrando ${idsParaBorrar.length} imágenes...`);
        setLoadingDelete(1); // Activa el estado 'Borrando...' en el botón

        const promesasDeBorrado = idsParaBorrar.map((id) =>
          api.delete(`/tareas/imagen/${id}`)
        );

        // Esperamos a que TODAS se completen
        await Promise.all(promesasDeBorrado);

        console.log("Imágenes borradas.");
        setLoadingDelete(null); // Desactiva 'Borrando...'
      }

      // 2️⃣ Actualiza la tarea (PUT)
      console.log(`📨 Enviando actualización para tarea ${tarea.id}:`, payload);
      await api.put(`/tareas/${tarea.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 3️⃣ Si cambió la fecha, registra el historial (POST)
      if (fechaCambiada) {
        const historialPayload = {
          fechaAnterior: tarea.fechaLimite,
          nuevaFecha: nuevaFechaLimiteObj,
          modificadoPor: usuarioLogueado, // ✅ Usuario dinámico
          motivo: motivoCambio,
        };

        console.log(
          "📜 Registrando historial de cambio de fecha:",
          historialPayload
        );

        await api.post(`/tareas/${tarea.id}`, historialPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // 4️⃣ Si hay archivos nuevos, los subimos
      if (archivosNuevos.length > 0) {
        console.log(`Subiendo ${archivosNuevos.length} imágenes nuevas...`);
        const formData = new FormData();
        archivosNuevos.forEach((file) => {
          formData.append("imagenes", file);
        });

        // El ID de la TAREA se usa para el upload
        await api.post(`/tareas/${tarea.id}/upload`, formData);
      }
      // --- Fin del bloque añadido ---

      toast.success("Tarea actualizada correctamente.");

      // Forzar la recarga de la tabla
      onTareaAgregada();
      onClose(); // Cerramos el modal
    } catch (error: any) {
      console.error(
        "❌ Error al actualizar tarea:",
        error.response?.data || error.message
      );

      // Manejo de errores mejorado
      const isUploadError = error.config?.url.includes("/upload");
      const isDeleteError = error.config?.method === "delete";

      if (isUploadError) {
        toast.error(`❌ Datos guardados, pero falló la subida de imágenes.`);
        // Igualmente refrescamos porque los datos de texto sí se guardaron
        onTareaAgregada();
        onClose();
      } else if (isDeleteError) {
        toast.error(
          `❌ Falló al borrar las imágenes antiguas. Intente de nuevo.`
        );
        // No cerramos, para que el usuario vea qué falló
      } else {
        // Error principal (al guardar datos de la tarea o historial)
        const mensajeError =
          error.response?.data?.error || "No se pudo guardar la tarea.";
        toast.error(`❌ ${mensajeError}`);
      }
    } finally {
      setLoading(false);
      setLoadingDelete(null); // Siempre resetea el estado de borrado
    }
  };

  const ModalResponsablePicker = () => (
    <div
      // Fondo semi-transparente. z-[60] para estar sobre el modal (z-50)
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => setIsResponsableModalOpen(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer clic dentro
      >
        {/* Header del Picker */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-md font-semibold text-amber-950">
            Seleccionar Responsable
          </h3>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setIsResponsableModalOpen(false)}
            className="text-gray-500 hover:text-gray-800 text-2xl font-light"
          >
            &times;
          </button>
        </div>

        {/* Lista con Scroll */}
        <div className="flex-grow overflow-y-auto">
          {RESPONSABLES_VALIDOS.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => {
                setResponsable(r); // Actualiza el estado
                setIsResponsableModalOpen(false); // Cierra el picker
              }}
              className={`w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors
                ${
                  responsable === r // Resalta el seleccionado
                    ? "bg-amber-100 text-amber-900 font-semibold"
                    : ""
                }
              `}
            >
              {r}
            </button>
          ))}
        </div>

        {/* 🚀 INICIO: Mensaje Adicional */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 italic">
            * Si necesita registrar un nuevo responsable para las tareas, envíe
            correo a{" "}
            <strong className="font-medium not-italic">
              coordinador.procesostecnologicos@cuadra.com.mx
            </strong>{" "}
            con el nombre completo de la persona a registrar.
          </p>
        </div>
        {/* 🚀 FIN: Mensaje Adicional */}
      </div>
    </div>
  );

  const ModalPrioridadPicker = () => (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={() => setIsPrioridadModalOpen(false)} // 👈 Conecta al nuevo estado
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm flex flex-col" // No necesita max-h ni scroll
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Picker */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-md font-semibold text-amber-950">
            Seleccionar Prioridad
          </h3>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setIsPrioridadModalOpen(false)} // 👈 Conecta al nuevo estado
            className="text-gray-500 hover:text-gray-800 text-2xl font-light"
          >
            &times;
          </button>
        </div>

        {/* Lista de Prioridades */}
        <div>
          {PRIORIDADES_VALIDAS.map(
            (
              p // 👈 Itera sobre el nuevo array
            ) => (
              <button
                type="button"
                key={p.value}
                onClick={() => {
                  setPrioridad(p.value); // 👈 Asigna el valor ("ALTA", "MEDIA", "BAJA")
                  setIsPrioridadModalOpen(false); // 👈 Cierra este picker
                }}
                className={`w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors
                ${
                  prioridad === p.value // 👈 Compara con el valor
                    ? "bg-amber-100 text-amber-900 font-semibold"
                    : ""
                }
              `}
              >
                {p.label}{" "}
                {/* 👈 Muestra la etiqueta ("Alta", "Media", "Baja") */}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  // --- Renderizado del Modal ---
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* 💡 1. PANEL: Sin padding, altura máxima, y layout flex-col */}
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 💡 2. HEADER (Fijo) */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ×
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center">
            Editar tarea #{tarea.id}
          </h2>
        </div>

        {/* 💡 3. FORMULARIO (ocupa el espacio restante) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0" // 👈 Clave
          noValidate
        >
          {/* 💡 4. BODY (Scrollable) */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">
              {/* Nombre */}
              <div>
                <label
                  htmlFor={`edit-nombre-${tarea.id}`}
                  className="block text-sm font-semibold mb-1"
                >
                  Nombre
                </label>
                <input
                  id={`edit-nombre-${tarea.id}`}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      submitted && !nombre.trim()
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                />
                {submitted && !nombre.trim() && (
                  <p className="text-red-600 text-xs mt-1">
                    El nombre es obligatorio.
                  </p>
                )}
              </div>

              {/* Observaciones (Indicaciones) */}
              <div>
                <label
                  htmlFor={`edit-obs-${tarea.id}`}
                  className="block text-sm font-semibold mb-1"
                >
                  Observaciones
                </label>
                <textarea
                  id={`edit-obs-${tarea.id}`}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={loading}
                  required
                  className={`w-full border rounded-md px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      submitted && !comentario.trim()
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                />
                {submitted && !comentario.trim() && (
                  <p className="text-red-600 text-xs mt-1">
                    Las observaciones son obligatorias.
                  </p>
                )}
              </div>

              {/* 🔽 6. SECCIÓN DE EVIDENCIA (NUEVA) */}
              <div className="border-t border-b border-gray-200 py-4">
                <label className="block text-sm font-semibold mb-2">
                  Evidencia
                </label>

                {/* --- Lista de Imágenes Existentes --- */}
                {imagenesExistentes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Imágenes actuales:
                    </p>
                    <ul className="space-y-2">
                      {imagenesExistentes.map((img, index) => (
                        <li
                          key={img.id}
                          className="flex items-center justify-between 
                         bg-gray-100 p-2 rounded-md"
                        >
                          <img
                            src={`${API_BASE_URL}/${img.url}`}
                            alt={`Evidencia ${index + 1}`}
                            className="w-10 h-10 object-cover rounded-md"
                          />
                          <span className="flex-1 text-sm text-gray-700 mx-3 truncate">
                            {img.url.split("/").pop()}
                          </span>

                          {/* ESTE BOTÓN AHORA USA LA LÓGICA DE "MARCAR PARA BORRAR" */}
                          <button
                            type="button"
                            onClick={
                              () => handleDeleteImagenExistente(img, index) // 👈 Llama a la función actualizada
                            }
                            disabled={loading} // 👈 Deshabilitado solo si el modal entero está guardando
                            className="flex-shrink-0 p-1 text-red-600 
                           hover:bg-red-100 rounded-full
                           disabled:opacity-50"
                            aria-label="Marcar para eliminar"
                          >
                            {/* Ya no necesita el spinner individual, 
                    el botón "Guardar" mostrará "Borrando..." */}
                            <svg // Icono de basura
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* --- Sección para Añadir Nuevas Imágenes --- */}
                <div>
                  <label
                    htmlFor="file-upload-edit"
                    onClick={(e) => {
                      if (loading || loadingDelete) e.preventDefault(); // 👈 Bloquea si está guardando o borrando
                    }}
                    className={`w-full flex items-center justify-center gap-2 
                   bg-amber-100 text-amber-900 font-semibold 
                   px-4 py-2 rounded-md transition-all duration-200
                   ${
                     loading || loadingDelete
                       ? "opacity-50 cursor-not-allowed"
                       : "cursor-pointer hover:bg-amber-200"
                   }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.5 3.5a.5.5 0 00-1 0V9H4a.5.5 0 000 1h5.5v5.5a.5.5 0 001 0V10H16a.5.5 0 000-1h-5.5V3.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Agregar Nuevas Imágenes</span>
                  </label>
                  <input
                    id="file-upload-edit"
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    disabled={loading} // 👈 Bloquea si está guardando o borrando
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* --- Lista de Nuevas Imágenes (para subir) --- */}
                {archivosNuevos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Nuevas para subir:
                    </p>
                    <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {archivosNuevos.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between 
                         bg-gray-100 p-2 rounded-md"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded-md"
                            onLoad={(e) =>
                              URL.revokeObjectURL(e.currentTarget.src)
                            }
                          />
                          <span className="flex-1 text-sm text-gray-700 mx-3 truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNuevoArchivo(index)}
                            disabled={loading}
                            className="flex-shrink-0 p-1 text-red-600 
                           hover:bg-red-100 rounded-full
                           disabled:opacity-50"
                            aria-label="Quitar archivo"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* --- FIN SECCIÓN EVIDENCIA --- */}

              {/* Responsable */}
              <div className="mb-3">
                {" "}
                {/* 👈 Tu div original 'mb-3' puede quedarse */}
                <label
                  htmlFor={`edit-resp-${tarea.id}`} // 👈 ID de editar
                  className="block text-sm font-semibold mb-1" // 👈 Clases consistentes
                >
                  Responsable
                </label>
                {/* ✨ PEGA EL BOTÓN AQUÍ ✨ */}
                <button
                  type="button"
                  id={`edit-resp-${tarea.id}`} // 👈 ID de editar
                  onClick={() => setIsResponsableModalOpen(true)}
                  disabled={loading}
                  className={`relative w-full border rounded-md px-3 py-2 text-left focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
      ${submitted && !responsable ? "border-red-500" : "border-gray-300"}
      ${responsable ? "text-gray-900" : "text-gray-400"}
    `}
                >
                  {responsable || "Seleccionar..."}
                  {/* Esto ya funciona porque tu estado 'responsable' está pre-llenado */}

                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                      />
                    </svg>
                  </span>
                </button>
                {submitted && !responsable && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar un responsable.
                  </p>
                )}
              </div>

              {/* Prioridad */}
              <div>
                <label
                  htmlFor={`edit-prio-${tarea.id}`} // 👈 ID de editar
                  className="block text-sm font-semibold mb-1"
                >
                  Prioridad
                </label>

                {/* ✨ PEGA EL BOTÓN AQUÍ ✨ */}
                <button
                  type="button"
                  id={`edit-prio-${tarea.id}`} // 👈 ID de editar
                  onClick={() => setIsPrioridadModalOpen(true)}
                  disabled={loading}
                  className={`relative w-full border rounded-md px-3 py-2 text-left focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
      ${submitted && !prioridad ? "border-red-500" : "border-gray-300"}
      ${prioridad ? "text-gray-900" : "text-gray-400"}
    `}
                >
                  {PRIORIDADES_VALIDAS.find((p) => p.value === prioridad)
                    ?.label || "Seleccionar..."}
                  {/* Esto ya funciona porque tu estado 'prioridad' está pre-llenado */}

                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                      />
                    </svg>
                  </span>
                </button>

                {submitted && !prioridad && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar una prioridad.
                  </p>
                )}
              </div>
              {usuario?.rol === "ADMIN" && (
                <>
                  {/* Fecha Límite */}
                  <div>
                    <label
                      htmlFor={`edit-fecha-${tarea.id}`}
                      className="block text-sm font-semibold mb-1"
                    >
                      Fecha Límite
                    </label>
                    <DatePicker
                      id={`edit-fecha-${tarea.id}`}
                      selected={getSelectedDate()}
                      onChange={handleDateChange}
                      dateFormat="dd/MM/yyyy"
                      required
                      disabled={loading}
                      minDate={new Date()}
                      readOnly // Previene que se abra el teclado
                      onFocus={(e) => e.target.blur()} // Previene el foco en el input
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
${submitted && !getSelectedDate() ? "border-red-500" : "border-gray-300"}`}
                      withPortal
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={15}
                      scrollableYearDropdown
                    />
                    {submitted && !getSelectedDate() && (
                      <p className="text-red-600 text-xs mt-1">
                        La fecha límite es obligatoria.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Motivo del Cambio (Condicional) */}
              {fechaInput !== fechaOriginalFormateada && (
                <div>
                  <label
                    htmlFor={`edit-motivo-${tarea.id}`}
                    className="block text-sm font-semibold mb-1 text-red-700"
                  >
                    Motivo del cambio de fecha{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id={`edit-motivo-${tarea.id}`}
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                    required
                    disabled={loading}
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${
                        submitted && !motivoCambio.trim()
                          ? "border-red-500 focus:ring-red-500"
                          : "border-red-300 focus:ring-red-600"
                      }`}
                  >
                    <option value="" disabled>
                      Selecciona un motivo...
                    </option>
                    {MOTIVOS_CAMBIO_FECHA.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                  {submitted && !motivoCambio.trim() && (
                    <p className="text-red-600 text-xs mt-1">
                      El motivo es obligatorio si cambia la fecha.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 💡 5. FOOTER (Fijo) */}
          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading} // 🔽 7. DESHABILITA SI ESTÁ SUBIENDO O BORRANDO
              className={` ${
                loading || loadingDelete
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-blue-700"
              } bg-blue-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200`}
            >
              {loading
                ? "Guardando..."
                : loadingDelete
                ? "Borrando..."
                : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
      {isResponsableModalOpen && <ModalResponsablePicker />}
      {isPrioridadModalOpen && <ModalPrioridadPicker />}
    </div>
  );
};

export default ModalEditar;
