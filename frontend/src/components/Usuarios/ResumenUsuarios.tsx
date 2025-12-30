import React from "react";
import type { Usuario } from "../../types/usuario";

interface ResumenUsuariosProps {
  // Ya no necesitamos filtro ni onFiltroChange porque solo mostramos el total
  // pero mantenemos query y usuarios para el cálculo correcto
  query: string;
  usuarios: Usuario[];
  loading: boolean;
}

const ResumenUsuarios: React.FC<ResumenUsuariosProps> = ({
  query,
  usuarios,
  loading,
}) => {
  // 1. Filtrar por búsqueda para que el total refleje lo que se ve en tabla
  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.username}`.toLowerCase();
    return query.trim() === "" || texto.includes(query.toLowerCase());
  });

  const total = usuariosFiltrados.length;

  // Render de carga minimalista
  if (loading) {
    return (
      <div className="flex justify-center items-center h-16 text-gray-400 italic text-sm">
        Calculando total...
      </div>
    );
  }

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO (Tarjeta Centrada) */}
      <div className="hidden lg:flex justify-center mb-6">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center shadow-sm w-48">
          <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
            Total Usuarios
          </div>
          <div className="text-3xl font-extrabold text-gray-800 mt-1">
            {total}
          </div>
        </div>
      </div>

      {/* 📱 VERSIÓN MÓVIL (Píldora Centrada) */}
      <div className="lg:hidden flex justify-center mb-4 px-3">
        <div
          className={`
            flex justify-between items-center 
            w-60 max-w-xs px-5 py-2.5 
            rounded-full border border-gray-300 
            shadow-sm bg-gray-50 text-gray-700
          `}
        >
          <span className="font-semibold text-[15px] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Usuarios
          </span>
          <span className="font-bold text-[18px] opacity-90 text-gray-900">
            {total}
          </span>
        </div>
      </div>
    </>
  );
};

export default ResumenUsuarios;