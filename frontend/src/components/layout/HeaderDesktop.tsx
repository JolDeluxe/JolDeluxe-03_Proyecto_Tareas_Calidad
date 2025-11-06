// 📍 src/components/layout/HeaderDesktop.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// 1. Importar los tipos
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

// 2. Definir las props que recibe (de Header.tsx)
interface HeaderDesktopProps {
  user: Usuario | null;
}

// 3. Renombrar componente a 'HeaderDesktop' y aceptar props
const HeaderDesktop: React.FC<HeaderDesktopProps> = ({ user }) => {
  // 4. 'isLoggedIn' se reemplaza por 'user'
  const location = useLocation();
  const navigate = useNavigate();

  // 5. El 'useEffect' para 'isLoggedIn' se elimina (ya no es necesario)

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario"); // Opcional, pero bueno
    // No necesitamos 'setIsLoggedIn(false)'
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/pendientes" && location.pathname === "/");

  // 6. Función para verificar si se muestra el link de Admin
  const puedeVerAdmin = () => {
    if (!user) return false;
    const rolesPermitidos: Rol[] = [Rol.SUPER_ADMIN, Rol.ADMIN, Rol.ENCARGADO];
    return rolesPermitidos.includes(user.rol);
  };

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
          {/* 7. Añadir un saludo al usuario */}
          {user && (
            <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-700 text-xs sm:text-sm font-semibold normal-case">
              Hola,{" "}
              <span className="font-bold">{user.nombre.split(" ")[0]}</span>
            </div>
          )}

          <Link
            to="/pendientes"
            className={`relative mx-3 sm:mx-8 px-4 py-1 ... ${
              isActive("/pendientes")
                ? "text-amber-800"
                : "text-gray-900 hover:text-amber-800"
            }`}
          >
            PENDIENTES
            <span
              className={`absolute ... ${
                isActive("/pendientes") ? "" : "group-hover:scale-x-100"
              }`}
            ></span>
          </Link>

          <Link
            to="/todas"
            className={`relative mx-3 px-4 py-1 ... ${
              isActive("/todas")
                ? "text-amber-800"
                : "text-gray-900 hover:text-amber-800"
            }`}
          >
            TODAS
            <span
              className={`absolute ... ${
                isActive("/todas") ? "" : "group-hover:scale-x-100"
              }`}
            ></span>
          </Link>

          {/* 8. Usar 'user' y la función 'puedeVerAdmin' para mostrar el link */}
          {user && puedeVerAdmin() && (
            <Link
              to="/admin"
              className={`relative mx-3 px-4 py-1 ... ${
                isActive("/admin")
                  ? "text-amber-800"
                  : "text-gray-900 hover:text-amber-800"
              }`}
            >
              ADMINISTRAR TAREAS
              <span
                className={`absolute ... ${
                  isActive("/admin") ? "" : "group-hover:scale-x-100"
                }`}
              ></span>
            </Link>
          )}

          <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2">
            {/* 9. Usar 'user' para mostrar el botón de logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 ... (tus clases)"
              >
                <img
                  src="/img/logout.svg"
                  alt="Cerrar sesión"
                  className="w-5 h-5 sm:hidden"
                />
                <span className="hidden sm:inline">CERRAR SESIÓN</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default HeaderDesktop;
