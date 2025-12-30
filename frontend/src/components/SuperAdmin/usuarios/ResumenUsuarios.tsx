import type { Usuario } from "../../../types/usuario";

interface Props {
  usuarios: Usuario[];
  onFilterChange: (filtro: string) => void;
  filtroActual: string;
}

const ResumenUsuarios = ({ usuarios, onFilterChange, filtroActual }: Props) => {
  const total = usuarios.length;
  const adminCount = usuarios.filter(u => u.rol === 'ADMIN').length;
  const encargadosCount = usuarios.filter(u => u.rol === 'ENCARGADO').length;
  const usuariosCount = usuarios.filter(u => u.rol === 'USUARIO').length;

  // Botón auxiliar para estilo
  const FilterButton = ({ label, count, value, colorClass }: any) => (
    <button
      onClick={() => onFilterChange(value)}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${filtroActual === value
          ? `bg-white border-${colorClass}-500 ring-1 ring-${colorClass}-500 shadow-md`
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm opacity-80 hover:opacity-100'
        }`}
    >
      <div className="text-left">
        <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{count}</p>
      </div>
      <div className={`w-2 h-2 rounded-full bg-${colorClass}-500`}></div>
    </button>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <FilterButton label="Todos" count={total} value="ALL" colorClass="indigo" />
      <FilterButton label="Administrativos" count={adminCount} value="ADMIN" colorClass="blue" />
      <FilterButton label="Encargados" count={encargadosCount} value="ENCARGADO" colorClass="amber" />
      <FilterButton label="Operativos" count={usuariosCount} value="USUARIO" colorClass="slate" />
    </div>
  );
};

export default ResumenUsuarios;