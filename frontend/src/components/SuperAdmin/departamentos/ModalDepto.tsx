import React, { useState, useEffect } from "react";
import Modal from "../../Modal";
import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nombre: string) => void;
  deptoAEditar: Departamento | null;
}

const ModalDepto = ({ isOpen, onClose, onSave, deptoAEditar }: Props) => {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNombre(deptoAEditar ? deptoAEditar.nombre : "");
    }
  }, [isOpen, deptoAEditar]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave(nombre);
  };

  // CORRECCIÓN 1: Si no está abierto, no renderizamos nada (porque Modal ya no tiene isOpen)
  if (!isOpen) return null;

  // Definimos el título para pasarlo al prop 'title'
  const tituloModal = deptoAEditar ? "Editar Departamento" : "Nuevo Departamento";

  return (
    // CORRECCIÓN 2: Quitamos isOpen y agregamos title
    <Modal onClose={onClose} title={tituloModal}>
      <div className="p-6">
        {/* Ya no necesitamos el <h3> aquí porque el Modal ya renderiza el título */}

        <p className="text-slate-500 mb-6 text-sm">
          {deptoAEditar
            ? `Modificando el departamento #${deptoAEditar.id}`
            : "Ingresa el nombre de la nueva área operativa o administrativa."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nombre del Área
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Recursos Humanos"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {deptoAEditar ? "Guardar Cambios" : "Crear Departamento"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ModalDepto;