// 📍 src/components/layout/HeaderMobile.tsx

import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface HeaderMobileProps {
  user: Usuario | null;
}

const HeaderMobile: React.FC<HeaderMobileProps> = ({ user }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const puedeVerAdminTareas = () => {
    if (!user) return false;
    return user.rol === Rol.ADMIN || user.rol === Rol.ENCARGADO;
  };

  const puedeVerGestionUsuarios = () => {
    if (!user) return false;
    return user.rol === Rol.ADMIN;
  };

  const getMenuItems = () => {
    if (!user) return [];

    // Menú exclusivo para SUPER_ADMIN
    if (user.rol === Rol.SUPER_ADMIN) {
      return [
        { to: "/super-admin", label: "Panel Maestro" },
        { to: "/super-admin?tab=DEPTOS", label: "Departamento" },
        { to: "/super-admin?tab=USUARIOS", label: "Mi Equipo" },
        { to: "/super-admin?tab=LOGS", label: "Terminal" },
      ];
    }

    // Menú base
    const items = [
      { to: "/pendientes", label: "Pendientes" },
    ];

    // ✅ CORREGIDO: "Todas" solo para el rol USUARIO
    // if (user.rol === Rol.USUARIO) {
    //   items.push({ to: "/todas", label: "Todas" });
    // }

    if (puedeVerAdminTareas()) {
      items.push({ to: "/admin", label: "Gestionar Tareas" });
    }

    if (puedeVerGestionUsuarios()) {
      items.push({ to: "/usuarios", label: "Mi Equipo" });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <nav>
      <div className="relative flex items-center justify-between px-4 py-1 md:py-3">
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img
            src="/img/01_Cuadra.webp"
            alt="Cuadra"
            className="w-[120px] md:w-[160px] select-none"
          />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="z-50 p-2 focus:outline-none"
        >
          <svg className="w-7 h-7 md:w-9 md:h-9 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {user && !open && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 text-xs font-semibold normal-case">
            <span className="font-bold">{user.nombre.split(" ")[0]}</span>
          </div>
        )}
      </div>

      {open && (
        <div
          className="flex flex-col bg-white/80 backdrop-blur-xl border-t border-amber-100 
            shadow-[0_-2px_20px_rgba(0,0,0,0.08)] rounded-b-2xl 
            animate-slide-down transition-all duration-300 z-50
            p-3 space-y-1 absolute w-full left-0 top-full"
        >
          {menuItems.map(({ to, label }) => {
            const isActive = location.pathname + location.search === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex justify-center items-center gap-3 w-full text-left 
                  px-4 py-3 rounded-lg 
                  text-base font-semibold tracking-wide
                  transition-colors duration-200 active:scale-[0.98]
                  ${isActive ? "text-amber-900 bg-amber-100" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <span>{label}</span>
              </Link>
            );
          })}
          <hr className="my-2 border-gray-200/60" />
          {user && (
            <button
              onClick={() => { handleLogout(); setOpen(false); }}
              className="flex justify-center items-center gap-3 w-full text-left 
                px-4 py-3 rounded-lg 
                text-base font-semibold tracking-wide 
                text-red-700 hover:bg-red-50 active:scale-[0.98] 
                transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
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