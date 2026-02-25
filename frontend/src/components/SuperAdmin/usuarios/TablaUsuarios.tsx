import React from "react";
import type { Usuario } from "../../../types/usuario";
import type { Departamento } from "../../../api/departamentos.service";

type SortKey = keyof Usuario | "rolJerarquia";
interface SortConfig {
  key: SortKey;
  direction: "asc" | "desc";
}

interface Props {
  usuarios: Usuario[];
  total: number;
  deptos: Departamento[];
  loading: boolean;
  onEdit: (usuario: Usuario) => void;
  onToggleStatus: (usuario: Usuario) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  sortConfig: SortConfig;
  onSortChange: (key: SortKey, direction: "asc" | "desc") => void;
}

const TablaUsuarios = ({ usuarios, total, deptos, loading, onEdit, onToggleStatus, page, totalPages, onPageChange, sortConfig, onSortChange }: Props) => {

  const handleSort = (key: SortKey) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    onSortChange(key, direction);
  };

  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 text-[10px] ml-1">⇅</span>;
    return sortConfig.direction === "asc" ? <span className="text-indigo-600 ml-1 font-bold">↑</span> : <span className="text-indigo-600 ml-1 font-bold">↓</span>;
  };

  const getNombreDepto = (id?: number | null) => {
    if (!id) return <span className="text-slate-400 italic text-xs">Global / N/A</span>;
    const d = deptos.find((dept) => dept.id === id);
    return d ? <span className="text-indigo-700 font-bold">{d.nombre}</span> : "Desconocido";
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl border border-slate-200">
        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-slate-500 font-bold">Cargando base de datos...</span>
      </div>
    );
  }

  return (
    <div className="w-full text-sm font-sans">
      {usuarios.length > 0 ? (
        <>
          {/* --- ESCRITORIO --- */}
          <div className="hidden lg:block bg-white rounded-t-xl border-t border-x border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition select-none w-[30%]" onClick={() => handleSort("nombre")}>Usuario {getSortIcon("nombre")}</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition select-none text-center" onClick={() => handleSort("rolJerarquia")}>Rol & Acceso {getSortIcon("rolJerarquia")}</th>
                  <th className="px-4 py-3 text-center">Departamento</th>
                  <th className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition select-none text-center" onClick={() => handleSort("estatus")}>Estatus {getSortIcon("estatus")}</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.estatus === 'INACTIVO' ? 'bg-slate-50/50 grayscale-[30%]' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${u.estatus === 'INACTIVO' ? 'bg-slate-400' : 'bg-indigo-500'}`}>
                          {u.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold truncate ${u.estatus === 'INACTIVO' ? 'text-slate-500' : 'text-slate-800'}`}>{u.nombre}</p>
                          <p className="text-xs text-slate-500 truncate font-mono">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase whitespace-nowrap 
                        ${u.rol === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          u.rol === 'ADMIN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            u.rol === 'ENCARGADO' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {u.rol.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      {getNombreDepto(u.departamentoId)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border 
                        ${u.estatus === 'ACTIVO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {u.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2 relative">
                        {/* Editar */}
                        <div className="group relative">
                          <button
                            onClick={() => onEdit(u)}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 hover:bg-amber-100 bg-amber-50 shadow-sm transition-all duration-200 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            Editar
                            <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>

                        {/* Desactivar/Reactivar */}
                        <div className="group relative">
                          <button
                            onClick={() => onToggleStatus(u)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md border shadow-sm transition-all duration-200 cursor-pointer ${u.estatus === 'ACTIVO'
                              ? 'border-red-400 text-red-600 hover:bg-red-100 bg-red-50'
                              : 'border-green-400 text-green-700 hover:bg-green-100 bg-green-50'
                              }`}
                          >
                            {u.estatus === 'ACTIVO' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" /></svg>
                            )}
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {u.estatus === 'ACTIVO' ? "Desactivar" : "Reactivar"}
                            <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- MÓVIL --- */}
          <div className="grid lg:hidden gap-3 mb-2">
            {usuarios.map((u) => (
              <div key={u.id} className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${u.estatus === 'INACTIVO' ? 'bg-slate-400' : 'bg-indigo-500'}`}>
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight">{u.nombre}</h3>
                      <p className="font-mono text-xs text-slate-500">{u.username}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border 
                    ${u.estatus === 'ACTIVO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {u.estatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Rol</p>
                    <p className="font-bold text-slate-700">{u.rol.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Depto</p>
                    <p>{getNombreDepto(u.departamentoId)}</p>
                  </div>
                </div>

                <div className="flex justify-around items-center pt-2 border-t border-slate-100 mt-1">
                  <button onClick={() => onEdit(u)} className="flex flex-col items-center text-amber-600 hover:text-amber-700 transition cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                    <span className="text-[10px] font-bold uppercase mt-1">Editar</span>
                  </button>
                  <button onClick={() => onToggleStatus(u)} className={`flex flex-col items-center transition cursor-pointer ${u.estatus === 'ACTIVO' ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                    {u.estatus === 'ACTIVO' ? (
                      <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg><span className="text-[10px] font-bold uppercase mt-1">Quitar</span></>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6" fill="currentColor"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" /></svg><span className="text-[10px] font-bold uppercase mt-1">Activar</span></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* --- PAGINACIÓN BASE (El padre la controla) --- */}
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
          No hay usuarios registrados o que coincidan con el filtro actual.
        </div>
      )}
    </div>
  );
};

export default TablaUsuarios;