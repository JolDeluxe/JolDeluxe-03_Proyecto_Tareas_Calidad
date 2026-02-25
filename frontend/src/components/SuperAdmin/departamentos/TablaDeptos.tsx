import React from "react";
import type { Departamento } from "../../../api/departamentos.service";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface Props {
  deptos: Departamento[];
  total: number;
  loading: boolean;
  onEdit: (depto: Departamento) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortConfig: SortConfig;
  onSortChange: (key: string, direction: "asc" | "desc") => void;
}

const TablaDeptos = ({ deptos, total, loading, onEdit, page, totalPages, onPageChange, sortConfig, onSortChange }: Props) => {

  const handleSort = (key: string) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    onSortChange(key, direction);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 text-[10px] ml-1">⇅</span>;
    return sortConfig.direction === "asc" ? <span className="text-indigo-600 ml-1 font-bold">↑</span> : <span className="text-indigo-600 ml-1 font-bold">↓</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl border border-slate-200">
        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-slate-500 font-bold">Cargando departamentos...</span>
      </div>
    );
  }

  return (
    <div className="w-full text-sm font-sans">
      {deptos.length > 0 ? (
        <>
          {/* --- ESCRITORIO --- */}
          <div className="hidden lg:block bg-white rounded-t-xl border-t border-x border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition select-none w-20" onClick={() => handleSort("id")}>ID {getSortIcon("id")}</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition select-none w-[35%]" onClick={() => handleSort("nombre")}>Departamento {getSortIcon("nombre")}</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition select-none w-[30%]" onClick={() => handleSort("jefe")}>Jefatura (Admin) {getSortIcon("jefe")}</th>
                  <th className="p-4 cursor-pointer hover:bg-slate-200 transition select-none text-center" onClick={() => handleSort("personal")}>Personal {getSortIcon("personal")}</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {deptos.map((d) => {
                  const jefe = d.usuarios?.find(u => u.rol === 'ADMIN');
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-400 font-mono font-bold">#{d.id}</td>
                      <td className="p-4 font-bold text-slate-800 text-base">{d.nombre}</td>
                      <td className="p-4">
                        {jefe ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm border border-indigo-200">
                              {jefe.nombre.charAt(0)}
                            </div>
                            <span className="text-slate-700 font-medium">{jefe.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs bg-slate-100 px-2 py-1 rounded-md">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          <span className="font-extrabold">{d._count?.usuarios || 0}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2 relative">
                          <div className="group relative">
                            <button
                              onClick={() => onEdit(d)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 hover:bg-amber-100 bg-amber-50 shadow-sm transition-all duration-200 cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Editar Depto
                              <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* --- MÓVIL --- */}
          <div className="grid lg:hidden gap-3 mb-2">
            {deptos.map((d) => {
              const jefe = d.usuarios?.find(u => u.rol === 'ADMIN');
              return (
                <div key={d.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex flex-col gap-3 relative">
                  <div className="absolute top-3 right-4 text-xs font-mono text-slate-300 font-bold">#{d.id}</div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1 pr-8">{d.nombre}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Jefatura</p>
                      {jefe ? (
                        <p className="font-bold text-indigo-700 flex items-center gap-1.5">
                          <span className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-[8px] text-indigo-800 border border-indigo-300">{jefe.nombre.charAt(0)}</span>
                          <span className="truncate">{jefe.nombre.split(" ")[0]}</span>
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Sin asignar</span>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase text-[9px] mb-1">Personal</p>
                      <p className="font-extrabold text-emerald-600 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        {d._count?.usuarios || 0} integrantes
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 mt-1">
                    <button onClick={() => onEdit(d)} className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition cursor-pointer font-bold text-[11px] uppercase tracking-wide">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- PAGINACIÓN BASE --- */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 border border-slate-200 bg-white lg:rounded-b-xl shadow-sm gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Mostrando página <span className="font-extrabold text-slate-800">{page}</span> de <span className="font-extrabold text-slate-800">{totalPages}</span>
              <span className="mx-2">|</span>
              Total evaluable: <span className="font-extrabold text-slate-800">{total}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Anterior
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer active:scale-95"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-40 bg-white border border-slate-200 rounded-xl text-slate-500 font-semibold italic text-sm shadow-sm">
          No hay departamentos registrados o que coincidan con la búsqueda.
        </div>
      )}
    </div>
  );
};

export default TablaDeptos;