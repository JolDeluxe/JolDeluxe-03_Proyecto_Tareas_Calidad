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
            {user && (
              <button
                onClick={handleLogout}
                // Nota: Moví 'text-red-600' aquí al padre para que coloree TANTO el icono COMO el texto
                className="group flex items-center gap-2 px-3 py-2 rounded-full border border-transparent hover:bg-red-100 hover:border-red-200 text-red-600 hover:text-red-800 transition-all duration-300 active:scale-95"
              >
                {/* SVG Inline (Icono de Salida) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2} // Un poco más grueso para que se vea bien
                  stroke="currentColor"
                  // Las mismas clases de animación que tenías antes
                  className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>

                {/* Texto */}
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
