// 📍 src/components/Admin/ModalEditar.tsx

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

import { tareasService } from "../../api/tareas.service";
import { usuariosService } from "../../api/usuarios.service";
import type { Tarea, Urgencia } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface ModalEditarProps {
  onClose: () => void;
  onSuccess: () => void;
  tarea: Tarea;
  user: Usuario | null;
}

const MAX_NOMBRE_LENGTH = 50;
const MAX_OBSERVACIONES_LENGTH = 160;
const MAX_FILES_LIMIT = 5;

// --- Helper para formatear Date a YYYY-MM-DD (Local) ---
const formatDateToInput = (fecha?: Date | string | null): string => {
  if (!fecha) return "";
  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isNaN(dateObj.getTime())) return "";

  const anio = dateObj.getFullYear();
  const mes = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dia = String(dateObj.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const PRIORIDADES_VALIDAS: { value: Urgencia; label: string }[] = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

export const MOTIVOS_CAMBIO_FECHA = [
  "Solicitud del responsable",
  "Cambio de prioridades",
  "Ajuste de planificación",
  "Ampliación del alcance de la tarea",
  "Error en la estimación de tiempo inicial",
  "Falta de información/recursos",
  "Espera de autorización/Visto bueno",
  "Retraso en tarea previa",
  "Retraso imputable al responsable",
  "Ausencia o baja médica del personal",
  "Sobrecarga de trabajo asignado",
  "Incidencia técnica o falla de equipo",
  "Retraso por parte de terceros",
  "Condiciones externas / Fuerza mayor",
];

const ModalEditar: React.FC<ModalEditarProps> = ({
  onClose,
  onSuccess,
  tarea,
  user,
}) => {
  // --- Estados del formulario ---
  const [nombre, setNombre] = useState("");
  const [comentario, setComentario] = useState("");
  const [prioridad, setPrioridad] = useState<Urgencia | "">("");

  // ⏰ ESTADOS DE FECHA Y HORA
  const [fecha, setFecha] = useState("");
  const [usarHora, setUsarHora] = useState(false);
  const [hora, setHora] = useState("");

  // --- Estados para el motivo de cambio ---
  const [fechaStringOriginal, setFechaStringOriginal] = useState("");
  const [motivo, setMotivo] = useState("");

  // --- Estados de Archivos ---
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<any[]>([]);
  const [imagenesAEliminar, setImagenesAEliminar] = useState<number[]>([]);

  const [fileError, setFileError] = useState("");

  // --- Estados de Datos ---
  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [listaInvitados, setListaInvitados] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState(false);

  // --- Estado para búsqueda ---
  const [busqueda, setBusqueda] = useState("");

  // --- Estados de UI ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Determinar si es Kaizen basado en el nombre de la tarea actual
  const isKaizen = tarea.tarea.trim().toUpperCase().startsWith("KAIZEN");

  // Lógica de comparación de fecha para saber si pedir motivo
  const fechaHaCambiado = useMemo(() => {
    if (!fecha || !fechaStringOriginal) return false;
    return fecha !== fechaStringOriginal;
  }, [fecha, fechaStringOriginal]);

  const getDisplayName = (userToDisplay: Usuario): string => {
    if (isKaizen) {
      return userToDisplay.nombre;
    }
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return `${userToDisplay.nombre} (Supervisión)`;
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return `${userToDisplay.nombre} (Operativo)`;
    }
    return userToDisplay.nombre;
  };

  const getRoleColorClass = (userToDisplay: Usuario): string => {
    if (userToDisplay.rol === Rol.ENCARGADO) {
      return "text-blue-700 font-semibold";
    }
    if (userToDisplay.rol === Rol.USUARIO) {
      return "text-rose-700 font-semibold";
    }
    return "text-gray-800";
  };

  // --- 1. Inicializar Datos de la Tarea ---
  useEffect(() => {
    if (tarea) {
      setNombre(tarea.tarea);
      setComentario(tarea.observaciones || "");
      setPrioridad(tarea.urgencia);
      setImagenesExistentes(tarea.imagenes || []);
      setImagenesAEliminar([]);

      const idsActuales = tarea.responsables?.map((r: any) => r.id || r.usuarioId) || [];
      setResponsablesIds(idsActuales);

      if (tarea.fechaLimite) {
        const dateObj = new Date(tarea.fechaLimite);
        const fStr = formatDateToInput(dateObj);
        setFecha(fStr);
        setFechaStringOriginal(fStr);

        const h = dateObj.getHours();
        const m = dateObj.getMinutes();

        if (!(h === 23 && m === 59)) {
          setUsarHora(true);
          const hh = String(h).padStart(2, '0');
          const mm = String(m).padStart(2, '0');
          setHora(`${hh}:${mm}`);
        }
      }
    }
  }, [tarea]);

  // --- 2. Cargar Usuarios ---
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;

      setLoadingUsuarios(true);
      setErrorUsuarios(false);
      try {
        const responseUsuarios = await usuariosService.getAll({ limit: 1000 });
        const todosLosUsuarios = responseUsuarios.data;

        const internos = todosLosUsuarios.filter(u => u.rol !== Rol.INVITADO);
        const invitados = todosLosUsuarios.filter(u => u.rol === Rol.INVITADO);

        let usuariosVisibles = [];

        if (user.rol === Rol.ADMIN) {
          usuariosVisibles = internos.filter(u =>
            u.rol === Rol.ENCARGADO || u.rol === Rol.USUARIO
          );
        } else if (user.rol === Rol.ENCARGADO) {
          usuariosVisibles = internos.filter(u =>
            u.rol === Rol.ENCARGADO || u.rol === Rol.USUARIO
          );
        } else {
          usuariosVisibles = internos;
        }

        const sortedUsers = usuariosVisibles.sort((a, b) => {
          const rolA = a.rol;
          const rolB = b.rol;

          if (user.rol === Rol.ENCARGADO) {
            if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return -1;
            if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return 1;
          }
          else {
            if (rolA === Rol.ENCARGADO && rolB === Rol.USUARIO) return -1;
            if (rolA === Rol.USUARIO && rolB === Rol.ENCARGADO) return 1;
          }

          return a.nombre.localeCompare(b.nombre);
        });

        setListaUsuarios(sortedUsers);
        setListaInvitados(
          invitados.sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setErrorUsuarios(true);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsuarios();
  }, [user]);

  // 🔄 DETECTOR DE CAMBIOS
  const hayCambios = useMemo(() => {
    if (nombre !== tarea.tarea) return true;
    if ((comentario || "") !== (tarea.observaciones || "")) return true;
    if (prioridad !== tarea.urgencia) return true;
    if (archivosNuevos.length > 0) return true;
    if (imagenesAEliminar.length > 0) return true;

    const idsOriginales = tarea.responsables?.map((r: any) => r.id || r.usuarioId) || [];
    const currentRespSorted = [...responsablesIds].sort((a, b) => a - b).join(',');
    const originalRespSorted = [...idsOriginales].sort((a, b) => a - b).join(',');

    if (currentRespSorted !== originalRespSorted) return true;

    if (tarea.fechaLimite) {
      const dateObj = new Date(tarea.fechaLimite);
      const fechaOriginalStr = formatDateToInput(dateObj);
      const h = dateObj.getHours();
      const m = dateObj.getMinutes();
      const usabaHoraOriginal = !(h === 23 && m === 59);
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const horaOriginalStr = usabaHoraOriginal ? `${hh}:${mm}` : "";

      if (fecha !== fechaOriginalStr) return true;
      if (usarHora !== usabaHoraOriginal) return true;
      if (usarHora && hora !== horaOriginalStr) return true;
    } else {
      if (fecha) return true;
    }

    return false;
  }, [
    nombre,
    comentario,
    prioridad,
    fecha,
    usarHora,
    hora,
    archivosNuevos,
    imagenesAEliminar,
    responsablesIds,
    tarea
  ]);

  const isDateValid = () => {
    if (!fecha) return false;
    const dateObj = new Date(fecha);
    return !isNaN(dateObj.getTime());
  };

  const isTimeValidForToday = () => {
    if (!usarHora || !hora || !fecha) return true;

    if (tarea.fechaLimite) {
      const dateObj = new Date(tarea.fechaLimite);
      const fechaOriginal = formatDateToInput(dateObj);
      const h = dateObj.getHours();
      const m = dateObj.getMinutes();
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const horaOriginal = `${hh}:${mm}`;

      if (fecha === fechaOriginal && hora === horaOriginal) {
        return true;
      }
    }

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileError("");
      const nuevos = Array.from(e.target.files);
      const totalActual = imagenesExistentes.length + archivosNuevos.length + nuevos.length;

      const TAMANO_MAXIMO = 20 * 1024 * 1024;
      const archivoPesado = nuevos.find(file => file.size > TAMANO_MAXIMO);

      if (archivoPesado) {
        setFileError(`⚠️ El archivo "${archivoPesado.name}" pesa más de 20MB.`);
        e.target.value = "";
        return;
      }

      if (totalActual > MAX_FILES_LIMIT) {
        setFileError(`Límite total de ${MAX_FILES_LIMIT} archivos.`);
        e.target.value = "";
        return;
      }

      setArchivosNuevos((prev) => [...prev, ...nuevos]);
      e.target.value = "";
    }
  };

  const handleRemoveArchivoNuevo = (indexToRemove: number) => {
    setArchivosNuevos((prev) => prev.filter((_, index) => index !== indexToRemove));
    setFileError("");
  };

  const handleMarcarImagenParaBorrar = (imagenId: number) => {
    setImagenesExistentes(prev => prev.filter(img => img.id !== imagenId));
    setImagenesAEliminar(prev => [...prev, imagenId]);
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
      setNombre(newValue.slice(0, MAX_NOMBRE_LENGTH));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const nombreValido = nombre && nombre.trim().length > 0 && nombre.length <= MAX_NOMBRE_LENGTH;
    const responsablesValidos = responsablesIds.length > 0;
    const prioridadValida = !!prioridad;
    const fechaValida = isDateValid();
    const comentarioValido = comentario && comentario.trim().length > 0 && comentario.length <= MAX_OBSERVACIONES_LENGTH;
    const horaValida = !usarHora || (usarHora && !!hora);
    const tiempoValido = isTimeValidForToday();
    const motivoValido = !fechaHaCambiado || (fechaHaCambiado && motivo.trim().length > 0);

    if (
      !nombreValido ||
      !responsablesValidos ||
      !prioridadValida ||
      !fechaValida ||
      !comentarioValido ||
      !horaValida ||
      !tiempoValido ||
      !motivoValido
    ) {
      return;
    }

    if (!hayCambios) return;

    setLoading(true);

    try {
      let fechaLimiteFinal: Date;
      if (usarHora && hora) {
        fechaLimiteFinal = new Date(`${fecha}T${hora}:00`);
      } else {
        fechaLimiteFinal = new Date(`${fecha}T23:59:59`);
      }

      if (imagenesAEliminar.length > 0) {
        await Promise.all(imagenesAEliminar.map(id => tareasService.deleteImage(id)));
      }

      if (archivosNuevos.length > 0) {
        const formData = new FormData();
        archivosNuevos.forEach((file) => {
          formData.append("imagenes", file);
        });
        await tareasService.uploadImage(tarea.id, formData);
      }

      if (fechaHaCambiado) {
        const payloadDatos = {
          tarea: nombre,
          observaciones: comentario,
          urgencia: prioridad,
          responsables: responsablesIds,
        };
        await tareasService.update(tarea.id, payloadDatos as any);

        const payloadHistorial = {
          motivo: motivo,
          nuevaFecha: fechaLimiteFinal.toISOString(),
          fechaAnterior: tarea.fechaLimite,
        };
        await tareasService.createHistorial(tarea.id, payloadHistorial as any);
      } else {
        const updatePayload = {
          tarea: nombre,
          observaciones: comentario,
          urgencia: prioridad,
          fechaLimite: fechaLimiteFinal.toISOString(),
          responsables: responsablesIds,
        };
        await tareasService.update(tarea.id, updatePayload as any);
      }

      toast.success("Tarea actualizada correctamente.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar la tarea.");
    } finally {
      setLoading(false);
    }
  };

  const usuariosFiltrados = (isKaizen ? listaInvitados : listaUsuarios).filter((u) =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalArchivos = imagenesExistentes.length + archivosNuevos.length;
  const isMaxFilesReached = totalArchivos >= MAX_FILES_LIMIT;

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
            disabled={loading}
          >
            ×
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center">
            EDITAR TAREA #{tarea.id}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0" noValidate>
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">

              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">

                {/* COL 1: Info Básica */}
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
                      required
                      disabled={loading}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none
                        ${submitted && !nombre.trim()
                          ? "border-red-500"
                          : "border-gray-300"
                        }
                      `}
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
                      onChange={(e) => setComentario(e.target.value.slice(0, MAX_OBSERVACIONES_LENGTH))}
                      disabled={loading}
                      required
                      className={`w-full border rounded-md px-3 py-2 h-20 lg:h-40 resize-none focus:ring-2 focus:ring-amber-950 focus:outline-none 
                        ${submitted && !comentario.trim()
                          ? "border-red-500"
                          : "border-gray-300"
                        }
                      `}
                    />
                    {submitted && !comentario.trim() && (
                      <p className="text-red-600 text-xs mt-1">
                        Las indicaciones son obligatorias.
                      </p>
                    )}
                  </div>
                </div>

                {/* COL 2: Responsables */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
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
                      <div className="relative w-full h-32 lg:h-64 border rounded-md px-3 py-2 bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-500">Cargando usuarios...</p>
                      </div>
                    ) : (
                      <div className={`relative w-full h-32 lg:h-64 border rounded-md overflow-y-auto 
                        ${submitted && responsablesIds.length === 0 ? "border-red-500" : "border-gray-300"}
                      `}>
                        {usuariosFiltrados.map((u) => (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 w-full px-3 py-2 cursor-pointer transition-colors
                              ${responsablesIds.includes(u.id) ? "bg-amber-100 text-amber-900 font-semibold" : "text-gray-800 hover:bg-gray-50"}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={responsablesIds.includes(u.id)}
                              onChange={() => handleToggleResponsable(u.id)}
                              disabled={loading}
                              className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950"
                            />
                            <span className={getRoleColorClass(u)}>
                              {getDisplayName(u)}
                            </span>
                            {isKaizen && <span className="text-xs text-gray-400 ml-auto">(Invitado)</span>}
                          </label>
                        ))}

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

                {/* COL 3: Detalles y Archivos */}
                <div className="flex flex-col gap-4">

                  {/* Subida de Archivos */}
                  <div>
                    <label className="block text-sm font-semibold mb-1 flex justify-between">
                      <span>Evidencia</span>
                      <span className={`text-xs ${isMaxFilesReached ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        {totalArchivos}/{MAX_FILES_LIMIT}
                      </span>
                    </label>
                    <label
                      htmlFor="edit-file-upload"
                      onClick={(e) => { if (loading || isMaxFilesReached) e.preventDefault(); }}
                      className={`w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-900 font-semibold px-4 py-2 rounded-md transition-all 
                        ${loading || isMaxFilesReached ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-amber-200"}
                      `}
                    >
                      <span>Agregar / Tomar Foto</span>
                    </label>
                    <input id="edit-file-upload" type="file" multiple disabled={loading || isMaxFilesReached} onChange={handleFileChange} className="hidden" />

                    {fileError && <p className="text-red-600 text-xs mt-1">{fileError}</p>}

                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                      {imagenesExistentes.map((img) => (
                        <div key={img.id} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-md">
                          <img src={img.url} alt="Existente" className="w-10 h-10 object-cover rounded-md" />
                          <span className="text-xs text-gray-500 mx-2">Guardada</span>
                          <button type="button" onClick={() => handleMarcarImagenParaBorrar(img.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      ))}

                      {archivosNuevos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                          <img src={URL.createObjectURL(file)} alt={file.name} className="w-10 h-10 object-cover rounded-md" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                          <span className="flex-1 text-sm text-gray-700 mx-3 truncate">{file.name}</span>
                          <button type="button" onClick={() => handleRemoveArchivoNuevo(index)} className="p-1 text-red-600 hover:bg-red-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-semibold mb-1">Prioridad</label>
                    <fieldset className="mt-2 grid grid-cols-3 gap-2">
                      {PRIORIDADES_VALIDAS.map((p) => (
                        <div key={p.value}>
                          <input
                            type="radio"
                            id={`edit-prioridad-${p.value}`}
                            name="edit-prioridad-radio-group"
                            value={p.value}
                            checked={prioridad === p.value}
                            onChange={(e) => setPrioridad(e.target.value as Urgencia)}
                            disabled={loading}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`edit-prioridad-${p.value}`}
                            className={`
                              w-full block text-center px-3 py-2 rounded-md 
                              border text-sm font-semibold cursor-pointer transition-all
                              ${loading ? "opacity-50 cursor-not-allowed" : ""}
                              
                              ${p.value === "ALTA" && `
                                border-gray-300 bg-gray-50 text-gray-700
                                peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600
                                ${!loading && "hover:bg-red-100 hover:text-gray-700"}
                              `}
                              ${p.value === "MEDIA" && `
                                border-gray-300 bg-gray-50 text-gray-700
                                peer-checked:bg-amber-400 peer-checked:text-white peer-checked:border-amber-400
                                ${!loading && "hover:bg-amber-100 hover:text-gray-700"}
                              `}
                              ${p.value === "BAJA" && `
                                border-gray-300 bg-gray-50 text-gray-700
                                peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600
                                ${!loading && "hover:bg-green-100 hover:text-gray-700"}
                              `}
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

                  {/* Fecha Límite */}
                  <div>
                    <label className="block text-sm font-semibold mb-1">Fecha Límite</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                        disabled={loading}
                        min={formatDateToInput(new Date())}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none
                          ${submitted && !isDateValid() ? "border-red-500" : "border-gray-300"}
                        `}
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
                            className="w-4 h-4"
                          />
                          <span>¿Especificar hora?</span>
                        </label>
                        {usarHora && (
                          <input
                            type="time"
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            disabled={loading}
                            required={usarHora}
                            className={`flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none 
                              ${submitted && (!hora || !isTimeValidForToday()) ? "border-red-500 bg-red-50" : "border-gray-300"}
                            `}
                          />
                        )}
                      </div>
                    </div>
                    {submitted && !isDateValid() && (
                      <p className="text-red-600 text-xs mt-1">
                        La fecha límite es obligatoria.
                      </p>
                    )}
                    {submitted && usarHora && !hora && (
                      <p className="text-red-600 text-xs mt-1">
                        Debes seleccionar una hora.
                      </p>
                    )}
                    {submitted && usarHora && hora && !isTimeValidForToday() && (
                      <p className="text-red-600 text-xs mt-1">La hora no puede ser anterior a la actual.</p>
                    )}
                  </div>

                  {/* Motivo de cambio (Auditoría) */}
                  {fechaHaCambiado && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md animate-fade-in">
                      <label className="block text-sm font-bold text-red-800 mb-1">
                        Motivo del Cambio de Fecha *
                      </label>
                      <select
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        required
                        className={`w-full border rounded p-2 bg-white text-sm focus:outline-none ${submitted && !motivo.trim() ? 'border-red-500' : 'border-red-300'}`}
                      >
                        <option value="">-- Seleccione un motivo --</option>
                        {MOTIVOS_CAMBIO_FECHA.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {submitted && !motivo.trim() && (
                        <p className="text-red-600 text-[10px] font-bold mt-1">El motivo es obligatorio para reprogramar.</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={loading} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all cursor-pointer">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !hayCambios}
              className={`font-semibold px-4 py-2 rounded-md transition-all
                ${loading || !hayCambios
                  ? "bg-blue-300 text-white cursor-not-allowed opacity-70"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                }
              `}
            >
              {loading ? "Guardando..." : "Actualizar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditar;