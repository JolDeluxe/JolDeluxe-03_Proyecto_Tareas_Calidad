import React, { useState, useEffect, useRef } from "react";
import type { Usuario } from "../../../types/usuario";
import type { Departamento } from "../../../api/departamentos.service";
import type { CrearUsuarioPayload, ActualizarUsuarioPayload } from "../../../api/usuarios.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CrearUsuarioPayload | ActualizarUsuarioPayload) => Promise<void>;
  usuarioAEditar: Usuario | null;
  departamentos: Departamento[];
}

const ModalUsuario = ({ isOpen, onClose, onSave, usuarioAEditar, departamentos }: Props) => {
  const mouseDownInside = useRef(false);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>("USUARIO");
  const [departamentoId, setDepartamentoId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [backendError, setBackendError] = useState<string>("");

  const MAX_NOMBRE_LENGTH = 50;

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setBackendError("");

      if (usuarioAEditar) {
        setNombre(usuarioAEditar.nombre);
        setUsername(usuarioAEditar.username);
        setPassword("");
        setRol(usuarioAEditar.rol);
        setDepartamentoId(usuarioAEditar.departamentoId ? String(usuarioAEditar.departamentoId) : "");
      } else {
        setNombre("");
        setUsername("");
        setPassword("");
        setRol("USUARIO");
        setDepartamentoId("");
      }
    }
  }, [isOpen, usuarioAEditar]);

  const requiereDepartamento = !["SUPER_ADMIN", "INVITADO"].includes(rol);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendError("");

    if (!nombre.trim() || !username.trim()) return;
    if (!usuarioAEditar && !password.trim()) return;
    if (requiereDepartamento && !departamentoId) return;

    setIsSubmitting(true);
    const payload: any = {
      nombre,
      username,
      rol,
      departamentoId: requiereDepartamento && departamentoId ? Number(departamentoId) : null,
    };

    if (password.trim()) payload.password = password;

    try {
      await onSave(payload);
    } catch (error: any) {
      // El Error ya fue lanzado por el padre si fue de unique, lo atrapamos aquí para el texto inline.
      if (error.message && error.message.includes("uso")) {
        setBackendError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) mouseDownInside.current = false;
      }}
      onMouseUp={(e) => {
        if (!mouseDownInside.current && e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[95%] max-w-2xl relative flex flex-col max-h-[90vh] animate-fadeIn"
        onMouseDown={() => { mouseDownInside.current = true; }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-5 border-b border-slate-200 relative bg-slate-50 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 text-2xl font-bold cursor-pointer transition-colors"
            disabled={isSubmitting}
          >
            ×
          </button>
          <h2 className="text-xl font-extrabold text-slate-800 text-center uppercase tracking-wide">
            {usuarioAEditar ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(e) => setNombre(e.target.value.slice(0, MAX_NOMBRE_LENGTH))}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all
                    ${submitted && !nombre.trim() ? "border-red-500 bg-red-50" : "border-slate-300"}`}
                  placeholder="Ej. Juan Pérez"
                  autoFocus
                />
                {submitted && !nombre.trim() && <p className="text-red-600 text-xs mt-1">Obligatorio.</p>}
              </div>

              {/* USERNAME */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
                    setBackendError("");
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-sm
                    ${(submitted && !username.trim()) || backendError ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-50"}`}
                  placeholder="jperez"
                />
                {submitted && !username.trim() ? (
                  <p className="text-red-600 text-xs mt-1">Obligatorio.</p>
                ) : backendError ? (
                  <p className="text-red-600 text-xs mt-1 font-semibold">{backendError}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ROL */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel de Acceso (Rol)</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                >
                  <option value="USUARIO">Usuario (Operativo)</option>
                  <option value="ENCARGADO">Encargado (Jefe de Área)</option>
                  <option value="ADMIN">Admin (Director de Área)</option>
                  <option value="SUPER_ADMIN">Super Admin (Global)</option>
                  <option value="INVITADO">Invitado (Externo)</option>
                </select>
              </div>

              {/* DEPARTAMENTO */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-1 ${!requiereDepartamento ? 'text-slate-300' : 'text-slate-500'}`}>
                  Departamento
                </label>
                <select
                  value={departamentoId}
                  onChange={(e) => setDepartamentoId(e.target.value)}
                  disabled={!requiereDepartamento}
                  className={`w-full px-3 py-2.5 border rounded-lg outline-none
                    ${!requiereDepartamento ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : submitted && !departamentoId ? "bg-red-50 border-red-500 focus:ring-red-500 cursor-pointer"
                        : "bg-white border-slate-300 focus:ring-indigo-500 cursor-pointer"}`}
                >
                  <option value="">Seleccione...</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>
                {submitted && requiereDepartamento && !departamentoId && (
                  <p className="text-red-600 text-xs mt-1">Obligatorio para este rol.</p>
                )}
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Contraseña {usuarioAEditar && <span className="text-slate-400 font-normal normal-case ml-1">(Dejar vacío para conservar)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all
                  ${submitted && !usuarioAEditar && !password.trim() ? "border-red-500 bg-red-50" : "border-slate-300"}`}
                placeholder={usuarioAEditar ? "••••••••" : "Contraseña segura"}
              />
              {submitted && !usuarioAEditar && !password.trim() && (
                <p className="text-red-600 text-xs mt-1">Obligatoria al crear usuario.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2 rounded-lg transition-all duration-200 disabled:opacity-70 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md cursor-pointer
                  ${isSubmitting ? "opacity-70 cursor-wait" : "hover:bg-indigo-700 active:scale-95"}`}
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