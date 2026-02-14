import React, { useState, useEffect } from "react";
// ❌ No importamos el Modal genérico para poder personalizar estilo y tamaño al 100%
import { toast } from "react-toastify";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario, Rol } from "../../types/usuario";
import type { Departamento } from "../../api/departamentos.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioAEditar: Usuario | null;
  currentUser: Usuario | null;
  departamentos: Departamento[];
}

const ModalUsuario = ({ isOpen, onClose, onSuccess, usuarioAEditar, currentUser, departamentos }: Props) => {
  // --- ESTADOS ---
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>(""); // Inicia vacío para mostrar el placeholder
  const [departamentoId, setDepartamentoId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [usernameEdited, setUsernameEdited] = useState(false);

  // ✅ Nuevo estado para manejar el error de "Usuario duplicado" inline
  const [backendError, setBackendError] = useState<string>("");

  // --- DETERMINAR PERMISOS ---
  const esSuperAdmin = currentUser?.rol === "SUPER_ADMIN";
  const esAdmin = currentUser?.rol === "ADMIN";

  // --- CONSTANTES ---
  const MAX_NOMBRE_LENGTH = 50;

  // --- UTILIDADES ---
  const sanitizeUsername = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  };

  // --- EFECTO DE CARGA ---
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setBackendError(""); // Limpiar errores previos

      if (usuarioAEditar) {
        // MODO EDICIÓN
        setNombre(usuarioAEditar.nombre);
        setUsername(usuarioAEditar.username);
        setPassword("");
        setRol(usuarioAEditar.rol);
        setDepartamentoId(usuarioAEditar.departamentoId ? String(usuarioAEditar.departamentoId) : "");
        setUsernameEdited(true);
      } else {
        // MODO CREACIÓN (RESET)
        setNombre("");
        setUsername("");
        setPassword("");
        setRol(""); // ✅ Forzamos vacío para que salga "Seleccione un rol..."
        setUsernameEdited(false);

        // Si soy ADMIN, pre-selecciono MI departamento automáticamente
        if (esAdmin && currentUser?.departamentoId) {
          setDepartamentoId(String(currentUser.departamentoId));
        } else {
          setDepartamentoId("");
        }
      }
    }
  }, [isOpen, usuarioAEditar, currentUser, esAdmin]);

  // --- HANDLERS ---
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_NOMBRE_LENGTH) {
      setNombre(val);

      // Autogenerar username
      if (!usuarioAEditar && !usernameEdited) {
        const parts = val.trim().split(/\s+/);
        let base = "";
        if (parts.length >= 2) {
          base = parts[0] + parts[1];
        } else if (parts.length === 1) {
          base = parts[0];
        }
        setUsername(sanitizeUsername(base));
        setBackendError(""); // Limpiar error si se regenera
      }
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(sanitizeUsername(val));
    setUsernameEdited(true);
    setBackendError(""); // ✅ Limpiar error backend si el usuario edita
  };

  const handleRolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRol(e.target.value);
  };

  // --- LÓGICA DE VISUALIZACIÓN DE ROLES ---
  const rolesDisponibles = [
    { value: "USUARIO", label: "Operativo", visible: true },
    { value: "ENCARGADO", label: "Supervisión", visible: true },
    { value: "ADMIN", label: "Gestión", visible: esSuperAdmin },
    { value: "SUPER_ADMIN", label: "Super Admin", visible: esSuperAdmin },
    { value: "INVITADO", label: "Invitado (Externo)", visible: esSuperAdmin },
  ].filter(r => r.visible);

  // --- LÓGICA DE DEPARTAMENTO ---
  const requiereDepartamento = rol !== "SUPER_ADMIN" && rol !== "INVITADO" && rol !== "";
  const departamentoDisabled = esAdmin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendError(""); // Resetear error backend antes de enviar

    // --- VALIDACIONES ---
    if (!nombre.trim()) return;
    if (!username.trim()) return;
    if (!usuarioAEditar && !password.trim()) return;
    if (!rol) return;
    if (requiereDepartamento && !departamentoId) return;

    setIsSubmitting(true);

    try {
      const payload: any = {
        nombre,
        username,
        rol,
        departamentoId: requiereDepartamento && departamentoId ? Number(departamentoId) : null,
      };

      if (password.trim()) {
        payload.password = password;
      }

      if (usuarioAEditar) {
        await usuariosService.update(usuarioAEditar.id, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await usuariosService.create(payload);
        toast.success("Usuario creado correctamente");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Error al guardar usuario.";

      // ✅ Si es error de duplicado, lo mostramos INLINE (no toast)
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("usuario")) {
        setBackendError(`El usuario "${username}" no está disponible.`);
      } else {
        // Otros errores (servidor, conexión) sí van por toast
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    // 1. FONDO OSCURO Y BLUR (Igual a ModalNueva)
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* 2. CONTENEDOR PRINCIPAL */}
      <div
        className="bg-white rounded-lg shadow-xl w-[95%] max-w-2xl relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3. HEADER */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold cursor-pointer"
            disabled={isSubmitting}
          >
            ×
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center uppercase">
            {usuarioAEditar ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
        </div>

        {/* 4. BODY SCROLLABLE */}
        <div className="flex-grow overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* GRUPO: Identidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NOMBRE */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
                  <span>Nombre Completo</span>
                  <span className={`text-[10px] ${nombre.length > MAX_NOMBRE_LENGTH ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                    {nombre.length}/{MAX_NOMBRE_LENGTH}
                  </span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={handleNombreChange}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                    ${submitted && !nombre.trim() ? "border-red-500 bg-red-50" : "border-slate-300"}
                  `}
                  placeholder="Nombre Completo"
                  autoFocus
                />
                {submitted && !nombre.trim() && (
                  <p className="text-red-600 text-xs mt-1">El nombre es obligatorio.</p>
                )}
              </div>

              {/* USERNAME */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nombre de Usuario (Login)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  // Si hay error de submit vacío O error de backend, borde rojo
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm bg-slate-50
                    ${(submitted && !username.trim()) || backendError ? "border-red-500 bg-red-50" : "border-slate-300"}
                  `}
                  placeholder="usuario"
                />

                {/* Lógica de Mensajes de Validación */}
                {submitted && !username.trim() ? (
                  <p className="text-red-600 text-xs mt-1">El usuario es obligatorio.</p>
                ) : backendError ? (
                  // ✅ Mensaje de error de backend (duplicado) INLINE
                  <p className="text-red-600 text-xs mt-1">{backendError}</p>
                ) : (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Importante: No olvidar, necesario para iniciar sesión.
                  </p>
                )}
              </div>
            </div>

            {/* GRUPO: Acceso y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ROL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nivel de Acceso (Rol)
                </label>
                <div className="relative">
                  <select
                    value={rol}
                    onChange={handleRolChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none cursor-pointer
                      ${submitted && !rol ? "border-red-500 bg-red-50" : "border-slate-300"}
                    `}
                  >
                    {/* ✅ Opción por defecto deshabilitada si no hay selección */}
                    <option value="" disabled>Seleccione un rol...</option>
                    {rolesDisponibles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
                {submitted && !rol && (
                  <p className="text-red-600 text-xs mt-1">Debes seleccionar un rol.</p>
                )}
              </div>

              {/* DEPARTAMENTO */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${!requiereDepartamento ? 'text-slate-300' : 'text-slate-500'}`}>
                  Departamento
                </label>
                <div className="relative">
                  <select
                    value={departamentoId}
                    onChange={(e) => setDepartamentoId(e.target.value)}
                    disabled={!requiereDepartamento || departamentoDisabled}
                    className={`w-full px-3 py-2.5 border rounded-lg outline-none appearance-none
                      ${(!requiereDepartamento || departamentoDisabled)
                        ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed"
                        : submitted && requiereDepartamento && !departamentoId
                          ? "bg-red-50 border-red-500 focus:ring-2 focus:ring-red-500 cursor-pointer"
                          : "bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      }`}
                  >
                    {esAdmin ? (
                      <option value={currentUser?.departamentoId || ""}>
                        {(currentUser as any)?.departamento?.nombre || "Mi Departamento"}
                      </option>
                    ) : (
                      <>
                        <option value="">Seleccione...</option>
                        {departamentos.map((d) => (
                          <option key={d.id} value={d.id}>{d.nombre}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {!departamentoDisabled && requiereDepartamento && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                  )}
                </div>
                {submitted && requiereDepartamento && !departamentoId && (
                  <p className="text-red-600 text-xs mt-1">El departamento es obligatorio para este rol.</p>
                )}
                {esAdmin && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Solo puedes asignar usuarios a tu departamento.
                  </p>
                )}
              </div>
            </div>

            {/* GRUPO: Seguridad */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Contraseña {usuarioAEditar && <span className="text-slate-400 font-normal normal-case ml-1">(Dejar en blanco para mantener actual)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                  ${submitted && !usuarioAEditar && !password.trim() ? "border-red-500 bg-red-50" : "border-slate-300"}
                `}
                placeholder={usuarioAEditar ? "••••••••" : "Contraseña segura"}
              />
              {submitted && !usuarioAEditar && !password.trim() && (
                <p className="text-red-600 text-xs mt-1">La contraseña es obligatoria para nuevos usuarios.</p>
              )}
            </div>

            {/* Footer de Botones (Igual a ModalNueva) */}
            <div className="flex-shrink-0 flex justify-end gap-2 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 cursor-pointer
                  ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"}`}
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? "Guardando..." : (usuarioAEditar ? "Guardar Cambios" : "Crear Usuario")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalUsuario;