import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

import { tareasService } from "../../api/tareas.service";
import { usuariosService } from "../../api/usuarios.service";
import type { Tarea, Estatus, Urgencia, ImagenTarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";
import api from "../../api/01_axiosInstance";

interface ModalEditarProps {
  onClose: () => void;
  onTareaActualizada: () => void;
  user: Usuario | null;
  tarea: Tarea;
}

// --- Helper (sin cambios) ---
const formatDateToInput = (fecha?: Date | null | string): string => {
  if (!fecha) return "";

  // Maneja tanto strings ISO como objetos Date
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;

  if (!(fechaObj instanceof Date) || isNaN(fechaObj.getTime())) return "";

  // Usar getUTCFullYear, getUTCMonth, etc. para evitar problemas de zona horaria
  // al convertir un string ISO que ya viene en UTC (Z).
  const anio = fechaObj.getUTCFullYear();
  const mes = String(fechaObj.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fechaObj.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

// --- Constante (sin cambios) ---
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
  "Otro",
];

const ModalEditar: React.FC<ModalEditarProps> = ({
  onClose,
  tarea,
  onTareaActualizada,
  user,
}) => {
  // --- Estados del formulario (inicializados) ---
  const [nombre, setNombre] = useState(tarea.tarea);
  const [comentario, setComentario] = useState(tarea.observaciones || "");
  const [prioridad, setPrioridad] = useState<Urgencia | "">(tarea.urgencia);
  const [fecha, setFecha] = useState(formatDateToInput(tarea.fechaLimite));
  const [archivos, setArchivos] = useState<File[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenTarea[]>(
    tarea.imagenes || []
  );

  // --- Estados de Datos (inicializados) ---
  const [responsablesIds, setResponsablesIds] = useState<number[]>(
    // Esto está correcto (r.id) porque tu API devuelve los objetos de usuario
    tarea.responsables ? tarea.responsables.map((r) => r.id) : []
  );
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  // --- 🚀 ESTADOS PARA EL MOTIVO DE CAMBIO (CORREGIDOS) ---

  // 1. Guardamos la fecha YYYY-MM-DD original (para la UI)
  const [fechaStringOriginal] = useState(formatDateToInput(tarea.fechaLimite));

  // 2. 🎯 Guardamos la fecha ISO original (para el payload del historial)
  const [fechaISOOriginal] = useState(tarea.fechaLimite);

  const [motivoCambio, setMotivoCambio] = useState("");

  // 3. La variable derivada usa el string de UI para la comparación
  const fechaHaCambiado = fecha !== fechaStringOriginal;

  // --- Estados de UI ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- Cargar usuarios (sin cambios) ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;
      setLoadingUsuarios(true);
      try {
        // La lógica del backend ya filtra por rol/depto
        const data = await usuariosService.getAll();
        const listaOrdenada = data.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        setListaUsuarios(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        toast.error("No se pudo cargar la lista de usuarios.");
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, [user]);

  // --- Handlers de DatePicker (sin cambios) ---
  const getSelectedDate = () => {
    if (!fecha) return null;
    // Aseguramos que la fecha se interprete como UTC
    const dateObj = new Date(`${fecha}T00:00:00.000Z`);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  };

  // const handleDateChange = (date: Date | null) => { ... }; // Ya no se usa con input[type=date]

  // --- Handlers de Archivos (Nuevos) (sin cambios) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivos((prevArchivos) => [...prevArchivos, ...nuevosArchivos]);
      e.target.value = "";
    }
  };

  const handleRemoveArchivo = (indexToRemove: number) => {
    setArchivos((prevArchivos) =>
      prevArchivos.filter((_, index) => index !== indexToRemove)
    );
  };

  // --- 🚀 NUEVO HANDLER: Borrar Imagen Existente ---
  const handleRemoveImagenExistente = async (imagenId: number) => {
    if (loading) return;
    // Opcional: Pedir confirmación
    // if (!window.confirm("¿Seguro que quieres eliminar esta imagen?")) return;

    setLoading(true); // Usamos el spinner global
    try {
      // Usamos el endpoint de borrado de imagen del backend
      await api.delete(`/tareas/imagen/${imagenId}`);
      toast.success("Imagen eliminada.");
      // Actualizamos el estado de imágenes existentes
      setImagenesExistentes((prev) =>
        prev.filter((img) => img.id !== imagenId)
      );
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      toast.error("No se pudo eliminar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handler de Responsables (sin cambios) ---
  const handleToggleResponsable = (id: number) => {
    setResponsablesIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // --- 🚀 handleSubmit MODIFICADO PARA UPDATE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // 1. Validación (Campos básicos)
    if (
      !nombre ||
      responsablesIds.length === 0 ||
      !prioridad ||
      !fecha ||
      !comentario
    ) {
      toast.warn("Por favor, completa todos los campos obligatorios.");
      return;
    }

    // 1.A. Validación de Motivo
    if (fechaHaCambiado && !motivoCambio) {
      toast.warn("Si cambias la fecha, debes seleccionar un motivo.");
      return;
    }

    setLoading(true);

    // 2. Validación de Autenticación
    if (!user || !user.departamentoId) {
      toast.error(
        "Error de autenticación: No se pudo identificar tu departamento."
      );
      setLoading(false);
      return;
    }

    if (user.rol === Rol.SUPER_ADMIN) {
      toast.error(
        "El SUPER_ADMIN (aún) no puede editar tareas desde este modal."
      );
      setLoading(false);
      return;
    }

    try {
      // 🚀 --- INICIA LÓGICA DE ENVÍO --- 🚀

      if (fechaHaCambiado) {
        // --- 3.A. LA FECHA CAMBIÓ (Dos llamadas API) ---

        // PASO 1: Actualizar los datos (EXCEPTO la fecha)
        const payloadDatos = {
          tarea: nombre,
          observaciones: comentario || null,
          urgencia: prioridad,
          estatus: tarea.estatus,
          responsables: responsablesIds, // Esto es number[]
        };
        console.log(
          "📨 PASO 1: Actualizando datos de la tarea...",
          payloadDatos
        );

        // Usamos 'as any' para saltar el error de tipo TS
        await tareasService.update(tarea.id, payloadDatos as any);

        console.log(`✅ Datos de Tarea ID ${tarea.id} actualizados.`);

        // PASO 2: Actualizar la fecha y registrar el historial
        // 🎯 CORRECCIÓN: Añadimos 'fechaAnterior' para evitar el error 400
        const payloadHistorial = {
          motivo: motivoCambio,
          nuevaFecha: new Date(`${fecha}T12:00:00.000Z`).toISOString(),
          fechaAnterior: fechaISOOriginal, // 👈 Se envía la fecha ISO original
        };

        console.log(
          "📨 PASO 2: Actualizando fecha y historial...",
          payloadHistorial
        );

        await api.post(`/tareas/${tarea.id}/historial`, payloadHistorial);
        console.log(
          `✅ Fecha e Historial de Tarea ID ${tarea.id} actualizados.`
        );
      } else {
        // --- 3.B. LA FECHA NO CAMBIÓ (Una llamada API) ---

        const payloadCompleto = {
          tarea: nombre,
          observaciones: comentario || null,
          urgencia: prioridad,
          fechaLimite: new Date(`${fecha}T12:00:00.000Z`).toISOString(),
          estatus: tarea.estatus,
          responsables: responsablesIds, // Esto es number[]
        };

        console.log(
          "📨 PASO 1: Actualizando tarea (sin cambio de fecha)...",
          payloadCompleto
        );

        // Usamos 'as any' aquí también
        await tareasService.update(tarea.id, payloadCompleto as any);

        console.log(`✅ Tarea ID ${tarea.id} actualizada.`);
      }

      // --- 🚀 FIN LÓGICA DE ENVÍO --- 🚀

      // 4. PASO 4: Subir Imágenes (NUEVAS)
      if (archivos.length > 0) {
        console.log(`Subiendo ${archivos.length} imágenes NUEVAS...`);
        const formData = new FormData();
        archivos.forEach((file) => {
          formData.append("imagenes", file);
        });
        await api.post(`/tareas/${tarea.id}/upload`, formData);
        console.log(`✅ Imágenes subidas para Tarea ID: ${tarea.id}`);
      }

      // 5. PASO 5: Finalizar
      toast.success("Tarea actualizada correctamente.");
      onTareaActualizada();
      onClose();
    } catch (error: any) {
      // Manejo de errores mejorado
      console.error(
        "❌ Error en el proceso de actualización:",
        error.response?.data || error.message
      );
      const isUploadError = error.config?.url.includes("/upload");
      const isHistorialError = error.config?.url.includes("/historial");

      if (isUploadError) {
        toast.error("Tarea actualizada, pero falló la subida de imágenes.");
        onTareaActualizada();
        onClose();
      } else if (isHistorialError) {
        const detalleError = error.response?.data?.detalles
          ? JSON.stringify(error.response.data.detalles)
          : error.response?.data?.error || "Datos inválidos";

        toast.error(
          `Datos guardados, pero falló el registro de fecha: ${detalleError}`
        );
        onTareaActualizada(); // Recargamos porque los datos SÍ se guardaron
        onClose();
      } else {
        const mensajeError =
          error.response?.data?.detalle ||
          error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo guardar la tarea.";
        toast.error(`❌ ${mensajeError}`);
      }
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
        {/* --- HEADER --- */}
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
            EDITAR TAREA
          </h2>
        </div>

        {/* --- FORMULARIO --- */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0"
          noValidate
        >
          {/* --- BODY (Scrollable) --- */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">
              {/* --- Nombre --- */}
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

              {/* --- Indicaciones --- */}
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

              {/* --- Evidencia --- */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Evidencia
                </label>
                {/* 1. Imágenes Existentes */}
                {imagenesExistentes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      Imágenes actuales:
                    </p>
                    <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {imagenesExistentes.map((imagen) => (
                        <li
                          key={imagen.id}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                        >
                          <a
                            href={imagen.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={imagen.url}
                              alt={`Imagen ${imagen.id}`}
                              className="w-10 h-10 object-cover rounded-md"
                            />
                          </a>
                          <span className="flex-1 text-sm text-gray-700 mx-3 truncate">
                            {imagen.url.split("/").pop()?.substring(0, 20)}...
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveImagenExistente(imagen.id)
                            }
                            disabled={loading}
                            className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                            aria-label="Eliminar imagen existente"
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
                {/* 2. Botón de Carga */}
                <label
                  htmlFor="file-upload"
                  onClick={(e) => {
                    if (loading) e.preventDefault();
                  }}
                  className={`w-full flex items-center justify-center gap-2 
                    bg-amber-100 text-amber-900 
                    font-semibold px-4 py-2 rounded-md 
                    transition-all duration-200
                    ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:bg-amber-200"
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
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  disabled={loading}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {/* 3. Archivos Nuevos */}
                {archivos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {archivos.length} archivo(s) NUEVOS para subir:
                    </p>
                    <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                      {archivos.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
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
                            onClick={() => handleRemoveArchivo(index)}
                            disabled={loading}
                            className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
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

              {/* --- Responsables --- */}
              <div>
                <label
                  htmlFor="responsable-list"
                  className="block text-sm font-semibold mb-1"
                >
                  Responsable(s)
                </label>
                {loadingUsuarios ? (
                  <div
                    className="relative w-full h-32 border rounded-md px-3 py-2 
                           bg-gray-100 border-gray-300 
                           flex items-center justify-center"
                  >
                    <p className="text-gray-500">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div
                    id="responsable-list"
                    className={`relative w-full h-32 border rounded-md 
                    overflow-y-auto 
                    focus:ring-2 focus:ring-amber-950 focus:outline-none 
                    ${
                      submitted && responsablesIds.length === 0
                        ? "border-red-500"
                        : "border-gray-300"
                    }
                  `}
                    tabIndex={0}
                  >
                    {listaUsuarios.map((u) => (
                      <label
                        key={u.id}
                        htmlFor={`resp-${u.id}`}
                        className={`
                          flex items-center gap-3 w-full px-3 py-2 
                          cursor-pointer transition-colors
                          ${
                            responsablesIds.includes(u.id)
                              ? "bg-amber-100 text-amber-900 font-semibold"
                              : "text-gray-800 hover:bg-gray-50"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          id={`resp-${u.id}`}
                          checked={responsablesIds.includes(u.id)}
                          onChange={() => handleToggleResponsable(u.id)}
                          disabled={loading}
                          className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950"
                        />
                        <span>{u.nombre}</span>
                      </label>
                    ))}
                  </div>
                )}
                {submitted && responsablesIds.length === 0 && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar al menos un responsable.
                  </p>
                )}
              </div>

              {/* --- Prioridad --- */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Prioridad
                </label>
                <fieldset className="mt-2 grid grid-cols-3 gap-2">
                  {PRIORIDADES_VALIDAS.map((p) => (
                    <div key={p.value}>
                      <input
                        type="radio"
                        id={`prioridad-${p.value}`}
                        name="prioridad-radio-group"
                        value={p.value}
                        checked={prioridad === p.value}
                        onChange={(e) =>
                          setPrioridad(e.target.value as Urgencia)
                        }
                        disabled={loading}
                        className="sr-only peer"
                      />
                      <label
                        htmlFor={`prioridad-${p.value}`}
                        className={`
                          w-full block text-center px-3 py-2 rounded-md 
                          border text-sm font-semibold cursor-pointer transition-all
                          ${loading ? "opacity-50 cursor-not-allowed" : ""}
                          
                          ${
                            p.value === "ALTA" &&
                            `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600
                            ${!loading && "hover:bg-red-100"}
                          `
                          }
                          ${
                            p.value === "MEDIA" &&
                            `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-amber-400 peer-checked:text-white peer-checked:border-amber-400
                            ${!loading && "hover:bg-amber-100"}
                          `
                          }
                          ${
                            p.value === "BAJA" &&
                            `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600
                            ${!loading && "hover:bg-blue-100"}
                          `
                          }
                        `}
                      >
                        {p.label}
                      </label>
                    </div>
                  ))}
                </fieldset>
                {submitted && !prioridad && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar una prioridad.
                  </p>
                )}
              </div>

              {/* --- Fecha Límite --- */}
              <div>
                <label
                  htmlFor="nueva-fecha"
                  className="block text-sm font-semibold mb-1"
                >
                  Fecha Límite
                </label>
                <input
                  type="date"
                  id="nueva-fecha"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  disabled={loading}
                  min={formatDateToInput(new Date())}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${
                    submitted && !getSelectedDate()
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
                />
                {submitted && !getSelectedDate() && (
                  <p className="text-red-600 text-xs mt-1">
                    La fecha límite es obligatoria.
                  </p>
                )}
              </div>

              {/* --- Motivo de Cambio (Condicional) --- */}
              {fechaHaCambiado && (
                <div>
                  <label
                    htmlFor="motivo-cambio"
                    className="block text-sm font-semibold mb-1 text-blue-800"
                  >
                    Motivo del Cambio de Fecha
                  </label>
                  <select
                    id="motivo-cambio"
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                    disabled={loading}
                    required
                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-700 focus:outline-none
                      ${
                        submitted && fechaHaCambiado && !motivoCambio
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                  >
                    <option value="" disabled>
                      -- Selecciona un motivo --
                    </option>
                    {MOTIVOS_CAMBIO_FECHA.map((motivo) => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                  {submitted && fechaHaCambiado && !motivoCambio && (
                    <p className="text-red-600 text-xs mt-1">
                      El motivo es obligatorio si cambias la fecha.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- FOOTER --- */}
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
              {loading ? "Actualizando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditar;
