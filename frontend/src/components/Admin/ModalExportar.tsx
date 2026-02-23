// 📍 src/components/Admin/ModalExportar.tsx

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { tareasService } from "../../api/tareas.service";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";
import { MicrosoftExcel } from "../../assets/MicrosoftExcel";

interface ModalExportarProps {
  onClose: () => void;
  user: Usuario | null;
}

// --- Helpers de Fechas ---
const formatDateToInput = (fecha?: Date | null): string => {
  if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) return "";
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const formatearFechaExcel = (fechaStr: string | Date | null | undefined) => {
  if (!fechaStr) return "N/A";
  const date = new Date(fechaStr);
  if (isNaN(date.getTime())) return "N/A";

  const dia = date.getDate().toString().padStart(2, "0");
  const mes = (date.getMonth() + 1).toString().padStart(2, "0");
  const anio = date.getFullYear();

  let horas = date.getHours();
  const minutos = date.getMinutes().toString().padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  horas = horas ? horas : 12;
  return `${dia}/${mes}/${anio} ${horas.toString().padStart(2, "0")}:${minutos} ${ampm}`;
};

type TipoRango = "HOY" | "ESTA_SEMANA" | "MES_ACTUAL" | "PERSONALIZADO" | "TODAS";

const ModalExportar: React.FC<ModalExportarProps> = ({ onClose, user }) => {
  // --- ESTADOS: COLUMNA 1 (Fechas y Rangos) ---
  const [tipoFecha, setTipoFecha] = useState<"LIMITE" | "REGISTRO">("LIMITE");
  const [rango, setRango] = useState<TipoRango>("MES_ACTUAL");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // --- ESTADOS: COLUMNA 2 (Filtros Básicos) ---
  const [estatusSeleccionados, setEstatusSeleccionados] = useState<string[]>(["PENDIENTE", "EN_REVISION", "CONCLUIDA"]);
  const [prioridadesSeleccionadas, setPrioridadesSeleccionadas] = useState<string[]>(["ALTA", "MEDIA", "BAJA"]);

  // --- ESTADOS: Usuarios (Búsqueda) ---
  const [listaUsuarios, setListaUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState(false);

  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [busquedaResponsable, setBusquedaResponsable] = useState("");

  const [asignadoresIds, setAsignadoresIds] = useState<number[]>([]);
  const [busquedaAsignador, setBusquedaAsignador] = useState("");

  // --- ESTADOS: COLUMNA 3 (Extras) ---
  const [incluirCanceladas, setIncluirCanceladas] = useState(false);
  const [incluirInstrucciones, setIncluirInstrucciones] = useState(false);
  const [incluirCumplimiento, setIncluirCumplimiento] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      setErrorUsuarios(false);
      try {
        const response = await usuariosService.getAll({ limit: 1000 });
        let usuariosDB = response.data;

        if (user?.rol !== Rol.SUPER_ADMIN && user?.departamentoId) {
          usuariosDB = usuariosDB.filter(
            (u) => u.departamentoId === user.departamentoId || u.rol === Rol.INVITADO
          );
        }

        setListaUsuarios(usuariosDB.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setErrorUsuarios(true);
      } finally {
        setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
  }, [user]);

  // --- Handlers UI ---
  const handleToggle = (lista: string[], valor: string, setLista: React.Dispatch<React.SetStateAction<string[]>>) => {
    setLista(lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]);
  };

  const handleToggleUsuario = (listaIds: number[], id: number, setLista: React.Dispatch<React.SetStateAction<number[]>>) => {
    setLista(listaIds.includes(id) ? listaIds.filter(uid => uid !== id) : [...listaIds, id]);
  };

  const getRoleColorClass = (userToDisplay: Usuario): string => {
    if (userToDisplay.rol === Rol.ENCARGADO) return "text-blue-700 font-semibold";
    if (userToDisplay.rol === Rol.USUARIO) return "text-rose-700 font-semibold";
    return "text-gray-800";
  };

  const validateFechas = () => {
    if (rango !== "PERSONALIZADO") return true;
    if (!fechaInicio || !fechaFin) return false;
    return new Date(`${fechaInicio}T00:00:00`) <= new Date(`${fechaFin}T23:59:59`);
  };

  // --- Lógica de Exportación ---
  const handleExportar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateFechas()) return;
    if (estatusSeleccionados.length === 0 && !incluirCanceladas) return;
    if (prioridadesSeleccionadas.length === 0) return;

    setLoading(true);

    try {
      const res = await tareasService.getAll({
        limit: 10000,
        departamentoId: user?.rol !== Rol.SUPER_ADMIN ? (user?.departamentoId ?? undefined) : undefined
      });
      let tareasFiltradas = res.data;

      // 1. Filtrar por Fechas
      if (rango !== "TODAS") {
        const now = new Date();
        let fInicio = 0, fFin = 0;

        if (rango === "HOY") {
          fInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
          fFin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
        } else if (rango === "ESTA_SEMANA") {
          const diaSemana = now.getDay() || 7;
          fInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diaSemana + 1, 0, 0, 0).getTime();
          fFin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - diaSemana), 23, 59, 59).getTime();
        } else if (rango === "MES_ACTUAL") {
          fInicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime();
          fFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
        } else if (rango === "PERSONALIZADO") {
          fInicio = new Date(`${fechaInicio}T00:00:00`).getTime();
          fFin = new Date(`${fechaFin}T23:59:59`).getTime();
        }

        tareasFiltradas = tareasFiltradas.filter((t: any) => {
          if (tipoFecha === "REGISTRO") {
            if (!t.fechaRegistro) return false;
            const targetTime = new Date(t.fechaRegistro).getTime();
            return targetTime >= fInicio && targetTime <= fFin;
          } else {
            const limiteEfectivo = t.historialFechas && t.historialFechas.length > 0
              ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha).getTime()
              : t.fechaLimite ? new Date(t.fechaLimite).getTime() : 0;
            return limiteEfectivo >= fInicio && limiteEfectivo <= fFin;
          }
        });
      }

      // 2. Filtro de Estatus y Prioridad
      const estatusPermitidos = [...estatusSeleccionados];
      if (incluirCanceladas) estatusPermitidos.push("CANCELADA");
      tareasFiltradas = tareasFiltradas.filter((t: any) => estatusPermitidos.includes(t.estatus) && prioridadesSeleccionadas.includes(t.urgencia));

      // 3. Filtro de Asignadores y Responsables
      if (asignadoresIds.length > 0) {
        tareasFiltradas = tareasFiltradas.filter((t: any) => asignadoresIds.includes(t.asignadorId));
      }
      if (responsablesIds.length > 0) {
        tareasFiltradas = tareasFiltradas.filter((t: any) => t.responsables.some((r: any) => responsablesIds.includes(r.id || r.usuario?.id)));
      }

      if (tareasFiltradas.length === 0) {
        toast.error("No se encontraron tareas con los filtros seleccionados.");
        setLoading(false);
        return;
      }

      // 4. Mapeo a Excel
      const datosExcel = tareasFiltradas.map((t: any) => {
        const fechaLimiteReal = t.historialFechas && t.historialFechas.length > 0
          ? t.historialFechas[t.historialFechas.length - 1].nuevaFecha
          : t.fechaLimite;

        const base: any = {
          "ID": t.id,
          "Tarea": t.tarea,
          "Estatus": t.estatus,
          "Urgencia": t.urgencia,
          "Dpto": t.departamento?.nombre || "N/A",
          "Asignó": t.asignador?.nombre || "N/A",
          "Responsable(s)": t.responsables && t.responsables.length > 0
            ? t.responsables.map((r: any) => r.nombre || r.usuario?.nombre || "").join(", ") : "Sin asignar",
          "F. Registro": formatearFechaExcel(t.fechaRegistro),
          "F. Límite": formatearFechaExcel(fechaLimiteReal),
        };

        if (t.estatus !== "PENDIENTE") {
          base["F. Entrega"] = formatearFechaExcel(t.fechaEntrega);
          base["F. Conclusión"] = formatearFechaExcel(t.fechaConclusion);
        } else {
          base["F. Entrega"] = "N/A";
          base["F. Conclusión"] = "N/A";
        }

        if (incluirInstrucciones) {
          base["Instrucciones Adicionales"] = t.observaciones || "Sin instrucciones.";
          base["Feedback de Revisión"] = t.feedbackRevision || "";
        }

        if (incluirCumplimiento) {
          let analisis = "N/A";
          const limite = new Date(fechaLimiteReal).getTime();
          if (t.estatus === "PENDIENTE") {
            analisis = new Date().getTime() > limite ? "Atrasada" : "En tiempo";
          } else if (t.estatus === "EN_REVISION" || t.estatus === "CONCLUIDA") {
            const fc = t.fechaEntrega ? new Date(t.fechaEntrega).getTime() : (t.fechaConclusion ? new Date(t.fechaConclusion).getTime() : 0);
            if (fc) analisis = fc > limite ? "Entregada con Retraso" : "Entregada A Tiempo";
          }
          base["Análisis de Cumplimiento"] = analisis;
        }

        return base;
      });

      const worksheet = XLSX.utils.json_to_sheet(datosExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas");

      const wscols = [{ wch: 8 }, { wch: 45 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, `Reporte_Tareas_${formatDateToInput(new Date())}.xlsx`);
      toast.success(`Exportación exitosa. (${tareasFiltradas.length} tareas procesadas)`);
      onClose();

    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al generar el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  const responsablesFiltrados = listaUsuarios.filter((u) => u.nombre.toLowerCase().includes(busquedaResponsable.toLowerCase()));
  const asignadoresFiltrados = listaUsuarios.filter((u) => u.nombre.toLowerCase().includes(busquedaAsignador.toLowerCase()));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] md:max-w-md lg:max-w-6xl relative flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <MicrosoftExcel className="w-8 h-8" />
            <h2 className="text-lg font-bold text-amber-950 uppercase tracking-wide">
              Exportar Tareas a Excel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold cursor-pointer transition-colors"
            aria-label="Cerrar modal"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleExportar}
          className="flex flex-col flex-grow min-h-0"
          noValidate
        >
          <div className="flex-grow overflow-y-auto p-6">
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6 text-gray-800">

              {/* --- COLUMNA 1: FECHAS --- */}
              <div className="flex flex-col gap-4">

                <div>
                  <label className="block text-sm font-semibold mb-1">Referencia de búsqueda</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTipoFecha("LIMITE")}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${tipoFecha === "LIMITE" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Fecha Límite
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoFecha("REGISTRO")}
                      className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all cursor-pointer ${tipoFecha === "REGISTRO" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Fecha de Registro
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Periodo a exportar</label>
                  <select
                    value={rango}
                    onChange={(e) => setRango(e.target.value as TipoRango)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="HOY">Día de Hoy</option>
                    <option value="ESTA_SEMANA">Esta Semana</option>
                    <option value="MES_ACTUAL">Mes Actual</option>
                    <option value="PERSONALIZADO">Rango Personalizado...</option>
                    <option value="TODAS">Todo el Historial</option>
                  </select>
                </div>

                {rango === "PERSONALIZADO" && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Desde</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        disabled={loading}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none cursor-pointer ${submitted && !fechaInicio ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                      />
                      {submitted && !fechaInicio && <p className="text-red-600 text-xs mt-1">Requerido.</p>}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Hasta</label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        disabled={loading}
                        min={fechaInicio}
                        className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none cursor-pointer ${submitted && !fechaFin ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                      />
                      {submitted && !fechaFin && <p className="text-red-600 text-xs mt-1">Requerido.</p>}
                    </div>
                  </div>
                )}
                {submitted && rango === "PERSONALIZADO" && fechaInicio && fechaFin && !validateFechas() && (
                  <p className="text-red-600 text-xs mt-1">La fecha "Hasta" no puede ser anterior.</p>
                )}

                <div>
                  <label className="block text-sm font-semibold mb-1 mt-2">Estatus a incluir</label>
                  <div className="grid grid-cols-1 gap-2 mt-1">
                    {["PENDIENTE", "EN_REVISION", "CONCLUIDA"].map((est) => (
                      <label key={est} className="flex items-center gap-2 cursor-pointer w-fit">
                        <input type="checkbox" checked={estatusSeleccionados.includes(est)} onChange={() => handleToggle(estatusSeleccionados, est, setEstatusSeleccionados)} className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                        <span className="text-sm font-medium">{est.replace("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                  {submitted && estatusSeleccionados.length === 0 && !incluirCanceladas && (
                    <p className="text-red-600 text-xs mt-1">Selecciona al menos un estatus.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 mt-2">Prioridad</label>
                  <fieldset className="mt-1 grid grid-cols-3 gap-2">
                    {["ALTA", "MEDIA", "BAJA"].map((pri) => (
                      <div key={pri}>
                        <input
                          type="checkbox"
                          id={`pri-${pri}`}
                          checked={prioridadesSeleccionadas.includes(pri)}
                          onChange={() => handleToggle(prioridadesSeleccionadas, pri, setPrioridadesSeleccionadas)}
                          disabled={loading}
                          className="sr-only peer"
                        />
                        <label
                          htmlFor={`pri-${pri}`}
                          className={`
                            w-full block text-center px-2 py-1.5 rounded-md 
                            border text-sm font-semibold cursor-pointer transition-all
                            border-gray-300 bg-gray-50 text-gray-700
                            peer-checked:bg-amber-100 peer-checked:text-amber-900 peer-checked:border-amber-400
                            hover:bg-gray-100
                          `}
                        >
                          {pri}
                        </label>
                      </div>
                    ))}
                  </fieldset>
                  {submitted && prioridadesSeleccionadas.length === 0 && (
                    <p className="text-red-600 text-xs mt-1">Selecciona al menos una prioridad.</p>
                  )}
                </div>

              </div>

              {/* --- COLUMNA 2: RESPONSABLES --- */}
              <div className="flex flex-col gap-4">

                {/* Bloque Responsables */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold">
                      Responsable(s)
                    </label>
                    {responsablesIds.length > 0 && (
                      <span className="text-xs text-amber-600 font-bold">({responsablesIds.length} filtrados)</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar responsable..."
                    value={busquedaResponsable}
                    onChange={(e) => setBusquedaResponsable(e.target.value)}
                    disabled={loading || loadingUsuarios}
                    className="w-full border rounded-md px-3 py-2 mb-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100"
                  />
                  <div className="relative w-full h-32 lg:h-44 border rounded-md overflow-y-auto focus:ring-2 focus:ring-amber-950 border-gray-300 bg-white" tabIndex={0}>
                    {loadingUsuarios ? (
                      <div className="flex items-center justify-center h-full"><p className="text-gray-500 text-sm">Cargando...</p></div>
                    ) : (
                      <>
                        {responsablesIds.length === 0 && !busquedaResponsable && (
                          <div className="sticky top-0 bg-blue-50 text-blue-800 text-xs font-bold text-center py-1 border-b z-10 shadow-sm">
                            Exportando TODOS
                          </div>
                        )}
                        {responsablesFiltrados.map((u) => (
                          <label key={u.id} className={`flex items-center gap-3 w-full px-3 py-2 cursor-pointer transition-colors ${responsablesIds.includes(u.id) ? "bg-amber-100 text-amber-900 font-semibold" : "text-gray-800 hover:bg-gray-50"}`}>
                            <input type="checkbox" checked={responsablesIds.includes(u.id)} onChange={() => handleToggleUsuario(responsablesIds, u.id, setResponsablesIds)} className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                            <span className={getRoleColorClass(u)}>{u.nombre}</span>
                            {u.id === user?.id && <span className="text-xs text-gray-500 ml-auto">(Tú)</span>}
                          </label>
                        ))}
                        {responsablesFiltrados.length === 0 && !errorUsuarios && <p className="text-center text-sm py-4 text-gray-500">No se encontraron resultados.</p>}
                      </>
                    )}
                  </div>
                </div>

                {/* Bloque Asignadores */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold">
                      Asignada por
                    </label>
                    {asignadoresIds.length > 0 && (
                      <span className="text-xs text-amber-600 font-bold">({asignadoresIds.length} filtrados)</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar asignador..."
                    value={busquedaAsignador}
                    onChange={(e) => setBusquedaAsignador(e.target.value)}
                    disabled={loading || loadingUsuarios}
                    className="w-full border rounded-md px-3 py-2 mb-2 focus:ring-2 focus:ring-amber-950 focus:outline-none disabled:bg-gray-100"
                  />
                  <div className="relative w-full h-32 lg:h-44 border rounded-md overflow-y-auto focus:ring-2 focus:ring-amber-950 border-gray-300 bg-white" tabIndex={0}>
                    {loadingUsuarios ? (
                      <div className="flex items-center justify-center h-full"><p className="text-gray-500 text-sm">Cargando...</p></div>
                    ) : (
                      <>
                        {asignadoresIds.length === 0 && !busquedaAsignador && (
                          <div className="sticky top-0 bg-blue-50 text-blue-800 text-xs font-bold text-center py-1 border-b z-10 shadow-sm">
                            Exportando TODOS
                          </div>
                        )}
                        {asignadoresFiltrados.map((u) => (
                          <label key={u.id} className={`flex items-center gap-3 w-full px-3 py-2 cursor-pointer transition-colors ${asignadoresIds.includes(u.id) ? "bg-amber-100 text-amber-900 font-semibold" : "text-gray-800 hover:bg-gray-50"}`}>
                            <input type="checkbox" checked={asignadoresIds.includes(u.id)} onChange={() => handleToggleUsuario(asignadoresIds, u.id, setAsignadoresIds)} className="w-4 h-4 text-amber-800 bg-gray-100 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                            <span className={getRoleColorClass(u)}>{u.nombre}</span>
                            {u.id === user?.id && <span className="text-xs text-gray-500 ml-auto">(Tú)</span>}
                          </label>
                        ))}
                        {asignadoresFiltrados.length === 0 && !errorUsuarios && <p className="text-center text-sm py-4 text-gray-500">No se encontraron resultados.</p>}
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* --- COLUMNA 3: DETALLES EXTRA --- */}
              <div className="flex flex-col gap-4">

                <label className="block text-sm font-semibold mb-1">
                  Datos Adicionales
                </label>

                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-amber-400 transition-colors">
                    <input type="checkbox" checked={incluirCanceladas} onChange={(e) => setIncluirCanceladas(e.target.checked)} className="w-4 h-4 mt-0.5 text-amber-800 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                    <div className="leading-tight">
                      <span className="block text-sm font-semibold text-gray-800">Incluir Canceladas</span>
                      <span className="text-xs text-gray-500">Suma las tareas enviadas a la papelera.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-amber-400 transition-colors">
                    <input type="checkbox" checked={incluirInstrucciones} onChange={(e) => setIncluirInstrucciones(e.target.checked)} className="w-4 h-4 mt-0.5 text-amber-800 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                    <div className="leading-tight">
                      <span className="block text-sm font-semibold text-gray-800">Añadir Instrucciones</span>
                      <span className="text-xs text-gray-500">Exporta las indicaciones y el feedback.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-amber-400 transition-colors">
                    <input type="checkbox" checked={incluirCumplimiento} onChange={(e) => setIncluirCumplimiento(e.target.checked)} className="w-4 h-4 mt-0.5 text-amber-800 border-gray-300 rounded focus:ring-amber-950 cursor-pointer" />
                    <div className="leading-tight">
                      <span className="block text-sm font-semibold text-gray-800">Análisis de Cumplimiento</span>
                      <span className="text-xs text-gray-500">Evalúa entregas "A Tiempo" o "Con Retraso".</span>
                    </div>
                  </label>
                </div>

                <div className="mt-auto bg-amber-50 text-amber-900 p-4 rounded-md text-sm flex gap-2 items-start border border-amber-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="leading-relaxed">
                    Dependiendo de la cantidad de tareas seleccionadas, el archivo Excel podría tardar unos segundos en generarse. El formato del archivo será <b className="font-bold">.xlsx</b> nativo.
                  </p>
                </div>

              </div>

            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 p-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md transition-all duration-200 disabled:opacity-70 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"} bg-green-600 text-white font-semibold px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Generando...
                </>
              ) : (
                <>
                  <MicrosoftExcel className="w-5 h-5 grayscale opacity-90 brightness-200" />
                  Descargar Excel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalExportar;