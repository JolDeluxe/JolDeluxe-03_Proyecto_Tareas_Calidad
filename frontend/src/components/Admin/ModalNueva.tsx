import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

import { tareasService } from "../../api/tareas.service";
import { usuariosService } from "../../api/usuarios.service";
import type { Tarea, Estatus, Urgencia } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";
import api from "../../api/01_axiosInstance";

interface ModalNuevaProps {
  onClose: () => void;
  onTareaAgregada: () => void;
  user: Usuario | null;
  tarea?: Tarea;
}

const MAX_NOMBRE_LENGTH = 50;
const MAX_OBSERVACIONES_LENGTH = 160;

// --- Helper para formatear Date a YYYY-MM-DD ---
const formatDateToInput = (fecha?: Date | null): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return "";
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const getKaizenPrefix = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // '25'
  const month = String(now.getMonth() + 1).padStart(2, "0"); // '11'

  // Cálculo de semana simple
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );

  return `KAIZEN ${year}${month}${week}`;
};

// --- Constante de Prioridades ---
const PRIORIDADES_VALIDAS: { value: Urgencia; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

// --- 3. 🚀 Componente principal aceptando 'user' ---
const ModalNueva: React.FC<ModalNuevaProps> = ({
  onClose,
  tarea,
  onTareaAgregada,
  user, // 👈 Se recibe el usuario logueado
}) => {
  // --- Estados del formulario ---
  const [nombre, setNombre] = useState("");
  const [isKaizen, setIsKaizen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [prioridad, setPrioridad] = useState<Urgencia | "">("");
  const [fecha, setFecha] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);

  // --- 4. 🚀 ESTADOS DE DATOS REALES ---
  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaInvitados, setListaInvitados] = useState<Usuario[]>([]); // Para tareas Kaizen
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  // --- Estados de UI ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isUserInCalidad = user?.departamento?.nombre
    ?.toUpperCase()
    .includes("CALIDAD");

  const getDisplayName = (userToDisplay: Usuario): string => {
    // 1. Si es Kaizen o el usuario logueado no es de Calidad, no se aplica el sufijo especial.
    if (isKaizen || !isUserInCalidad) {
      return userToDisplay.nombre;
    }

    // 2. Si la tarea es estándar Y el usuario logueado es de Calidad, aplicamos el sufijo.
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return `${userToDisplay.nombre} (Coordinador)`;
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return `${userToDisplay.nombre} (Inspector)`;
    }

    return userToDisplay.nombre;
  };

  /**
   * 🆕 NUEVA FUNCIÓN: Devuelve la clase de color basada en el rol.
   */
  const getRoleColorClass = (userToDisplay: Usuario): string => {
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return "text-blue-600 font-semibold"; // Azul fuerte para ENCARGADO
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return "text-red-700 font-semibold"; // Rojo Oscuro/Ginda para USUARIO
    }
    return "";
  };

  // --- 5. 🚀 Cargar usuarios reales al abrir el modal (MODIFICADO) ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;

      setLoadingUsuarios(true);
      try {
        // 1. 🚨 LÓGICA DE FETCHING POR ROL (ya implementada)
        let mainUsersPromise: Promise<Usuario[]>;

        switch (user.rol) {
          case Rol.ADMIN:
            // ADMIN puede asignar a ENCARGADO y USUARIO
            mainUsersPromise = usuariosService.getEncargadosYUsuarios();
            break;
          case Rol.ENCARGADO:
            // ENCARGADO solo puede asignar a USUARIO
            mainUsersPromise = usuariosService.getUsuarios();
            break;
          default:
            mainUsersPromise = usuariosService.getAll();
        }

        // ✅ USAMOS PROMISE.ALL para cargar ambas listas a la vez
        const [usersData, invitadosData] = await Promise.all([
          mainUsersPromise, // <-- Lista filtrada por rol
          usuariosService.getInvitados(), // <-- Invitados se queda igual
        ]);

        // 2. 🚀 ORDENAMIENTO: ENCARGADO antes que USUARIO
        const sortedUsers = usersData.sort((a, b) => {
          const rolA = a.rol;
          const rolB = b.rol;

          // Regla: ENCARGADO (antes) antes que USUARIO (después)
          if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return -1;
          if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return 1;

          // Orden alfabético por nombre para los demás (mismo rol o rol no especificado)
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
  }, [user]);

  // --- Handlers de DatePicker ---
  const getSelectedDate = () => {
    if (!fecha) return null;
    const dateObj = new Date(`${fecha}T00:00:00.000Z`);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  };

  const handleDateChange = (date: Date | null) => {
    setFecha(formatDateToInput(date));
  };

  // --- Handlers de Archivos ---
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

  // ❌ ELIMINADO
  // const handleToggleResponsable = (id: number) => { ... };

  // --- ✅ NUEVA FUNCIÓN (Soluciona el error) ---
  /**
   * Manejador para el <select multiple> nativo.
   * Lee todas las opciones seleccionadas y actualiza el estado.
   */
  const handleToggleResponsable = (id: number) => {
    setResponsablesIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((uid) => uid !== id) // Quitar de la lista
          : [...prev, id] // Agregar a la lista
    );
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_NOMBRE_LENGTH) {
      setNombre(newValue);
    } else {
      // Trunca el valor si se pega texto largo
      setNombre(newValue.slice(0, MAX_NOMBRE_LENGTH));
      toast.warn(`Máximo ${MAX_NOMBRE_LENGTH} caracteres para el nombre.`);
    }
  };

  // --- 7. 🚀 handleSubmit TOTALMENTE REFACTORIZADO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // 1. Validación (usando la lógica de estados nueva)
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

    // Validación de longitud de nombre (doble chequeo)
    if (nombre.length > MAX_NOMBRE_LENGTH) {
        toast.error(`El Nombre excede el máximo permitido (${MAX_NOMBRE_LENGTH}).`);
        setLoading(false);
        return;
    }

    if (comentario.length > MAX_OBSERVACIONES_LENGTH) {
      // Aunque el input lo restringe, esta es una capa extra de seguridad (ej. si se inyecta por consola)
      toast.error(`El texto de Indicaciones excede el máximo permitido (${MAX_OBSERVACIONES_LENGTH}).`);
      setLoading(false);
      return;
    }

    // ✅ NUEVA VALIDACIÓN KAIZEN: Si es Kaizen, fuerza a que haya invitados
    if (isKaizen && responsablesIds.length === 0) {
      toast.error("Las tareas Kaizen requieren seleccionar un Invitado.");
      return;
    }

    setLoading(true);

    // 2. 🚨 VALIDACIÓN DE DEPARTAMENTO (SOLUCIÓN AL ERROR)
    if (!user) {
      toast.error("Error de autenticación. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // Temporalmente, el SUPER_ADMIN no puede crear tareas sin un selector de Depto.
    if (user.rol === Rol.SUPER_ADMIN) {
      toast.error(
        "El SUPER_ADMIN (aún) no puede crear tareas desde este modal."
      );
      setLoading(false);
      return;
    }

    // Si no es SUPER_ADMIN, DEBE tener un departamentoId
    if (!user.departamentoId) {
      toast.error(
        "Error de autenticación: No se pudo identificar tu departamento."
      );
      setLoading(false);
      return;
    }
    // A este punto, TypeScript sabe que 'user.departamentoId' es 'number'

    try {
      // ✅ LÓGICA DE NOMBRE KAIZEN
      let tituloFinal = nombre;
      if (isKaizen) {
        // Si el usuario no escribió el código manualmente, se lo agregamos nosotros
        if (!tituloFinal.startsWith("KAIZEN")) {
          tituloFinal = `${getKaizenPrefix()} ${nombre}`;
        }
      }

      // 3. Payload de la Tarea (CORRECTO)
      const nuevaTareaPayload = {
        tarea: tituloFinal, // 👈 USAMOS EL TÍTULO MODIFICADO
        observaciones: comentario || null,
        urgencia: prioridad,
        fechaLimite: new Date(`${fecha}T12:00:00.000Z`).toISOString(),
        estatus: "PENDIENTE" as Estatus,
        departamentoId: user.departamentoId,
        responsables: responsablesIds,
      };

      console.log("📨 PASO 1: Creando tarea...", nuevaTareaPayload);

      // 4. PASO 1: Crear la Tarea (usando el servicio)
      const tareaCreada = await tareasService.create(nuevaTareaPayload as any);
      console.log(`✅ Tarea creada con ID: ${tareaCreada.id}`);

      // 5. PASO 2: Subir Imágenes (si existen)
      if (archivos.length > 0) {
        console.log(`Subiendo ${archivos.length} imágenes...`);
        const formData = new FormData();
        // Asegúrese de que la clave sea "imagenes"
        archivos.forEach((file) => {
          formData.append("imagenes", file);
        });

        // 🚀 CORRECCIÓN: Usar el servicio que implementa la llamada a /upload
        await tareasService.uploadImage(tareaCreada.id, formData);

        console.log(`✅ Imágenes subidas para Tarea ID: ${tareaCreada.id}`);
      }

      // 6. PASO 3: Finalizar
      toast.success("Tarea creada correctamente.");
      onTareaAgregada();
      onClose();
    } catch (error: any) {
      console.error(
        "❌ Error en el proceso de creación:",
        error.response?.data || error.message
      );
      // La lógica de verificación de error sigue siendo válida ya que Axios
      // aún reportará la URL del servicio de subida.
      const isUploadError = error.config?.url.includes("/upload");

      if (isUploadError) {
        toast.error("Tarea creada, pero falló la subida de imágenes.");
        onTareaAgregada();
        onClose();
      } else {
        const mensajeError =
          error.response?.data?.message || // Zod usa 'message'
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
      {/* 1. PANEL (Sin cambios) */}
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 2. HEADER (Sin cambios) */}
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

        {/* 3. FORMULARIO (Sin cambios) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0"
          noValidate
        >
          {/* 4. BODY (Scrollable) */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">
              {/* ✅ NUEVO: SWITCH DE TIPO DE TAREA (Solo Calidad/Admin) */}
              {/* Ajusta la condición "CALIDAD" según el nombre exacto en tu BD */}
              {(user?.rol === "SUPER_ADMIN" ||
                ((user?.rol === "ADMIN" || user?.rol === "ENCARGADO") &&
                  user?.departamento?.nombre
                    ?.toUpperCase()
                    .includes("CALIDAD"))) && (
                <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsKaizen(false);
                      setResponsablesIds([]);
                    }}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                      !isKaizen
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tarea Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsKaizen(true);
                      setResponsablesIds([]);
                    }}
                    className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                      isKaizen
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tarea KAIZEN
                  </button>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1 flex justify-between">
                  <span>Nombre</span>
                    {/* 🎯 NUEVO CONTADOR PARA EL NOMBRE */}
                  <span className={`text-xs ${nombre.length > MAX_NOMBRE_LENGTH ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {nombre.length}/{MAX_NOMBRE_LENGTH}
                  </span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={handleNombreChange} // 🎯 Usamos el nuevo handler
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

              {/* Indicaciones (Sin cambios) */}
              <div>
                <label className="block text-sm font-semibold mb-1 flex justify-between">
                  <span>Indicaciones</span>
                  {/* 🎯 CONTADOR DE CARACTERES */}
                  <span className={`text-xs ${comentario.length > MAX_OBSERVACIONES_LENGTH ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {comentario.length}/{MAX_OBSERVACIONES_LENGTH}
                  </span>
                </label>
                <textarea
                  value={comentario}
                  // 🎯 LÓGICA DE LÍMITE DE CARACTERES EN EL FRONTEND
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= MAX_OBSERVACIONES_LENGTH) {
                      setComentario(newValue);
                    } else {
                      // Si se pega texto largo, se trunca para no exceder el límite visual y lógico.
                      setComentario(newValue.slice(0, MAX_OBSERVACIONES_LENGTH));
                      toast.warn(`Máximo ${MAX_OBSERVACIONES_LENGTH} caracteres permitidos.`);
                    }
                  }}
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

              {/* Evidencia (Sin cambios) */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Evidencia (Opcional)
                </label>
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
                  disabled={loading}
                  onChange={handleFileChange}
                  className="hidden"
                />
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
                  htmlFor="responsable-list"
                  className="block text-sm font-semibold mb-1"
                >
                  {/* Cambiamos el texto dinámicamente */}
                  {isKaizen ? "Selecciona Invitado(s)" : "Responsable(s)"}
                </label>

                {loadingUsuarios ? (
                  // Placeholder (un esqueleto)
                  <div
                    className="relative w-full h-32 border rounded-md px-3 py-2 
                  bg-gray-100 border-gray-300 
                  flex items-center justify-center"
                  >
                    <p className="text-gray-500">Cargando usuarios...</p>
                  </div>
                ) : (
                  // Contenedor de la lista con scroll
                  <div
                    id="responsable-list"
                    // 🔹 Damos una altura fija (h-32) y lo hacemos scrollable
                    className={`relative w-full h-32 border rounded-md 
                      overflow-y-auto 
                      focus:ring-2 focus:ring-amber-950 focus:outline-none 
                      ${
                        // Validación (igual que antes)
                        submitted && responsablesIds.length === 0
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    `}
                    // tabIndex para que sea navegable con teclado
                    tabIndex={0}
                  >
                    {/* ✅ LÓGICA CORREGIDA: 
                        Usamos la lista adecuada según el modo (Kaizen = listaInvitados, Normal = listaUsuarios) 
                    */}
                    {(isKaizen ? listaInvitados : listaUsuarios).map((u) => (
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
                        {/* 🚨 CAMBIO AQUÍ: Aplicar la clase de color */}
                        <span className={getRoleColorClass(u)}>
                          {getDisplayName(u)}
                        </span>

                        {/* Etiqueta visual extra para confirmar rol en modo Kaizen */}
                        {isKaizen && (
                          <span className="text-xs text-gray-400 ml-auto">
                            (Invitado)
                          </span>
                        )}
                      </label>
                    ))}

                    {/* Mensaje si la lista correspondiente está vacía */}
                    {(isKaizen ? listaInvitados : listaUsuarios).length ===
                      0 && (
                      <p className="text-center text-sm text-gray-500 py-4">
                        {isKaizen
                          ? "No se encontraron invitados registrados."
                          : "No hay usuarios disponibles."}
                      </p>
                    )}
                  </div>
                )}

                {/* Mensaje de error (esto no cambia) */}
                {submitted && responsablesIds.length === 0 && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar al menos un responsable.
                  </p>
                )}
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Prioridad
                </label>
                <fieldset className="mt-2 grid grid-cols-3 gap-2">
                  {PRIORIDADES_VALIDAS.map((p) => (
                    <div key={p.value}>
                      {/* El input real está oculto, pero controla el estado */}
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
                        className="sr-only peer" // 👈 Oculto, pero accesible
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
                            ${
                              !loading && "hover:bg-red-100 hover:text-gray-700"
                            }
                          `
                          }
                          ${
                            p.value === "MEDIA" &&
                            `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-amber-400 peer-checked:text-white peer-checked:border-amber-400
                            ${
                              !loading &&
                              "hover:bg-amber-100 hover:text-gray-700"
                            }
                          `
                          }
                          ${
                            p.value === "BAJA" &&
                            `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600
                            ${
                              !loading &&
                              "hover:bg-green-100 hover:text-gray-700"
                            }
                          `
                          }
                        `}
                      >
                        {p.label}
                      </label>
                    </div>
                  ))}
                </fieldset>

                {/* El mensaje de error sigue funcionando igual */}
                {submitted && !prioridad && (
                  <p className="text-red-600 text-xs mt-1">
                    Debes seleccionar una prioridad.
                  </p>
                )}
              </div>

              {/* Fecha Límite (Sin cambios, estaba bien) */}
              <div>
                <label
                  htmlFor="nueva-fecha"
                  className="block text-sm font-semibold mb-1"
                >
                  Fecha Límite
                </label>

                {/* Usamos un input[type="date"] nativo.
                  Esto mostrará el selector de calendario nativo
                  en iOS, Android y Escritorio.
                */}
                <input
                  type="date"
                  id="nueva-fecha"
                  value={fecha} // El estado 'fecha' ya está en formato YYYY-MM-DD
                  // 2. 🔹 El handler es más simple: actualiza el estado directamente
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  disabled={loading}
                  // 3. 🔹 Usamos la función helper para establecer la fecha mínima de hoy
                  min={formatDateToInput(new Date())}
                  // 4. 🔹 Mismos estilos de Tailwind y lógica de validación
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${
                    // La validación sigue funcionando, 'getSelectedDate' devuelve null si 'fecha' está vacío
                    submitted && !getSelectedDate()
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
                />

                {/* El mensaje de error sigue funcionando con 'getSelectedDate' */}
                {submitted && !getSelectedDate() && (
                  <p className="text-red-600 text-xs mt-1">
                    La fecha límite es obligatoria.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5. FOOTER (Sin cambios) */}
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

      {/* Modal Prioridad Picker (Sin cambios) */}
      {/* {isPrioridadModalOpen && <ModalPrioridadPicker />} */}
    </div>
  );
};

export default ModalNueva;
