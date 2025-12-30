import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface HeaderDesktopProps {
  user: Usuario | null;
}

const HeaderDesktop: React.FC<HeaderDesktopProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname + location.search;

    // Lógica específica para Super Admin y sus tabs
    if (path.includes("/super-admin")) {
      if (path === "/super-admin") {
        return location.pathname === "/super-admin" && (!location.search || location.search.includes("RESUMEN"));
      }
      return currentPath === path;
    }

    // Lógica estándar
    return location.pathname === path || (path === "/pendientes" && location.pathname === "/");
  };

  const puedeVerAdmin = () => {
    if (!user) return false;
    const rolesPermitidos: Rol[] = [Rol.ADMIN, Rol.ENCARGADO];
    return rolesPermitidos.includes(user.rol);
  };

  const esSuperAdmin = user?.rol === "SUPER_ADMIN";

  return (
    <>
      <nav>
        <div className="flex justify-center py-1">
          <img
            src="/img/01_Cuadra.webp"
            alt="Cuadra"
            className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
          />
        </div>

        <div className="relative flex justify-center border-t border-gray-200 shadow-sm py-3 text-[0.7rem] sm:text-sm font-bold uppercase font-sans tracking-wide">
          {user && (
            <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-700 text-xs sm:text-sm font-semibold normal-case">
              Hola,{" "}
              <span className="font-bold">{user.nombre.split(" ")[0]}</span>
            </div>
          )}

          {/* Menú para SUPER_ADMIN */}
          {esSuperAdmin && (
            <>
              <Link
                to="/super-admin"
                className={`relative mx-3 px-4 py-1 group ${isActive("/super-admin")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                PANEL MAESTRO
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/super-admin") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>

              <Link
                to="/super-admin?tab=DEPTOS"
                className={`relative mx-3 px-4 py-1 group ${isActive("/super-admin?tab=DEPTOS")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                DEPARTAMENTO
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/super-admin?tab=DEPTOS") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>

              <Link
                to="/super-admin?tab=USUARIOS"
                className={`relative mx-3 px-4 py-1 group ${isActive("/super-admin?tab=USUARIOS")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                USUARIOS
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/super-admin?tab=USUARIOS") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>

              <Link
                to="/super-admin?tab=LOGS"
                className={`relative mx-3 px-4 py-1 group ${isActive("/super-admin?tab=LOGS")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                TERMINAL
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/super-admin?tab=LOGS") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>
            </>
          )}

          {/* Menú para Usuarios Normales (Admin Depto, Encargado, Usuario) */}
          {!esSuperAdmin && (
            <>
              <Link
                to="/pendientes"
                className={`relative mx-3 sm:mx-8 px-4 py-1 group ${isActive("/pendientes")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                PENDIENTES
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/pendientes") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>

              <Link
                to="/todas"
                className={`relative mx-3 px-4 py-1 group ${isActive("/todas")
                    ? "text-amber-800"
                    : "text-gray-900 hover:text-amber-800"
                  }`}
              >
                TODAS
                <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/todas") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
              </Link>

              {user && puedeVerAdmin() && (
                <Link
                  to="/admin"
                  className={`relative mx-3 px-4 py-1 group ${isActive("/admin")
                      ? "text-amber-800"
                      : "text-gray-900 hover:text-amber-800"
                    }`}
                >
                  ADMINISTRAR TAREAS
                  <span className={`absolute left-0 bottom-0 w-full h-[2px] bg-amber-600 transition-transform duration-300 origin-left ${isActive("/admin") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
                </Link>
              )}
            </>
          )}

          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2">
            {user && (
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-3 py-2 rounded-full border border-transparent hover:bg-red-100 hover:border-red-200 text-red-600 hover:text-red-800 transition-all duration-300 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                <span className="hidden sm:inline text-sm font-bold tracking-wide">
                  Cerrar Sesión
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default HeaderDesktop;