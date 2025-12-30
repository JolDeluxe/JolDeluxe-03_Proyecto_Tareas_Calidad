import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  deptos: Departamento[];
  loading: boolean;
}

const ResumenDeptos = ({ deptos, loading }: Props) => {
  const totalDeptos = deptos.length;
  const totalPersonal = deptos.reduce((acc, d) => acc + (d._count?.usuarios || 0), 0);

  if (loading) return <div className="h-24 bg-slate-100 rounded-xl animate-pulse"></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Áreas</p>
        <p className="text-2xl font-bold text-slate-800">{totalDeptos}</p>
      </div>

      {/* Personal */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Personal Total</p>
        <p className="text-2xl font-bold text-slate-800">{totalPersonal}</p>
      </div>
    </div>
  );
};

export default ResumenDeptos;