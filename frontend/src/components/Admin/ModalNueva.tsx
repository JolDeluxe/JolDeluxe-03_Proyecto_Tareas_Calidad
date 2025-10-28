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

  // 🧩 Enviar nueva tarea al backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!nombre || !responsable || !prioridad || !fecha || !comentario) {
      // Nota: Si quieres que comentario no sea obligatorio, quítalo de aquí.
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      let asignadorNombre = "Administrador"; // Valor por defecto
      const usuarioStorage = localStorage.getItem("usuario");
      if (usuarioStorage) {
        try {
          const usuario = JSON.parse(usuarioStorage);
          asignadorNombre = usuario?.nombre || asignadorNombre;
        } catch (parseError) {
          console.error("Error parseando usuario de localStorage:", parseError);
        }
      }

      // 💡 Prepara el objeto Tarea para enviar a la API
      const nuevaTareaPayload = {
        tarea: nombre,
        observaciones: comentario || null, // Enviar null si está vacío
        responsable: responsable,
        // 💡 Usa el valor del estado 'prioridad' (ya es ALTA, MEDIA o BAJA)
        urgencia: prioridad,
        // Fecha actual en formato ISO
        fechaRegistro: new Date().toISOString(),
        // 💡 Convierte YYYY-MM-DD a formato ISO UTC T00:00:00
        fechaLimite: `${fecha}T00:00:00.000Z`,
        // 💡 Estatus inicial correcto
        estatus: "PENDIENTE",
        asignador: asignadorNombre,
        // fechaConclusion se omite, la API lo manejará como null por defecto
      };

      console.log("📨 Enviando nueva tarea:", nuevaTareaPayload); // Para depuración

      await api.post("/tareas", nuevaTareaPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🥇 MUESTRA EL TOAST PRIMERO
      toast.success("Tarea creada correctamente.");

      // 👇 PASO 3.3: LLAMAR A LA FUNCIÓN DE RECARGA
      onTareaAgregada();

      // 🥈 Luego cierra el modal
      onClose();
    } catch (error: any) {
      console.error(
        "❌ Error al crear tarea:",
        error.response?.data || error.message
      );
      const mensajeError =
        error.response?.data?.error || "No se pudo guardar la tarea.";
      toast.error(`❌ ${mensajeError}`);
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
        submitted && !getSelectedDate() ? "border-red-500" : "border-gray-300"
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
