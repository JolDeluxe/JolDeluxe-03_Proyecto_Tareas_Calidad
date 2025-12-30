import React, { useState, useEffect } from "react";
import Modal from "../../Modal"; // Tu componente Modal genérico
import type { Usuario } from "../../../types/usuario"; // Asegúrate de tener los tipos
import type { Departamento } from "../../../api/departamentos.service";
import type { CrearUsuarioPayload, ActualizarUsuarioPayload } from "../../../api/usuarios.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CrearUsuarioPayload | ActualizarUsuarioPayload) => void;
  usuarioAEditar: Usuario | null;
  departamentos: Departamento[];
}

const ModalUsuario = ({ isOpen, onClose, onSave, usuarioAEditar, departamentos }: Props) => {
  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<string>("USUARIO");
  const [departamentoId, setDepartamentoId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (usuarioAEditar) {
        // Modo Edición
        setNombre(usuarioAEditar.nombre);
        setUsername(usuarioAEditar.username);
        setPassword(""); // Limpiar password al editar
        setRol(usuarioAEditar.rol);
        setDepartamentoId(usuarioAEditar.departamentoId ? String(usuarioAEditar.departamentoId) : "");
      } else {
        // Modo Creación (Reset)
        setNombre("");
        setUsername("");
        setPassword("");
        setRol("USUARIO");
        setDepartamentoId("");
      }
    }
  }, [isOpen, usuarioAEditar]);

  // Lógica: SUPER_ADMIN e INVITADO no suelen tener departamento (según tu backend)
  const requiereDepartamento = !["SUPER_ADMIN", "INVITADO"].includes(rol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!nombre.trim() || !username.trim()) return;
    if (!usuarioAEditar && !password.trim()) return; // Password obligatorio si es nuevo

    // Preparar Payload
    const payload: any = {
      nombre,
      username,
      rol,
      departamentoId: requiereDepartamento && departamentoId ? Number(departamentoId) : null,
    };

    // Solo enviamos password si se escribió algo (en edición) o siempre (en creación)
    if (password.trim()) {
      payload.password = password;
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} title={usuarioAEditar ? "Editar Usuario" : "Nuevo Usuario"}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">

        {/* Nombre y Username */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej. jperez"
            />
          </div>
        </div>

        {/* Rol y Departamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol de Acceso</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="USUARIO">Usuario (Operativo)</option>
              <option value="ENCARGADO">Encargado (Jefe de Área)</option>
              <option value="ADMIN">Admin (Director de Área)</option>
              <option value="SUPER_ADMIN">Super Admin (TI/Gerencia)</option>
              <option value="INVITADO">Invitado (Externo)</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase mb-1 ${!requiereDepartamento ? 'text-slate-300' : 'text-slate-500'}`}>
              Departamento Asignado
            </label>
            <select
              value={departamentoId}
              onChange={(e) => setDepartamentoId(e.target.value)}
              disabled={!requiereDepartamento}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">Seleccione un departamento...</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            {!requiereDepartamento && (
              <p className="text-[10px] text-orange-500 mt-1">* Este rol no requiere departamento.</p>
            )}
          </div>
        </div>

        {/* Contraseña */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Contraseña {usuarioAEditar && <span className="text-slate-400 font-normal normal-case">(Dejar en blanco para mantener la actual)</span>}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder={usuarioAEditar ? "••••••••" : "Asigna una contraseña segura"}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md"
          >
            {usuarioAEditar ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalUsuario;