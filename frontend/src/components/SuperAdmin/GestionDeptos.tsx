import React, { useState, useEffect, useMemo } from "react";
import { departamentosService, type Departamento } from "../../api/departamentos.service";
import { toast } from "react-toastify";

// Componentes modulares
import ResumenDeptos from "./departamentos/ResumenDeptos";
import TablaDeptos from "./departamentos/TablaDeptos";
import ModalDepto from "./departamentos/ModalDepto";

// Utilidad para normalizar texto (Quita acentos y pasa a minúsculas)
const normalizeText = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const GestionDeptos = () => {
  // --- Estados de Datos ---
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados de Filtros y Búsqueda ---
  const [busqueda, setBusqueda] = useState("");

  // --- Estados de Paginación y Ordenamiento ---
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortBy, setSortBy] = useState<string>("nombre");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // --- Estados del Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [deptoEditar, setDeptoEditar] = useState<Departamento | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await departamentosService.getAll();
      setDeptos(data);
    } catch (e) {
      console.error("Error cargando departamentos:", e);
      toast.error("Error al cargar los departamentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // --- Manejadores (CRUD) ---
  const handleNuevo = () => {
    setDeptoEditar(null);
    setModalOpen(true);
  };

  const handleEditar = (depto: Departamento) => {
    setDeptoEditar(depto);
    setModalOpen(true);
  };

  const handleGuardar = async (nombre: string) => {
    try {
      if (deptoEditar) {
        await departamentosService.update(deptoEditar.id, nombre);
        toast.success("Departamento actualizado correctamente.");
      } else {
        await departamentosService.create(nombre);
        toast.success("Departamento creado correctamente.");
      }
      setModalOpen(false);
      cargarDatos();
    } catch (error: any) {
      console.error("Error al guardar:", error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Ocurrió un error al guardar el departamento.";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("ya existe")) {
        throw new Error("El nombre de este departamento ya está registrado.");
      }
      toast.error(msg);
      throw error;
    }
  };

  // --- 1. Filtrado de Búsqueda (Sin acentos y case-insensitive) ---
  const deptosFiltrados = useMemo(() => {
    return deptos.filter(d => {
      if (busqueda.trim() !== "") {
        const queryTerm = normalizeText(busqueda);
        const nombreNorm = normalizeText(d.nombre);

        // Buscar también por el nombre del Jefe (Admin)
        const jefe = d.usuarios?.find(u => u.rol === 'ADMIN');
        const jefeNorm = jefe ? normalizeText(jefe.nombre) : "";

        if (!nombreNorm.includes(queryTerm) && !jefeNorm.includes(queryTerm)) {
          return false;
        }
      }
      return true;
    });
  }, [deptos, busqueda]);

  // --- 2. Ordenamiento Global ---
  const deptosOrdenados = useMemo(() => {
    const sorted = [...deptosFiltrados];

    sorted.sort((a, b) => {
      if (sortBy === "personal") {
        const countA = a._count?.usuarios || 0;
        const countB = b._count?.usuarios || 0;
        if (countA < countB) return sortDirection === "asc" ? -1 : 1;
        if (countA > countB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      if (sortBy === "jefe") {
        const jefeA = a.usuarios?.find(u => u.rol === 'ADMIN')?.nombre || "zzzz"; // zzzz para mandarlo al final
        const jefeB = b.usuarios?.find(u => u.rol === 'ADMIN')?.nombre || "zzzz";
        if (jefeA < jefeB) return sortDirection === "asc" ? -1 : 1;
        if (jefeA > jefeB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }

      const valA = String((a as any)[sortBy] || "").toLowerCase();
      const valB = String((b as any)[sortBy] || "").toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [deptosFiltrados, sortBy, sortDirection]);

  // --- 3. Paginación Local ---
  const deptosPaginados = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return deptosOrdenados.slice(startIndex, startIndex + limit);
  }, [deptosOrdenados, page, limit]);

  const paginasReales = Math.max(1, Math.ceil(deptosOrdenados.length / limit));

  return (
    <div className="space-y-6 animate-fadeIn p-2 md:p-0">

      {/* 1. Sección de Resumen (Tarjetas Flexibles) */}
      <ResumenDeptos deptos={deptos} loading={loading} />

      {/* 2. Barra de Herramientas y Búsqueda */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Input Buscador */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            placeholder="Buscar departamento o jefatura..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            className="block w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Botón Nuevo */}
        <button
          onClick={handleNuevo}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Departamento
        </button>
      </div>

      {/* 3. Tabla de Datos (Dumb Component) */}
      <TablaDeptos
        deptos={deptosPaginados}
        total={deptosOrdenados.length}
        loading={loading}
        onEdit={handleEditar}
        page={page}
        totalPages={paginasReales}
        onPageChange={setPage}
        sortConfig={{ key: sortBy, direction: sortDirection }}
        onSortChange={(key, direction) => {
          setSortBy(key);
          setSortDirection(direction);
          setPage(1);
        }}
      />

      {/* 4. Modal Inquebrantable */}
      {modalOpen && (
        <ModalDepto
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleGuardar}
          deptoAEditar={deptoEditar}
        />
      )}
    </div>
  );
};

export default GestionDeptos;