import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioAEditar: Usuario | null; // Si es null, es modo creación
  currentUser: Usuario | null; // Necesario para obtener el departamentoId
}

const MAX_LENGTH = 50;

const ModalUsuario: React.FC<ModalUsuarioProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuarioAEditar,
  currentUser,
}) => {
  // --- Estados ---
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>(Rol.USUARIO);

  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Efecto: Cargar datos si es edición ---
  useEffect(() => {
    if (isOpen) {
      if (usuarioAEditar) {
        setNombre(usuarioAEditar.nombre);
        setUsername(usuarioAEditar.username);
        setRol(usuarioAEditar.rol);
        setPassword(""); // Password limpio en edición
      } else {
        // Reset para nuevo usuario
        setNombre("");
        setUsername("");
        setPassword("");
        setRol(Rol.USUARIO);
      }
      setSubmitted(false);
      setLoading(false);
    }
  }, [isOpen, usuarioAEditar]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // 1. Validaciones básicas
    if (!nombre.trim() || !username.trim()) {
      toast.warn("Nombre y Usuario son obligatorios.");
      return;
    }

    // En creación, password es obligatorio. En edición es opcional.
    if (!usuarioAEditar && !password.trim()) {
      toast.warn("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }

    // Validación de Departamento
    if (!currentUser?.departamentoId) {
      toast.error("No se pudo identificar tu departamento. Recarga la página.");
      return;
    }

    setLoading(true);

    try {
      if (usuarioAEditar) {
        // --- MODO EDICIÓN ---
        const payload: any = {
          nombre,
          username,
          rol,
          // El departamento NO se toca en edición para Admins de Depto
        };
        // Solo enviamos password si el usuario escribió algo
        if (password.trim()) {
          payload.password = password;
        }

        await usuariosService.update(usuarioAEditar.id, payload);
        toast.success("Usuario actualizado correctamente.");
      } else {
        // --- MODO CREACIÓN ---
        const payload = {
          nombre,
          username,
          password,
          rol,
          departamentoId: currentUser.departamentoId, // 🔒 Asignación automática
        };

        await usuariosService.create(payload);
        toast.success("Usuario creado correctamente.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Ocurrió un error al guardar.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* PANEL PRINCIPAL */}
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md relative flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
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
            {usuarioAEditar ? "EDITAR USUARIO" : "NUEVO USUARIO"}
          </h2>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0" noValidate>
          {/* BODY SCROLLABLE */}
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">

              {/* --- Campo: Nombre --- */}
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  maxLength={MAX_LENGTH}
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none 
                    ${submitted && !nombre.trim() ? "border-red-500" : "border-gray-300"}`}
                />
                {submitted && !nombre.trim() && (
                  <p className="text-red-600 text-xs mt-1">El nombre es obligatorio.</p>
                )}
              </div>

              {/* --- Campo: Username --- */}
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. jperez"
                  maxLength={20}
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none 
                    ${submitted && !username.trim() ? "border-red-500" : "border-gray-300"}`}
                />
              </div>

              {/* --- Campo: Rol --- */}
              <div>
                <label className="block text-sm font-semibold mb-1">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none bg-white"
                >
                  <option value={Rol.USUARIO}>Usuario (Operativo)</option>
                  <option value={Rol.ENCARGADO}>Encargado (Coordinador)</option>
                  <option value={Rol.INVITADO}>Invitado (Externo)</option>
                  {/* Opcional: Permitir crear otros Admins si la lógica de negocio lo permite */}
                  {/* <option value={Rol.ADMIN}>Admin (Administrativo)</option> */}
                </select>
              </div>

              {/* --- Campo: Password --- */}
              <div>
                <label className="block text-sm font-semibold mb-1 flex justify-between">
                  <span>Contraseña</span>
                  {usuarioAEditar && <span className="text-gray-400 text-xs font-normal">(Dejar en blanco para no cambiar)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={usuarioAEditar ? "********" : "Contraseña segura"}
                    disabled={loading}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-amber-950 focus:outline-none 
                      ${submitted && !usuarioAEditar && !password.trim() ? "border-red-500" : "border-gray-300"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* FOOTER */}
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
              className={`bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"}`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalUsuario;