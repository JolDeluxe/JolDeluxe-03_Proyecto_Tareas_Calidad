import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  deptos: Departamento[];
  loading: boolean;
  onEdit: (depto: Departamento) => void;
}

const TablaDeptos = ({ deptos, loading, onEdit }: Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Departamento</th>
              <th className="p-4">Jefatura (Admin)</th>
              <th className="p-4 text-center">Personal</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">
                  Cargando información...
                </td>
              </tr>
            ) : deptos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No hay departamentos registrados.
                </td>
              </tr>
            ) : (
              deptos.map((d) => {
                const jefe = d.usuarios?.find(u => u.rol === 'ADMIN');

                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-slate-400 font-mono">#{d.id}</td>
                    <td className="p-4 font-bold text-slate-800 text-base">
                      {d.nombre}
                    </td>
                    <td className="p-4">
                      {jefe ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {jefe.nombre.charAt(0)}
                          </div>
                          <span className="text-slate-700 font-medium">{jefe.nombre}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span className="font-bold">{d._count?.usuarios || 0}</span>
                      </div>
                    </td>

                    {/* ACCIONES ESTILIZADAS */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(d)}
                          title="Editar departamento"
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaDeptos;