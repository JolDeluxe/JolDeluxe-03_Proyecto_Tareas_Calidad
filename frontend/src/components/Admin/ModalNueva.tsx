// 📍 src/components/Admin/ModalNueva.tsx

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

import { tareasService } from "../../api/tareas.service";
import { usuariosService } from "../../api/usuarios.service";
import type { Tarea, Estatus, Urgencia } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface ModalNuevaProps {
  onClose: () => void;
  onTareaAgregada: () => void;
  user: Usuario | null;
  tarea?: Tarea;
}

const MAX_NOMBRE_LENGTH = 50;
const MAX_OBSERVACIONES_LENGTH = 160;
const MAX_FILES_LIMIT = 5;

// --- Helper para formatear Date a YYYY-MM-DD (Local) ---
const formatDateToInput = (fecha?: Date | null): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return "";
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const getKaizenPrefix = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );

  return `KAIZEN ${year}${month}${week}`;
};

const PRIORIDADES_VALIDAS: { value: Urgencia; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

const ModalNueva: React.FC<ModalNuevaProps> = ({
  onClose,
  onTareaAgregada,
  user,
}) => {
  const mouseDownInside = useRef(false);
  // --- Estados del formulario ---
  const [nombre, setNombre] = useState("");
  const [isKaizen, setIsKaizen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [prioridad, setPrioridad] = useState<Urgencia | "">("");

  // ⏰ ESTADOS DE FECHA Y HORA
  const [fecha, setFecha] = useState("");
  const [usarHora, setUsarHora] = useState(false);
  const [hora, setHora] = useState("");

  const [archivos, setArchivos] = useState<File[]>([]);
  // Nuevo estado para el error de archivos
  const [fileError, setFileError] = useState("");

  // --- Estados de Datos ---
  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaInvitados, setListaInvitados] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  // 🚨 Estado para controlar error de carga de usuarios
  const [errorUsuarios, setErrorUsuarios] = useState(false);

  // --- Estado para búsqueda ---
  const [busqueda, setBusqueda] = useState("");

  // --- Estados de UI ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ✅ NUEVA LÓGICA DE VISUALIZACIÓN DE NOMBRES
  const getDisplayName = (userToDisplay: Usuario): string => {
    if (isKaizen) {
      return userToDisplay.nombre;
    }
    // Etiquetas globales para todos los departamentos
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return `${userToDisplay.nombre} (Supervisión)`;
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return `${userToDisplay.nombre} (Operativo)`;
    }
    return userToDisplay.nombre;
  };

  // ✅ NUEVA LÓGICA DE COLORES (Azul y Rosa)
  const getRoleColorClass = (userToDisplay: Usuario): string => {
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return "text-blue-700 font-semibold"; // Azul Supervisión
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return "text-rose-700 font-semibold"; // Rosa Operativo
    }
    return "text-gray-800";
  };

  // --- Cargar usuarios (Con nuevas reglas de filtrado y ordenamiento) ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;

      setLoadingUsuarios(true);
      setErrorUsuarios(false); // Resetear error al iniciar
      try {
        // Obtenemos TODOS los usuarios (límite alto para dropdown)
        const responseUsuarios = await usuariosService.getAll({ limit: 1000 });
        const todosLosUsuarios = responseUsuarios.data;

        // Separamos en dos listas: Internos e Invitados
        const internos = todosLosUsuarios.filter(u => u.rol !== Rol.INVITADO);
        const invitados = todosLosUsuarios.filter(u => u.rol === Rol.INVITADO);

        // ✅ REGLAS DE VISIBILIDAD (FILTRADO)
        let usuariosVisibles = [];

        if (user.rol === Rol.ADMIN) {
          // Admin ve: ENCARGADOS y USUARIOS. (No ve otros Admins)
          usuariosVisibles = internos.filter(u =>
            u.rol === Rol.ENCARGADO || u.rol === Rol.USUARIO
          );
        } else if (user.rol === Rol.ENCARGADO) {
          // Encargado ve: ENCARGADOS y USUARIOS. (No ve Admins)
          usuariosVisibles = internos.filter(u =>
            u.rol === Rol.ENCARGADO || u.rol === Rol.USUARIO
          );
        } else {
          // Fallback para SuperAdmin u otros (ven todo)
          usuariosVisibles = internos;
        }

        // ✅ REGLAS DE ORDENAMIENTO (SORTING)
        const sortedUsers = usuariosVisibles.sort((a, b) => {
          const rolA = a.rol;
          const rolB = b.rol;

          // Si soy ENCARGADO, quiero ver primero a los USUARIOS (Operativos)
          if (user.rol === Rol.ENCARGADO) {
            if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return -1; // Usuario antes
            if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return 1;
          }
          // Si soy ADMIN (o cualquier otro), jerarquía normal: ENCARGADO -> USUARIO
          else {
            if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return -1; // Encargado antes
            if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return 1;
          }

          // Orden secundario: Alfabético
          return a.nombre.localeCompare(b.nombre);
        });

        setListaUsuarios(sortedUsers);
        setListaInvitados(
          invitados.sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setErrorUsuarios(true); // 🚨 Activar estado de error
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, [user]);

  // --- Handlers de Validación ---
  const isDateValid = () => {
    if (!fecha) return false;
    const dateObj = new Date(fecha);
    return !isNaN(dateObj.getTime());
  };

  // 🚀 Validación: Si es HOY, la hora no puede ser pasada
  const isTimeValidForToday = () => {
    if (!usarHora || !hora || !fecha) return true; // Si no usa hora, es válido (va a 23:59)

    const now = new Date();
    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);

    // Comparar solo fechas (sin hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    // Si la fecha seleccionada es FUTURA, cualquier hora es válida
    if (fechaSeleccionada.getTime() > today.getTime()) return true;

    // Si la fecha es HOY, validamos la hora
    if (fechaSeleccionada.getTime() === today.getTime()) {
      const [h, m] = hora.split(":").map(Number);
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (h < currentH || (h === currentH && m < currentM)) {
        return false; // Hora ya pasó
      }
    }
    return true;
  };


  // --- Manejadores de Archivos ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileError(""); // Limpiar error al intentar subir
      const nuevosArchivos = Array.from(e.target.files);
      const TAMANO_MAXIMO = 20 * 1024 * 1024;
      const archivoPesado = nuevosArchivos.find(file => file.size > TAMANO_MAXIMO);

      if (archivoPesado) {
        // Error se muestra inline abajo
        setFileError(`⚠️ El archivo "${archivoPesado.name}" pesa más de 20MB.`);
        e.target.value = "";
        return;
      }

      // Validación cambiada: mensaje inline en lugar de toast
      if (archivos.length + nuevosArchivos.length > MAX_FILES_LIMIT) {
        setFileError(`Solo puedes subir un máximo de ${MAX_FILES_LIMIT} archivos.`);
        e.target.value = "";
        return;
      }

      setArchivos((prev) => [...prev, ...nuevosArchivos]);
      e.target.value = "";
    }
  };

  const handleRemoveArchivo = (indexToRemove: number) => {
    setArchivos((prevArchivos) =>
      prevArchivos.filter((_, index) => index !== indexToRemove)
    );
    setFileError(""); // Limpiar error si se elimina un archivo
  };

  const handleToggleResponsable = (id: number) => {
    setResponsablesIds((prev) =>
      prev.includes(id)
        ? prev.filter((uid) => uid !== id)
        : [...prev, id]
    );
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_NOMBRE_LENGTH) {
      setNombre(newValue);
    } else {
      // Si se pasa, cortamos y mostramos en UI (opcionalmente) o simplemente no dejamos escribir más
      // Aquí simplemente cortamos
      setNombre(newValue.slice(0, MAX_NOMBRE_LENGTH));
    }
  };

  // --- handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Validaciones
    const nombreValido = nombre && nombre.trim().length > 0 && nombre.length <= MAX_NOMBRE_LENGTH;
    const responsablesValidos = responsablesIds.length > 0;
    const prioridadValida = !!prioridad;
    const fechaValida = isDateValid();
    const comentarioValido = comentario && comentario.trim().length > 0 && comentario.length <= MAX_OBSERVACIONES_LENGTH;
    const horaValida = !usarHora || (usarHora && !!hora);
    const tiempoValido = isTimeValidForToday();
    const kaizenValido = !isKaizen || (isKaizen && responsablesIds.length > 0); // Validación redundante con responsablesValidos pero explícita para lógica

    if (
      !nombreValido ||
      !responsablesValidos ||
      !prioridadValida ||
      !fechaValida ||
      !comentarioValido ||
      !horaValida ||
      !tiempoValido ||
      !kaizenValido
    ) {
      // Si hay errores, no hacemos nada (los mensajes se muestran inline)
      return;
    }

    setLoading(true);

    if (!user) {
      toast.error("Error de autenticación. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    if (user.rol === Rol.SUPER_ADMIN) {
      toast.error(
        "El SUPER_ADMIN (aún) no puede crear tareas desde este modal."
      );
      setLoading(false);
      return;
    }

    if (!user.departamentoId) {
      toast.error(
        "Error de autenticación: No se pudo identificar tu departamento."
      );
      setLoading(false);
      return;
    }

    try {
      let tituloFinal = nombre;
      if (isKaizen) {
        if (!tituloFinal.startsWith("KAIZEN")) {
          tituloFinal = `${getKaizenPrefix()} ${nombre}`;
        }
      }

      // ⏰ CONSTRUCCIÓN DE FECHA LÍMITE
      let fechaLimiteFinal: Date;
      if (usarHora && hora) {
        fechaLimiteFinal = new Date(`${fecha}T${hora}:00`);
      } else {
        fechaLimiteFinal = new Date(`${fecha}T23:59:59`);
      }

      if (isNaN(fechaLimiteFinal.getTime())) {
        // Este caso es raro dado las validaciones previas, pero por seguridad
        toast.error("Fecha u hora inválida.");
        setLoading(false);
        return;
      }

      const nuevaTareaPayload = {
        tarea: tituloFinal,
        observaciones: comentario || null,
        urgencia: prioridad,
        fechaLimite: fechaLimiteFinal.toISOString(),
        estatus: "PENDIENTE" as Estatus,
        departamentoId: user.departamentoId,
        responsables: responsablesIds,
      };

      console.log("📨 PASO 1: Creando tarea...", nuevaTareaPayload);

      const tareaCreada = await tareasService.create(nuevaTareaPayload as any);
      console.log(`✅ Tarea creada con ID: ${tareaCreada.id}`);

      if (archivos.length > 0) {
        console.log(`Subiendo ${archivos.length} imágenes...`);
        const formData = new FormData();
        archivos.forEach((file) => {
          formData.append("imagenes", file);
        });
        await tareasService.uploadImage(tareaCreada.id, formData);
        console.log(`✅ Imágenes subidas para Tarea ID: ${tareaCreada.id}`);
      }

      toast.success("Tarea creada correctamente.");
      onTareaAgregada();
      onClose();
    } catch (error: any) {
      console.error(
        "❌ Error en el proceso de creación:",
        error.response?.data || error.message
      );
      const isUploadError = error.config?.url.includes("/upload");

      if (isUploadError) {
        toast.error("Tarea creada, pero falló la subida de imágenes.");
        onTareaAgregada();
        onClose();
      } else {
        const mensajeError =
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

  // Determinar si se alcanzó el límite de archivos
  const isMaxFilesReached = archivos.length >= MAX_FILES_LIMIT;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      // ✅ Quitamos onClick y agregamos los eventos del mouse
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
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] md:max-w-md lg:max-w-6xl relative flex flex-col max-h-[90vh]"
        // ✅ Agregamos onMouseDown a la caja blanca
        onMouseDown={() => {
          mouseDownInside.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold cursor-pointer"
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ×
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center">
            NUEVA TAREA
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-grow min-h-0"
          noValidate
        >
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">

              {/* --- HEADER: TIPO DE TAREA (KAIZEN) --- */}
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
                        setBusqueda("");
                      }}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${!isKaizen
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Tarea Estándar
                    </button>
                    <button
                      type="button"
                      disabled={true}
                      title="Módulo en mantenimiento"
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all 
                        bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent`}
                    >
                      Tarea KAIZEN
                    </button>
                  </div>
                )}

              {/* --- BODY: GRID DE 3 COLUMNAS EN DESKTOP --- */}
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">

                {/* --- COLUMNA 1: INFO BÁSICA --- */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Nombre</span>
                      <span className={`text-xs ${nombre.length > MAX_NOMBRE_LENGTH ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
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
                    ${submitted && !nombre.trim()
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

                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Indicaciones</span>
                      <span className={`text-xs ${comentario.length > MAX_OBSERVACIONES_LENGTH ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {comentario.length}/{MAX_OBSERVACIONES_LENGTH}
                      </span>
                    </label>
                    <textarea
                      value={comentario}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue.length <= MAX_OBSERVACIONES_LENGTH) {
                          setComentario(newValue);
                        } else {
                          setComentario(newValue.slice(0, MAX_OBSERVACIONES_LENGTH));
                        }
                      }}
                      placeholder="Agrega indicaciones o detalles..."
                      disabled={loading}
                      required
                      className={`w-full border rounded-md px-3 py-2 h-20 lg:h-40 resize-none focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100
                    ${submitted && !comentario.trim()
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
                </div>

                {/* --- COLUMNA 2: RESPONSABLES --- */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="responsable-list"
                      className="block text-sm font-semibold mb-1"
                    >
                      {isKaizen ? "Selecciona Invitado(s)" : "Responsable(s)"}
                    </label>

                    <input
                      type="text"
                      placeholder="Buscar usuario..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      disabled={loading || loadingUsuarios}
                      className="w-full border rounded-md px-3 py-2 mb-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100"
                    />

                    {loadingUsuarios ? (
                      <div
                        className="relative w-full h-32 lg:h-64 border rounded-md px-3 py-2 
                    bg-gray-100 border-gray-300 
                    flex items-center justify-center"
                      >
                        <p className="text-gray-500">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <div
                        id="responsable-list"
                        className={`relative w-full h-32 lg:h-64 border rounded-md 
                      overflow-y-auto 
                      focus:ring-2 focus:ring-amber-950 focus:outline-none 
                      ${submitted && responsablesIds.length === 0
                            ? "border-red-500"
                            : "border-gray-300"
                          }
                    `}
                        tabIndex={0}
                      >
                        {usuariosFiltrados.map((u) => (
                          <label
                            key={u.id}
                            htmlFor={`resp-${u.id}`}
                            className={`
                          flex items-center gap-3 w-full px-3 py-2 
                          cursor-pointer transition-colors
                          ${responsablesIds.includes(u.id)
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
                            <span className={getRoleColorClass(u)}>
                              {getDisplayName(u)}
                            </span>

                            {isKaizen && (
                              <span className="text-xs text-gray-400 ml-auto">
                                (Invitado)
                              </span>
                            )}
                          </label>
                        ))}

                        {/* 🚨 Mensaje de error o de lista vacía */}
                        {usuariosFiltrados.length === 0 && (
                          <p className={`text-center text-sm py-4 ${errorUsuarios ? "text-red-600 font-bold" : "text-gray-500"}`}>
                            {errorUsuarios
                              ? "Error al cargar usuarios"
                              : busqueda
                                ? "No se encontraron resultados."
                                : isKaizen
                                  ? "No se encontraron invitados registrados."
                                  : "No hay usuarios disponibles."}
                          </p>
                        )}
                      </div>
                    )}

                    {submitted && responsablesIds.length === 0 && (
                      <p className="text-red-600 text-xs mt-1">
                        Debes seleccionar al menos un responsable.
                      </p>
                    )}
                  </div>
                </div>

                {/* --- COLUMNA 3: DETALLES Y EVIDENCIA --- */}
                <div className="flex flex-col gap-4">

                  {/* EVIDENCIA */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Evidencia (Opcional)</span>
                      <span className={`text-xs ${isMaxFilesReached ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {archivos.length}/{MAX_FILES_LIMIT}
                      </span>
                    </label>
                    <label
                      htmlFor="file-upload"
                      onClick={(e) => {
                        // Deshabilitar clic si está cargando o si ya se alcanzó el límite
                        if (loading || isMaxFilesReached) e.preventDefault();
                      }}
                      className={`w-full flex items-center justify-center gap-2 
                    bg-amber-100 text-amber-900 
                    font-semibold px-4 py-2 rounded-md 
                    transition-all duration-200
                    ${loading || isMaxFilesReached
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
                      disabled={loading || isMaxFilesReached}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Mensaje de error tipo texto abajo del input */}
                    {fileError && (
                      <p className="text-red-600 text-xs mt-1">{fileError}</p>
                    )}

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

                  {/* PRIORIDAD */}
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
                          
                          ${p.value === "ALTA" &&
                              `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600
                            ${!loading && "hover:bg-red-100 hover:text-gray-700"
                              }
                          `
                              }
                          ${p.value === "MEDIA" &&
                              `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-amber-400 peer-checked:text-white peer-checked:border-amber-400
                            ${!loading &&
                              "hover:bg-amber-100 hover:text-gray-700"
                              }
                          `
                              }
                          ${p.value === "BAJA" &&
                              `
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600
                            ${!loading &&
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

                    {submitted && !prioridad && (
                      <p className="text-red-600 text-xs mt-1">
                        Debes seleccionar una prioridad.
                      </p>
                    )}
                  </div>

                  {/* FECHA LIMITE - OPCIÓN 1 */}
                  <div>
                    <label
                      htmlFor="nueva-fecha"
                      className="block text-sm font-semibold mb-1"
                    >
                      Fecha Límite
                    </label>

                    <div className="flex flex-col gap-3">
                      {/* Contenedor responsivo: apilado en móvil, lado a lado en escritorio */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <input
                            type="date"
                            id="nueva-fecha"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            required
                            disabled={loading}
                            min={formatDateToInput(new Date())}
                            className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed
                              ${submitted && !isDateValid()
                                ? "border-red-500"
                                : "border-gray-300"
                              }
                            `}
                          />
                        </div>

                        {usarHora && (
                          <div className="flex-1 animate-fade-in">
                            <input
                              type="time"
                              value={hora}
                              onChange={(e) => setHora(e.target.value)}
                              disabled={loading}
                              required={usarHora}
                              className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none
                                ${submitted && ((!hora) || (!isTimeValidForToday()))
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                                }
                              `}
                            />
                          </div>
                        )}
                      </div>

                      {/* Checkbox en una línea independiente */}
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none w-fit">
                        <input
                          type="checkbox"
                          checked={usarHora}
                          onChange={(e) => {
                            setUsarHora(e.target.checked);
                            if (!e.target.checked) setHora("");
                          }}
                          disabled={loading}
                          className="w-4 h-4 text-amber-800 border-gray-300 rounded focus:ring-amber-950 cursor-pointer"
                        />
                        <span className="font-medium">¿Especificar hora límite?</span>
                      </label>
                    </div>

                    {/* Mensajes de Validación Unificados */}
                    <div className="mt-1">
                      {submitted && !isDateValid() && (
                        <p className="text-red-600 text-xs mt-1">La fecha límite es obligatoria.</p>
                      )}
                      {submitted && usarHora && !hora && (
                        <p className="text-red-600 text-xs mt-1">Debes seleccionar una hora.</p>
                      )}
                      {submitted && usarHora && hora && !isTimeValidForToday() && (
                        <p className="text-red-600 text-xs mt-1">La hora no puede ser anterior a la actual.</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        {usarHora
                          ? "Se requiere entrega antes de la hora exacta."
                          : "Se considera 'A Tiempo' hasta el final del día (23:59)."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700 cursor-pointer"
                } bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNueva;