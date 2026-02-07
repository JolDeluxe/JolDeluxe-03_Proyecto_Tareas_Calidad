import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface ModalUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioAEditar: Usuario | null;
  currentUser: Usuario | null;
}

const MAX_LENGTH = 50;

const ModalUsuario: React.FC<ModalUsuarioProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuarioAEditar,
  currentUser,
}) => {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>(Rol.USUARIO);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (usuarioAEditar) {
        setNombre(usuarioAEditar.nombre);
        setUsername(usuarioAEditar.username);
        setRol(usuarioAEditar.rol);
        setPassword("");
      } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!nombre.trim() || !username.trim()) {
      toast.warn("Nombre y Usuario son obligatorios.");
      return;
    }

    if (!usuarioAEditar && !password.trim()) {
      toast.warn("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }

    // 🔍 Validación de Seguridad: Si NO es invitado, necesitamos el depto del admin
    const esInvitado = rol === Rol.INVITADO || rol === Rol.SUPER_ADMIN;

    if (!esInvitado && !currentUser?.departamentoId) {
      toast.error("Error crítico: No se pudo identificar tu departamento para asignar al nuevo usuario.");
      return;
    }

    setLoading(true);

    try {
      // 🛠️ Construcción del Payload
      // Si es INVITADO -> departamentoId: null
      // Si es USUARIO/ENCARGADO -> departamentoId: currentUser.departamentoId
      const targetDepartamentoId = esInvitado ? null : currentUser?.departamentoId;

      if (usuarioAEditar) {
        const payload: any = {
          nombre,
          username,
          rol,
          departamentoId: targetDepartamentoId, // null desconecta, ID conecta
        };
        if (password.trim()) payload.password = password;

        await usuariosService.update(usuarioAEditar.id, payload);
        toast.success("Usuario actualizado correctamente.");
      } else {
        const payload = {
          nombre,
          username,
          password,
          rol,
          departamentoId: targetDepartamentoId, // ✅ Aquí se envía null o el ID
        };

        // console.log("Enviando payload:", payload); // Descomenta para depurar
        await usuariosService.create(payload);
        toast.success("Usuario creado correctamente.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      // Si Zod devuelve detalles, mostrarlos podría ser mucho texto, mejor un genérico
      const zodIssues = error.response?.data?.detalles;

      if (zodIssues) {
        toast.error("Error de validación. Revisa los datos.");
      } else {
        toast.error(serverMsg || "Ocurrió un error al guardar.");
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
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
            disabled={loading}
          >
            ×
          </button>
          <h2 className="text-lg font-bold text-amber-950 text-center">
            {usuarioAEditar ? "EDITAR USUARIO" : "NUEVO USUARIO"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0" noValidate>
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 text-gray-800">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  maxLength={MAX_LENGTH}
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none ${submitted && !nombre.trim() ? "border-red-500" : "border-gray-300"}`}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej. jperez"
                  maxLength={20}
                  disabled={loading}
                  className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none ${submitted && !username.trim() ? "border-red-500" : "border-gray-300"}`}
                />
              </div>

              {/* Rol */}
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
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1 flex justify-between">
                  <span>Contraseña</span>
                  {usuarioAEditar && <span className="text-gray-400 text-xs font-normal">(Opcional)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    disabled={loading}
                    className={`w-full border rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-amber-950 focus:outline-none ${submitted && !usuarioAEditar && !password.trim() ? "border-red-500" : "border-gray-300"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-70"
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