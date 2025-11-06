import React, { useState } from "react";
import { api } from "../data/api";
import { toast } from "react-toastify";
import type { Tarea, Estatus, Urgencia } from "../../types/tarea";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ModalNuevaProps {
  onClose: () => void;
  onTareaAgregada: () => void;
  tarea?: Tarea;
}

// --- Helper para formatear Date a YYYY-MM-DD ---
const formatDateToInput = (fecha?: Date | null): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return "";
  // Usamos getUTCFullYear, getUTCMonth, y getUTCDate para evitar problemas de zona horaria
  // al convertir la fecha original
  const anio = fecha.getUTCFullYear(); // 👈 CORRECCIÓN: Tipeo en getUTCFullYear
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
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

const ModalNueva: React.FC<ModalNuevaProps> = ({
  onClose,
  tarea,
  onTareaAgregada, // 👈 PASO 3.2: RECIBIR LA FUNCIÓN
}) => {
  const [nombre, setNombre] = useState("");
  const [comentario, setComentario] = useState("");
  const [responsable, setResponsable] = useState("");
  // 💡 Usa el tipo Urgencia, inicializado como string vacío
  const [prioridad, setPrioridad] = useState<Urgencia | "">("");
  const [fecha, setFecha] = useState(""); // formato YYYY-MM-DD del input
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [isResponsableModalOpen, setIsResponsableModalOpen] = useState(false);
  const [isPrioridadModalOpen, setIsPrioridadModalOpen] = useState(false);

  const [archivos, setArchivos] = useState<File[]>([]);

  // 1. Convierte tu string 'DD-MM-YYYY' (estado) a un Date (para el picker)
  const getSelectedDate = () => {
    if (!fecha) return null;
    // Usamos UTC para ser consistentes con tu lógica de 'handleSubmit'
    const dateObj = new Date(`${fecha}T00:00:00.000Z`);
    // Evita errores si el string de fecha es inválido
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  };

  // 2. Convierte el Date (del picker) de vuelta a tu string 'DD-MM-YYYY' (para el estado)
  const handleDateChange = (date: Date | null) => {
    // Reutiliza tu propia función 'formatDateToInput' que ya tienes
    setFecha(formatDateToInput(date));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convierte el FileList (que no es un array) a un array
      const nuevosArchivos = Array.from(e.target.files);

      // Agrega los nuevos archivos al array existente
      setArchivos((prevArchivos) => [...prevArchivos, ...nuevosArchivos]);

      // Opcional: Limpia el valor del input para permitir
      // seleccionar el mismo archivo de nuevo si se elimina por error.
      e.target.value = "";
    }
  };

  /**
   * Elimina un archivo de la lista basado en su índice.
   */
  const handleRemoveArchivo = (indexToRemove: number) => {
    setArchivos((prevArchivos) =>
      // Crea un nuevo array excluyendo el archivo en 'indexToRemove'
      prevArchivos.filter((_, index) => index !== indexToRemove)
    );
  };

  // 🧩 Enviar nueva tarea al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // 1. Validación (sin cambios)
    if (!nombre || !responsable || !prioridad || !fecha || !comentario) {
      return;
    }

    setLoading(true);

    try {
      // 2. Obtener Asignador (sin cambios)
      const token = localStorage.getItem("token"); // (Tu 'api' ya lo inyecta, pero es buena práctica tenerlo si se usa en payload)
      let asignadorNombre = "Administrador";
      const usuarioStorage = localStorage.getItem("usuario");
      if (usuarioStorage) {
        try {
          const usuario = JSON.parse(usuarioStorage);
          asignadorNombre = usuario?.nombre || asignadorNombre;
        } catch (parseError) {
          console.error("Error parseando usuario de localStorage:", parseError);
        }
      }

      // 3. Payload de la Tarea (sin cambios)
      const nuevaTareaPayload = {
        tarea: nombre,
        observaciones: comentario || null,
        responsable: responsable,
        urgencia: prioridad,
        fechaRegistro: new Date().toISOString(),
        fechaLimite: `${fecha}T00:00:00.000Z`,
        estatus: "PENDIENTE",
        asignador: asignadorNombre,
      };

      console.log("📨 PASO 1: Creando tarea...", nuevaTareaPayload);

      // --- 💡 LÓGICA ACTUALIZADA ---

      // 4. PASO 1: Crear la Tarea
      // Usamos 'await' para obtener la respuesta con la tarea creada (y su ID)
      const response = await api.post<Tarea>("/tareas", nuevaTareaPayload);
      const tareaCreada = response.data;

      console.log(`✅ Tarea creada con ID: ${tareaCreada.id}`);

      if (archivos.length > 0) {
        // 👈 Ya no es necesario 'archivos &&'
        console.log(`Subiendo ${archivos.length} imágenes...`);
        const formData = new FormData();

        // De: Array.from(archivos).forEach(file => {
        // A:
        archivos.forEach((file) => {
          // 👈 'archivos' ya es un array
          formData.append("imagenes", file);
        });

        // ... (el resto de la lógica de subida es idéntica)
        await api.post(`/tareas/${tareaCreada.id}/upload`, formData);

        console.log(`✅ Imágenes subidas para Tarea ID: ${tareaCreada.id}`);
      }

      // 6. PASO 3: Finalizar
      toast.success("Tarea creada correctamente.");
      onTareaAgregada(); // Recarga la lista
      onClose(); // Cierra el modal
    } catch (error: any) {
      console.error(
        "❌ Error en el proceso de creación:",
        error.response?.data || error.message
      );

      // Error más descriptivo
      // Comprueba si el error ocurrió durante la subida de imágenes
      const isUploadError = error.config?.url.includes("/upload");

      if (isUploadError) {
        // La tarea se creó, pero las imágenes fallaron
        toast.error(`❌ Tarea creada, pero falló la subida de imágenes.`);
        // Igual recargamos y cerramos, ya que la tarea sí existe
        onTareaAgregada();
        onClose();
      } else {
        // El error fue al crear la tarea (Paso 1)
        const mensajeError =
          error.response?.data?.error || "No se pudo guardar la tarea.";
        toast.error(`❌ ${mensajeError}`);
      }
    } finally {
      setLoading(false);
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

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" // 💡 p-4 para dar espacio en pantallas muy pequeñas
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
            NUEVA TAREA
          </h2>
        </div>

        {/* 💡 3. FORMULARIO (ocupa el espacio restante) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0" // 👈 Clave para que el formulario se estire
          noValidate
        >
          {/* 💡 4. BODY (Scrollable) */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Revisar reporte de calidad"
                  required
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none
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

              {/* Indicaciones (AHORA OBLIGATORIO) */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Indicaciones
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agrega indicaciones o detalles..."
                  disabled={loading}
                  required
                  className={`w-full border rounded-md px-3 py-2 h-20 resize-none focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100
                    ${
                      submitted && !comentario.trim()
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                />
                {submitted && !comentario.trim() && (
                  <p className="text-red-600 text-xs mt-1">
                    Las indicaciones son obligatorias.
                  </p>
                )}
              </div>

              {/* 📸 SECCIÓN DE EVIDENCIA ACTUALIZADA */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Evidencia (Opcional)
                </label>

                {/* 1. Botón visible (es una label) para activar el input */}
                <label
                  htmlFor="file-upload" // Conecta con el id del input
                  // 👇 AÑADE ESTO: Previene el clic si está cargando
                  onClick={(e) => {
                    if (loading) e.preventDefault();
                  }}
                  // 👇 MODIFICA ESTO:
                  className={`w-full flex items-center justify-center gap-2 
                bg-amber-100 text-amber-900 
                font-semibold px-4 py-2 rounded-md 
                transition-all duration-200
                ${
                  loading
                    ? "opacity-50 cursor-not-allowed" // Estilos "disabled"
                    : "cursor-pointer hover:bg-amber-200" // Estilos normales
                }
              `}
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
                  <span>
                    {archivos.length > 0
                      ? "Agregar más"
                      : "Agregar / Tomar Foto"}
                  </span>
                </label>

                {/* 2. El Input de archivo real, ahora oculto */}
                <input
                  id="file-upload" // ID para la label
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  disabled={loading}
                  onChange={handleFileChange} // 👈 Usa el nuevo handler
                  className="hidden" // 👈 Oculta el input por defecto
                />

                {/* 3. Lista interactiva de archivos seleccionados */}
                {archivos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {archivos.length} archivo(s) para subir:
                    </p>
                    <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {archivos.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between 
                       bg-gray-100 p-2 rounded-md"
                        >
                          {/* Muestra un thumbnail (¡bonus!) */}
                          <img
                            src={URL.createObjectURL(file)} // Previsualización
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded-md"
                            onLoad={(e) =>
                              URL.revokeObjectURL(e.currentTarget.src)
                            } // Libera memoria
                          />
                          {/* Nombre (con truncado) */}
                          <span className="flex-1 text-sm text-gray-700 mx-3 truncate">
                            {file.name}
                          </span>

                          {/* Botón de Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleRemoveArchivo(index)}
                            disabled={loading}
                            className="flex-shrink-0 p-1 text-red-600 
                         hover:bg-red-100 rounded-full
                         disabled:opacity-50"
                            aria-label="Eliminar archivo"
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

              {/* Responsable */}
              <div>
                <label
                  htmlFor="nueva-responsable"
                  className="block text-sm font-semibold mb-1"
                >
                  Responsable
                </label>
                {/* Este botón abre el picker */}
                <button
                  type="button" // Previene que envíe el formulario
                  id="nueva-responsable"
                  onClick={() => setIsResponsableModalOpen(true)}
                  disabled={loading}
                  className={`relative w-full border rounded-md px-3 py-2 text-left focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      submitted && !responsable
                        ? "border-red-500" // Estilo de error
                        : "border-gray-300"
                    }
                    ${
                      responsable ? "text-gray-900" : "text-gray-400" // Estilo de placeholder
                    }
                  `}
                >
                  {responsable || "Seleccionar..."}

                  {/* Icono de selector (Chevron) */}
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
                </button>{" "}
                {submitted && !responsable && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar un responsable.
                  </p>
                )}{" "}
              </div>

              {/* Prioridad */}
              <div>
                {" "}
                <label
                  htmlFor="nueva-prioridad"
                  className="block text-sm font-semibold mb-1"
                >
                  Prioridad
                </label>
                {/* Este botón abre el picker de prioridad */}
                <button
                  type="button"
                  id="nueva-prioridad"
                  onClick={() => setIsPrioridadModalOpen(true)} // 👈 Conecta al nuevo estado
                  disabled={loading}
                  className={`relative w-full border rounded-md px-3 py-2 text-left focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${
                      submitted && !prioridad
                        ? "border-red-500" // Estilo de error
                        : "border-gray-300"
                    }
                    ${
                      prioridad ? "text-gray-900" : "text-gray-400" // Estilo de placeholder
                    }
                  `}
                >
                  {/* Busca la etiqueta que coincide con el valor (ej. "ALTA" -> "Alta") */}
                  {PRIORIDADES_VALIDAS.find((p) => p.value === prioridad)
                    ?.label || "Seleccionar..."}
                  {/* Icono de selector (Chevron) */}
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

              {/* Fecha Límite */}
              <div>
                <label
                  htmlFor="nueva-fecha"
                  className="block text-sm font-semibold mb-1"
                >
                  Fecha Límite
                </label>
                <DatePicker
                  id="nueva-fecha"
                  selected={getSelectedDate()}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecciona una fecha"
                  required
                  disabled={loading}
                  // 👇 IMPLEMENTACIÓN CLAVE: Bloquea la selección de fechas pasadas en el calendario
                  minDate={new Date()}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${
                    submitted && !getSelectedDate()
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
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
            </div>
          </div>

          {/* 💡 5. FOOTER (Fijo) */}
          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"
              } bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      {isResponsableModalOpen && <ModalResponsablePicker />}
      {isPrioridadModalOpen && <ModalPrioridadPicker />}
    </div>
  );
};

export default ModalNueva;
