import React from "react";
import type { Usuario } from "../../../types/usuario";
import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  usuarios: Usuario[];
  deptos: Departamento[];
  loading: boolean;
  onEdit: (usuario: Usuario) => void;
  onToggleStatus: (usuario: Usuario) => void;
  mostrarInactivos: boolean;
}

const TablaUsuarios = ({ usuarios, deptos, loading, onEdit, onToggleStatus }: Props) => {

  const getNombreDepto = (id?: number | null) => {
    if (!id) return <span className="text-slate-400 italic text-xs">Global / N/A</span>;
    const d = deptos.find((dept) => dept.id === id);
    return d ? (
      <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs font-medium border border-indigo-100">
        {d.nombre}
      </span>
    ) : "Desconocido";
  };

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case "SUPER_ADMIN": return "bg-purple-100 text-purple-700 border-purple-200";
      case "ADMIN": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ENCARGADO": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Rol & Acceso</th>
              <th className="p-4">Departamento</th>
              <th className="p-4 text-center">Estatus</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">Cargando usuarios...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No se encontraron usuarios.</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.estatus === 'INACTIVO' ? 'bg-slate-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.estatus === 'INACTIVO' ? 'bg-slate-400' : 'bg-indigo-500'}`}>
                        {u.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-bold ${u.estatus === 'INACTIVO' ? 'text-slate-500' : 'text-slate-800'}`}>{u.nombre}</p>
                        <p className="text-xs text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getRolBadge(u.rol)}`}>
                      {u.rol.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    {getNombreDepto(u.departamentoId)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${u.estatus === 'ACTIVO' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                      {u.estatus}
                    </span>
                  </td>

                  {/* ACCIONES ESTILIZADAS */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">

                      {/* Editar (Estilo Ámbar) */}
                      <button
                        onClick={() => onEdit(u)}
                        title="Editar usuario"
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                        </svg>
                      </button>

                      {/* Toggle Estatus (Borrar/Restaurar) */}
                      <button
                        onClick={() => onToggleStatus(u)}
                        title={u.estatus === 'ACTIVO' ? "Desactivar usuario" : "Reactivar usuario"}
                        className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-200 ${u.estatus === 'ACTIVO'
                            ? 'border-red-400 text-red-600 hover:bg-red-600 hover:text-white' // Estilo Borrar
                            : 'border-green-400 text-green-700 hover:bg-green-100' // Estilo Reactivar (Verde)
                          }`}
                      >
                        {u.estatus === 'ACTIVO' ? (
                          /* Icono Papelera (Delete) */
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                          </svg>
                        ) : (
                          /* Icono Check (Restaurar/Completar) */
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaUsuarios;