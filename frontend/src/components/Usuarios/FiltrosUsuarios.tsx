import React from "react";
import type { Usuario } from "../../types/usuario";

interface FiltrosProps {
  onBuscarChange: (query: string) => void;
  user: Usuario | null;
}

const FiltrosUsuarios: React.FC<FiltrosProps> = ({
  onBuscarChange,
  // user, // Prop disponible por si quieres mostrar algo específico del usuario logueado
}) => {
  return (
    <div className="w-full bg-white font-sans border-b border-gray-200">

      {/* 💻 VISTA ESCRITORIO */}
      <div className="hidden lg:flex lg:items-center lg:justify-end gap-4 p-4 bg-white">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar usuario por nombre o username..."
            onChange={(e) => onBuscarChange(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* 📱 VISTA MÓVIL */}
      <div className="block lg:hidden p-3">
        <div className="flex gap-2 items-center mb-1">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar usuario..."
              onChange={(e) => onBuscarChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltrosUsuarios;