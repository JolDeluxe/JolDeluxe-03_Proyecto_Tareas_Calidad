// 📍 src/components/layout/HeaderMobile.tsx

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// 1. Importar los tipos Usuario y Rol
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

// 2. Definir la interfaz de props que recibe
interface HeaderMobileProps {
  user: Usuario | null;
}

// 3. Aceptar 'user' como prop y cambiar el tipo de React.FC
const HeaderMobile: React.FC<HeaderMobileProps> = ({ user }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // 4. 'isLoggedIn' se elimina, usaremos 'user'
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  // 5. Función para verificar si se muestra el link de Admin (con corrección de TS)
  const puedeVerAdmin = () => {
    if (!user) return false;
    // Definimos el tipo del array para TypeScript
    const rolesPermitidos: Rol[] = [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.ENCARGADO];
    return rolesPermitidos.includes(user.rol);
  };

  return (
    <nav>
      <div className="relative flex items-center justify-between px-4 py-1 md:py-3">
        {/* Logo centrado */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img
            src="/img/01_Cuadra.webp"
            alt="Cuadra"
            className="w-[120px] md:w-[160px] select-none"
          />
        </div>

        {/* Botón hamburguesa */}
        <button
          onClick={() => setOpen(!open)}
          className="z-50 p-2 focus:outline-none"
        >
          <svg
            className="w-7 h-7 md:w-9 md:h-9 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {user && !open && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 text-xs font-semibold normal-case">
            <span className="font-bold">{user.nombre.split(" ")[0]}</span>
          </div>
        )}
      </div>

      {/* Menú desplegable */}
      {open && (
        <div
          className="flex flex-col bg-white/80 backdrop-blur-xl border-t border-amber-100 
            shadow-[0_-2px_20px_rgba(0,0,0,0.08)] rounded-b-2xl 
            animate-slide-down transition-all duration-300 z-50
            p-3 space-y-1"
        >
          {[
            {
              to: "/pendientes",
              label: "Pendientes",
            },
            {
              to: "/todas",
              label: "Todas",
            },
            // 7. Lógica de menú condicional basada en 'user' y su rol
            ...(user && puedeVerAdmin()
              ? [
                  {
                    to: "/admin",
                    label: "Administrar",
                  },
                ]
              : []),
          ].map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex  justify-center items-center gap-3 w-full text-left 
                  px-4 py-3 rounded-lg 
                  text-base font-semibold tracking-wide
                  transition-colors duration-200 active:scale-[0.98]
                  ${
                    isActive
                      ? "text-amber-900 bg-amber-100"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span>{label}</span>
              </Link>
            );
          })}

          {/* Separador */}
          <hr className="my-2 border-gray-200/60" />

          {/* 8. Botón de logout condicional (solo si 'user' existe) */}
          {user && (
            <button
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
              className="flex justify-center items-center gap-3 w-full text-left 
                px-4 py-3 rounded-lg 
                text-base font-semibold tracking-wide 
                text-red-700 hover:bg-red-50 active:scale-[0.98] 
                transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default HeaderMobile;
