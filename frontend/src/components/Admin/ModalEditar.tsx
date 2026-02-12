// 📍 src/components/Admin/ModalEditar.tsx

import React, { useState, useEffect, useMemo } from "react";
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

// --- Constantes de la aplicación ---
const MAX_NOMBRE_LENGTH = 50;
const MAX_OBSERVACIONES_LENGTH = 160;
const MAX_FILES_LIMIT = 5;

// --- Helper corregido para usar TIEMPO LOCAL (Importante para que coincida con la hora) ---
const formatDateToInput = (fecha?: Date | null | string): string => {
  if (!fecha) return "";
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(fechaObj instanceof Date) || isNaN(fechaObj.getTime())) return "";

  const anio = fechaObj.getFullYear();
  const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
  const dia = String(fechaObj.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

// --- Constante (sin cambios) ---
const PRIORIDADES_VALIDAS: { value: Urgencia; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

export const MOTIVOS_CAMBIO_FECHA = [
  // --- 1. Gestión y Planificación (Lo más común) ---
  "Solicitud del responsable",
  "Cambio de prioridades",
  "Ajuste de planificación",
  "Ampliación del alcance de la tarea",
  "Error en la estimación de tiempo inicial",

  // --- 2. Bloqueos del Proceso (No puedo avanzar) ---
  "Falta de información/recursos",
  "Espera de autorización/Visto bueno",
  "Retraso en tarea previa",

  // --- 3. Personal y Equipo (Problemas internos) ---
  "Retraso imputable al responsable",
  "Ausencia o baja médica del personal",
  "Sobrecarga de trabajo asignado",
  "Incidencia técnica o falla de equipo",

  // --- 4. Factores Externos (Fuera de control) ---
  "Retraso por parte de terceros",
  "Condiciones externas / Fuerza mayor",
];

const ModalEditar: React.FC<ModalEditarProps> = ({
  onClose,
  tarea,
  onTareaActualizada,
  user,
}) => {
  // --- Estados del formulario ---
  const [nombre, setNombre] = useState(tarea.tarea);
  const [comentario, setComentario] = useState(tarea.observaciones || "");
  const [prioridad, setPrioridad] = useState<Urgencia | "">(tarea.urgencia);

  // ⏰ ESTADOS DE FECHA Y HORA (Inicializados vacíos, se llenan en useEffect)
  const [fecha, setFecha] = useState("");
  const [usarHora, setUsarHora] = useState(false);
  const [hora, setHora] = useState("");

  const [archivos, setArchivos] = useState<File[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenTarea[]>(
    tarea.imagenes || []
  );
  // Nuevo estado para el error de archivos
  const [fileError, setFileError] = useState("");

  // --- Estados de Datos ---
  const [responsablesIds, setResponsablesIds] = useState<number[]>(
    tarea.responsables ? tarea.responsables.map((r) => r.id) : []
  );
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaInvitados, setListaInvitados] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  // --- Estado para búsqueda ---
  const [busqueda, setBusqueda] = useState("");

  const isKaizen = nombre.toUpperCase().startsWith("KAIZEN");

  // --- Estados para el motivo de cambio ---
  const [fechaISOOriginal, setFechaISOOriginal] = useState(tarea.fechaLimite);
  const [motivoCambio, setMotivoCambio] = useState("");

  // 🚀 DETECCIÓN DE FECHA/HORA AL ABRIR EL MODAL
  useEffect(() => {
    if (tarea.fechaLimite) {
      const d = new Date(tarea.fechaLimite);

      setFecha(formatDateToInput(d));

      const h = d.getHours();
      const m = d.getMinutes();

      const esFinDeDia = h === 23 && m === 59;

      if (!esFinDeDia) {
        setUsarHora(true);
        const horaStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        setHora(horaStr);
      } else {
        setUsarHora(false);
        setHora("");
      }

      setFechaISOOriginal(tarea.fechaLimite);
    }
  }, [tarea]);

  // 🚀 CÁLCULO DINÁMICO: ¿Ha cambiado la fecha/hora real?
  const fechaHaCambiado = useMemo(() => {
    if (!fechaISOOriginal) return true;

    let nuevaFecha: Date;
    if (usarHora && hora) {
      nuevaFecha = new Date(`${fecha}T${hora}:00`);
    } else {
      nuevaFecha = new Date(`${fecha}T23:59:59`);
    }

    const originalFecha = new Date(fechaISOOriginal);

    const tNueva = Math.floor(nuevaFecha.getTime() / 1000);
    const tOriginal = Math.floor(originalFecha.getTime() / 1000);

    return tNueva !== tOriginal;
  }, [fecha, usarHora, hora, fechaISOOriginal]);

  // 🚀 Validación: Si es HOY, la hora no puede ser pasada
  const isTimeValidForToday = () => {
    if (!usarHora || !hora || !fecha) return true;

    const now = new Date();
    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada.getTime() > today.getTime()) return true;

    if (fechaSeleccionada.getTime() === today.getTime()) {
      const [h, m] = hora.split(":").map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (h < currentH || (h === currentH && m < currentM)) {
        return false;
      }
    }
    return true;
  };

  // --- Estados de UI ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const isUserInCalidad = user?.departamento?.nombre?.toUpperCase().includes("CALIDAD");

  const getRoleColorClass = (userToDisplay: Usuario): string => {
    if (userToDisplay.rol === Rol.ENCARGADO) return "text-blue-600 font-semibold";
    if (userToDisplay.rol === Rol.USUARIO) return "text-red-700 font-semibold";
    return "";
  };

  const getDisplayName = (userToDisplay: Usuario): string => {
    if (isKaizen || !isUserInCalidad) return userToDisplay.nombre;
    if (userToDisplay.rol === Rol.ENCARGADO) return `${userToDisplay.nombre} (Coordinador)`;
    if (userToDisplay.rol === Rol.USUARIO) return `${userToDisplay.nombre} (Inspector)`;
    return userToDisplay.nombre;
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_NOMBRE_LENGTH) {
      setNombre(newValue);
    } else {
      setNombre(newValue.slice(0, MAX_NOMBRE_LENGTH));
      toast.warn(`Máximo ${MAX_NOMBRE_LENGTH} caracteres para el nombre.`);
    }
  };

  const handleComentarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_OBSERVACIONES_LENGTH) {
      setComentario(newValue);
    } else {
      setComentario(newValue.slice(0, MAX_OBSERVACIONES_LENGTH));
      toast.warn(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres permitidos.`);
    }
  };

  // --- Cargar usuarios ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;
      setLoadingUsuarios(true);
      try {
        let mainUsersPromise: Promise<Usuario[]>;
        switch (user.rol) {
          case Rol.ADMIN:
            mainUsersPromise = usuariosService.getEncargadosYUsuarios();
            break;
          case Rol.ENCARGADO:
            mainUsersPromise = usuariosService.getUsuarios();
            break;
          case Rol.SUPER_ADMIN:
            mainUsersPromise = usuariosService.getAll();
            break;
          default:
            mainUsersPromise = usuariosService.getAll();
            break;
        }

        const [usersData, invitadosData] = await Promise.all([
          mainUsersPromise,
          usuariosService.getInvitados(),
        ]);

        const sortedUsers = usersData.sort((a, b) => {
          const isASelected = responsablesIds.includes(a.id);
          const isBSelected = responsablesIds.includes(b.id);
          if (isASelected && !isBSelected) return -1;
          if (!isASelected && isBSelected) return 1;
          const rolA = a.rol;
          const rolB = b.rol;
          if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return -1;
          if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return 1;
          return a.nombre.localeCompare(b.nombre);
        });

        setListaUsuarios(sortedUsers);
        setListaInvitados(
          invitadosData.sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        toast.error("No se pudo cargar la lista de usuarios.");
      } finally {
        setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
  }, [user, responsablesIds]);

  // --- Handlers de DatePicker ---
  const getSelectedDate = () => {
    if (!fecha) return null;
    const dateObj = new Date(`${fecha}T00:00:00.000Z`);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileError(""); // Limpiar error
      const nuevosArchivos = Array.from(e.target.files);
      const TAMANO_MAXIMO = 5 * 1024 * 1024;
      const archivoPesado = nuevosArchivos.find((file) => file.size > TAMANO_MAXIMO);

      if (archivoPesado) {
        toast.error(`⚠️ El archivo "${archivoPesado.name}" pesa más de 5MB.`);
        e.target.value = "";
        return;
      }

      // Validacion modificada: considera imagenes existentes + nuevos archivos
      if (archivos.length + imagenesExistentes.length + nuevosArchivos.length > MAX_FILES_LIMIT) {
        setFileError(`Solo puedes tener un máximo de ${MAX_FILES_LIMIT} evidencias (imágenes existentes + nuevas).`);
        e.target.value = "";
        return;
      }

      setArchivos((prevArchivos) => [...prevArchivos, ...nuevosArchivos]);
      e.target.value = "";
    }
  };

  const handleRemoveArchivo = (indexToRemove: number) => {
    setArchivos((prevArchivos) =>
      prevArchivos.filter((_, index) => index !== indexToRemove)
    );
    setFileError(""); // Limpiar error si se libera espacio
  };

  const handleRemoveImagenExistente = async (imagenId: number) => {
    if (loading) return;
    setLoading(true);
    try {
      await tareasService.deleteImage(imagenId);
      toast.success("Imagen eliminada.");
      setImagenesExistentes((prev) =>
        prev.filter((img) => img.id !== imagenId)
      );
      setFileError(""); // Limpiar error si se libera espacio al borrar imagen existente
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      toast.error("No se pudo eliminar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResponsable = (id: number) => {
    setResponsablesIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // --- handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

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

    if (usarHora && !hora) {
      toast.warn("Has activado la hora opcional, por favor selecciona una hora.");
      return;
    }

    // 🚀 Validación de hora pasada
    if (!isTimeValidForToday()) {
      toast.error("La hora seleccionada ya pasó. Elige una hora futura.");
      return;
    }

    if (fechaHaCambiado && !motivoCambio) {
      toast.warn("Si cambias la fecha u hora, debes seleccionar un motivo.");
      return;
    }

    if (nombre.length > MAX_NOMBRE_LENGTH) {
      toast.error(`El Nombre excede el máximo permitido (${MAX_NOMBRE_LENGTH}).`);
      setLoading(false);
      return;
    }

    if (comentario.length > MAX_OBSERVACIONES_LENGTH) {
      toast.error(`El texto de Indicaciones excede el máximo permitido (${MAX_OBSERVACIONES_LENGTH}).`);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (!user || !user.departamentoId || user.rol === Rol.SUPER_ADMIN) {
      if (!user || !user.departamentoId) {
        toast.error("Error de autenticación: No se pudo identificar tu departamento.");
      } else if (user.rol === Rol.SUPER_ADMIN) {
        toast.error("El SUPER_ADMIN (aún) no puede editar tareas desde este modal.");
      }
      setLoading(false);
      return;
    }

    try {
      let fechaLimiteFinal: Date;
      if (usarHora && hora) {
        fechaLimiteFinal = new Date(`${fecha}T${hora}:00`);
      } else {
        fechaLimiteFinal = new Date(`${fecha}T23:59:59`);
      }

      if (fechaHaCambiado) {
        const payloadDatos = {
          tarea: nombre,
          observaciones: comentario || null,
          urgencia: prioridad,
          estatus: tarea.estatus,
          responsables: responsablesIds,
        };
        console.log("📨 PASO 1: Actualizando datos de la tarea...", payloadDatos);

        await tareasService.update(tarea.id, payloadDatos as any);
        console.log(`✅ Datos de Tarea ID ${tarea.id} actualizados.`);

        const nuevaFechaISO = fechaLimiteFinal.toISOString();
        const payloadHistorial = {
          motivo: motivoCambio,
          nuevaFecha: nuevaFechaISO,
          fechaAnterior: fechaISOOriginal,
        };

        console.log("📨 PASO 2: Actualizando fecha y historial...", payloadHistorial);
        await tareasService.createHistorial(tarea.id, payloadHistorial as any);
        console.log(`✅ Fecha e Historial de Tarea ID ${tarea.id} actualizados.`);
      } else {
        const payloadCompleto = {
          tarea: nombre,
          observaciones: comentario || null,
          urgencia: prioridad,
          fechaLimite: fechaLimiteFinal.toISOString(),
          estatus: tarea.estatus,
          responsables: responsablesIds,
        };

        console.log("📨 PASO 1: Actualizando tarea...", payloadCompleto);
        await tareasService.update(tarea.id, payloadCompleto as any);
        console.log(`✅ Tarea ID ${tarea.id} actualizada.`);
      }

      if (archivos.length > 0) {
        console.log(`Subiendo ${archivos.length} imágenes NUEVAS...`);
        const formData = new FormData();
        archivos.forEach((file) => {
          formData.append("imagenes", file);
        });
        await tareasService.uploadImage(tarea.id, formData);
        console.log(`✅ Imágenes subidas para Tarea ID: ${tarea.id}`);
      }

      toast.success("Tarea actualizada correctamente.");
      onTareaActualizada();
      onClose();
    } catch (error: any) {
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

        toast.error(`Datos guardados, pero falló el registro de fecha: ${detalleError}`);
        onTareaActualizada();
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

  const usuariosFiltrados = (isKaizen ? listaInvitados : listaUsuarios).filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular total de archivos (existentes + nuevos) para deshabilitar botón
  const totalFiles = imagenesExistentes.length + archivos.length;
  const isFileLimitReached = totalFiles >= MAX_FILES_LIMIT;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] md:max-w-md lg:max-w-6xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
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

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0"
          noValidate
        >
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">

              {/* --- BODY: GRID DE 3 COLUMNAS EN DESKTOP --- */}
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">

                {/* --- COLUMNA 1: INFO BÁSICA --- */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Nombre</span>
                      <span className={`text-xs ${nombre.length > MAX_NOMBRE_LENGTH ? "text-red-600 font-bold" : "text-gray-500"}`}>
                        {nombre.length}/{MAX_NOMBRE_LENGTH}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={handleNombreChange}
                      placeholder="Ej. Revisar reporte de calidad"
                      required
                      disabled={loading}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none
                        ${submitted && !nombre.trim() ? "border-red-500" : "border-gray-300"}`}
                    />
                    {submitted && !nombre.trim() && (
                      <p className="text-red-600 text-xs mt-1">El nombre es obligatorio.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Indicaciones</span>
                      <span className={`text-xs ${comentario.length > MAX_OBSERVACIONES_LENGTH ? "text-red-600 font-bold" : "text-gray-500"}`}>
                        {comentario.length}/{MAX_OBSERVACIONES_LENGTH}
                      </span>
                    </label>
                    <textarea
                      value={comentario}
                      onChange={handleComentarioChange}
                      placeholder="Agrega indicaciones o detalles..."
                      disabled={loading}
                      required
                      className={`w-full border rounded-md px-3 py-2 h-20 lg:h-40 resize-none focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100
                        ${submitted && !comentario.trim() ? "border-red-500" : "border-gray-300"}`}
                    />
                    {submitted && !comentario.trim() && (
                      <p className="text-red-600 text-xs mt-1">Las indicaciones son obligatorias.</p>
                    )}
                  </div>
                </div>

                {/* --- COLUMNA 2: RESPONSABLES --- */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Responsables / Invitados
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar usuario..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      disabled={loading || loadingUsuarios}
                      className="w-full border rounded-md px-3 py-2 mb-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100"
                    />
                    <div
                      id="responsable-list-editar"
                      className={`relative w-full h-32 lg:h-64 border rounded-md overflow-y-auto focus:ring-2 focus:ring-amber-950 focus:outline-none ${submitted && responsablesIds.length === 0 ? "border-red-500" : "border-gray-300"}`}
                      tabIndex={0}
                    >
                      {usuariosFiltrados.map((u) => (
                        <label key={u.id} htmlFor={`resp-edit-${u.id}`} className={`flex items-center gap-3 w-full px-3 py-2 cursor-pointer transition-colors ${responsablesIds.includes(u.id) ? "bg-amber-100 text-amber-900 font-semibold" : "text-gray-800 hover:bg-gray-50"}`}>
                          <input
                            type="checkbox"
                            id={`resp-edit-${u.id}`}
                            checked={responsablesIds.includes(u.id)}
                            onChange={() => handleToggleResponsable(u.id)}
                            disabled={loading}
                            className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950"
                          />
                          <span className={getRoleColorClass(u)}>{getDisplayName(u)}</span>
                          {isKaizen && <span className="text-xs text-gray-400 ml-auto">(Invitado)</span>}
                        </label>
                      ))}
                      {usuariosFiltrados.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-8">
                          {busqueda ? "No se encontraron resultados." : isKaizen ? "No hay invitados disponibles." : "No hay usuarios en tu departamento."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- COLUMNA 3: DETALLES, EVIDENCIA Y CONFIG --- */}
                <div className="flex flex-col gap-4">

                  {/* EVIDENCIA */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Evidencia</span>
                      <span className={`text-xs ${isFileLimitReached ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {totalFiles}/{MAX_FILES_LIMIT}
                      </span>
                    </label>
                    {/* Lista de Imágenes Existentes */}
                    {imagenesExistentes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Imágenes actuales:</p>
                        <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                          {imagenesExistentes.map((imagen) => (
                            <li key={imagen.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                              <a href={imagen.url} target="_blank" rel="noopener noreferrer">
                                <img src={imagen.url} alt={`Imagen ${imagen.id}`} className="w-10 h-10 object-cover rounded-md" />
                              </a>
                              <span className="flex-1 text-sm text-gray-700 mx-3 truncate">
                                {imagen.url.split("/").pop()?.substring(0, 20)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveImagenExistente(imagen.id)}
                                disabled={loading}
                                className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                                aria-label="Eliminar imagen existente"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Botón de Subida */}
                    <label
                      htmlFor="file-upload"
                      onClick={(e) => {
                        // Deshabilitar clic si está cargando o límite alcanzado
                        if (loading || isFileLimitReached) e.preventDefault();
                      }}
                      className={`w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-900 font-semibold px-4 py-2 rounded-md transition-all duration-200 
                        ${loading || isFileLimitReached
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-amber-200"
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10.5 3.5a.5.5 0 00-1 0V9H4a.5.5 0 000 1h5.5v5.5a.5.5 0 001 0V10H16a.5.5 0 000-1h-5.5V3.5z" clipRule="evenodd" />
                      </svg>
                      <span>{archivos.length > 0 ? "Agregar más" : "Agregar / Tomar Foto"}</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      disabled={loading || isFileLimitReached}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Mensaje de error en línea */}
                    {fileError && (
                      <p className="text-red-600 text-xs mt-1">
                        {fileError}
                      </p>
                    )}

                    {/* Lista de Nuevos Archivos */}
                    {archivos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">{archivos.length} archivo(s) NUEVOS para subir:</p>
                        <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
                          {archivos.map((file, index) => (
                            <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 object-cover rounded-md" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                              <span className="flex-1 text-sm text-gray-700 mx-3 truncate">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveArchivo(index)}
                                disabled={loading}
                                className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50"
                                aria-label="Eliminar archivo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* PRIORIDAD */}
                  <div>
                    <label className="block text-sm font-semibold mb-1">Prioridad</label>
                    <fieldset className="mt-2 grid grid-cols-3 gap-2">
                      {PRIORIDADES_VALIDAS.map((p) => (
                        <div key={p.value}>
                          <input
                            type="radio"
                            id={`prioridad-${p.value}`}
                            name="prioridad-radio-group"
                            value={p.value}
                            checked={prioridad === p.value}
                            onChange={(e) => setPrioridad(e.target.value as Urgencia)}
                            disabled={loading}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`prioridad-${p.value}`}
                            className={`w-full block text-center px-3 py-2 rounded-md border text-sm font-semibold cursor-pointer transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""}
                              ${p.value === "ALTA" && `border-gray-300 bg-gray-50 text-gray-700 peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600 ${!loading && "hover:bg-red-100"}`}
                              ${p.value === "MEDIA" && `border-gray-300 bg-gray-50 text-gray-700 peer-checked:bg-amber-400 peer-checked:text-white peer-checked:border-amber-400 ${!loading && "hover:bg-amber-100"}`}
                              ${p.value === "BAJA" && `border-gray-300 bg-gray-50 text-gray-700 peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600 ${!loading && "hover:bg-blue-100"}`}
                            `}
                          >
                            {p.label}
                          </label>
                        </div>
                      ))}
                    </fieldset>
                    {submitted && !prioridad && (
                      <p className="text-red-600 text-xs mt-1">Debes seleccionar una prioridad.</p>
                    )}
                  </div>

                  {/* FECHA */}
                  <div>
                    <label htmlFor="nueva-fecha" className="block text-sm font-semibold mb-1">Fecha Límite</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="date"
                        id="nueva-fecha"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                        disabled={loading}
                        min={formatDateToInput(new Date())}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                          ${submitted && !getSelectedDate() ? "border-red-500" : "border-gray-300"}`}
                      />
                      <div className="flex items-center gap-4 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
                          <input
                            type="checkbox"
                            checked={usarHora}
                            onChange={(e) => {
                              setUsarHora(e.target.checked);
                              if (!e.target.checked) setHora("");
                            }}
                            disabled={loading}
                            className="w-4 h-4 text-amber-800 border-gray-300 rounded focus:ring-amber-950"
                          />
                          <span>¿Especificar hora límite?</span>
                        </label>
                        {usarHora && (
                          <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            disabled={loading}
                            required={usarHora}
                            className={`flex-1 border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-amber-950 focus:outline-none animate-fade-in
                              ${submitted && ((!hora) || (!isTimeValidForToday())) ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                          />
                        )}
                      </div>
                    </div>
                    {submitted && !getSelectedDate() && (
                      <p className="text-red-600 text-xs mt-1">La fecha límite es obligatoria.</p>
                    )}
                    {submitted && usarHora && !hora && (
                      <p className="text-red-600 text-xs mt-1">Debes seleccionar una hora.</p>
                    )}
                    {/* 🚀 Mensaje de error para hora pasada */}
                    {submitted && usarHora && hora && !isTimeValidForToday() && (
                      <p className="text-red-600 text-xs mt-1">
                        La hora no puede ser anterior a la actual.
                      </p>
                    )}
                  </div>

                  {/* MOTIVO DE CAMBIO */}
                  {fechaHaCambiado && (
                    <div>
                      <label htmlFor="motivo-cambio" className="block text-sm font-semibold mb-1 text-blue-800">
                        Motivo del Cambio de Fecha
                      </label>
                      <select
                        id="motivo-cambio"
                        value={motivoCambio}
                        onChange={(e) => setMotivoCambio(e.target.value)}
                        disabled={loading}
                        required
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-700 focus:outline-none
                          ${submitted && fechaHaCambiado && !motivoCambio ? "border-red-500" : "border-gray-300"}`}
                      >
                        <option value="" disabled>-- Selecciona un motivo --</option>
                        {MOTIVOS_CAMBIO_FECHA.map((motivo) => (
                          <option key={motivo} value={motivo}>{motivo}</option>
                        ))}
                      </select>
                      {submitted && fechaHaCambiado && !motivoCambio && (
                        <p className="text-red-600 text-xs mt-1">El motivo es obligatorio si cambias la fecha.</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

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
              className={`${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"} bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200`}
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