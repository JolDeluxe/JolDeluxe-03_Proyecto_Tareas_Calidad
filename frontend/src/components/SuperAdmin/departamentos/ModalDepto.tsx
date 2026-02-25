import React, { useState, useEffect, useRef } from "react";
import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nombre: string) => Promise<void>;
  deptoAEditar: Departamento | null;
}

const ModalDepto = ({ isOpen, onClose, onSave, deptoAEditar }: Props) => {
  const mouseDownInside = useRef(false);
  const [nombre, setNombre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [backendError, setBackendError] = useState("");

  const MAX_LENGTH = 60;

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setBackendError("");
      setNombre(deptoAEditar ? deptoAEditar.nombre : "");
    }
  }, [isOpen, deptoAEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendError("");

    if (!nombre.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(nombre.trim());
    } catch (error: any) {
      // El error (ej. "unique") lo lanza el padre
      if (error.message && error.message.includes("registrado")) {
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
        className="bg-white rounded-xl shadow-2xl w-[95%] max-w-lg relative flex flex-col max-h-[90vh] animate-fadeIn"
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
            {deptoAEditar ? "Editar Departamento" : "Nuevo Departamento"}
          </h2>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <p className="text-slate-500 mb-6 text-sm text-center">
            {deptoAEditar
              ? `Modificando los datos del área #${deptoAEditar.id}`
              : "Ingresa el nombre descriptivo de la nueva área o división de la empresa."}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                <span>Nombre del Área</span>
                <span className={`text-[10px] ${nombre.length > MAX_LENGTH ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                  {nombre.length}/{MAX_LENGTH}
                </span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value.slice(0, MAX_LENGTH));
                  setBackendError("");
                }}
                placeholder="Ej. Recursos Humanos, Ventas, TI..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium
                  ${(submitted && !nombre.trim()) || backendError ? "border-red-500 bg-red-50" : "border-slate-300"}`}
                autoFocus
              />
              {submitted && !nombre.trim() ? (
                <p className="text-red-600 text-xs mt-1.5 font-bold">El nombre es obligatorio.</p>
              ) : backendError ? (
                <p className="text-red-600 text-xs mt-1.5 font-bold">{backendError}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-70 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md cursor-pointer
                  ${isSubmitting ? "opacity-70 cursor-wait" : "hover:bg-indigo-700 active:scale-95"}`}
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? "Guardando..." : (deptoAEditar ? "Guardar Cambios" : "Crear Departamento")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalDepto;