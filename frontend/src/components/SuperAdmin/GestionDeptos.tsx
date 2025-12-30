import { useState, useEffect } from "react";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import ResumenDeptos from "./departamentos/ResumenDeptos";
import TablaDeptos from "./departamentos/TablaDeptos";
import ModalDepto from "./departamentos/ModalDepto";

const GestionDeptos = () => {
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deptoEditar, setDeptoEditar] = useState<Departamento | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await departamentosService.getAll();
      setDeptos(data);
    } catch (e) {
      console.error("Error cargando departamentos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Abrir modal para CREAR
  const handleNuevo = () => {
    setDeptoEditar(null);
    setModalOpen(true);
  };

  // Abrir modal para EDITAR
  const handleEditar = (depto: Departamento) => {
    setDeptoEditar(depto);
    setModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (nombre: string) => {
    try {
      if (deptoEditar) {
        await departamentosService.update(deptoEditar.id, nombre);
      } else {
        await departamentosService.create(nombre);
      }
      setModalOpen(false);
      cargarDatos(); // Recargar tabla
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Ocurrió un error al guardar el departamento.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-0">

      {/* 1. Sección de Resumen (Tarjetas) */}
      <ResumenDeptos deptos={deptos} loading={loading} />

      {/* 2. Barra de Acciones y Título */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          Departamentos <span className="text-slate-400 text-lg font-normal">({deptos.length})</span>
        </h2>
        <button
          onClick={handleNuevo}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Departamento
        </button>
      </div>

      {/* 3. Tabla de Datos */}
      <TablaDeptos
        deptos={deptos}
        loading={loading}
        onEdit={handleEditar}
      />

      {/* 4. Modal (Reutilizable para Crear y Editar) */}
      <ModalDepto
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleGuardar}
        deptoAEditar={deptoEditar}
      />
    </div>
  );
};

export default GestionDeptos;