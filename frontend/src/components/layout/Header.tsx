import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Modal from "../Modal";
import Login from "../Login";

const Header: React.FC = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const location = useLocation();
  const navigate = useNavigate();

  // 🧠 Detecta si hay sesión activa
  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(!!localStorage.getItem("token"));
    checkLogin();

    // 🔄 Detecta cambios en localStorage (login o logout)
    window.addEventListener("storage", checkLogin);
    return () => window.removeEventListener("storage", checkLogin);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setIsLoggedIn(false);
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === "/pendientes" && location.pathname === "/");

  return (
    <>
      {/* 🔹 Barra principal */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow z-50">
        <div className="flex justify-center items-center py-2 relative px-4">
          <img
            src="/img/01_Cuadra.webp"
            alt="Cuadra"
            className="w-[180px] sm:w-[200px] md:w-[220px] h-auto"
          />

          {/* 🔸 Botón escritorio */}
          {!isLoggedIn ? (
            <button
              onClick={() => setOpenLogin(true)}
              className="hidden sm:flex lg:hidden items-center gap-2 
                       text-xs sm:text-sm tracking-wide 
                       font-semibold text-white bg-amber-950 hover:bg-amber-900 
                       active:scale-[0.98] transition-all duration-300 
                       px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg shadow-md 
                       absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              INICIAR SESIÓN
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="hidden sm:flex lg:hidden items-center gap-2 
                       text-xs sm:text-sm tracking-wide 
                       font-semibold text-white bg-red-700 hover:bg-red-800 
                       active:scale-[0.98] transition-all duration-300 
                       px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg shadow-md 
                       absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              CERRAR SESIÓN
            </button>
          )}

          {/* 🔸 Botón móvil */}
          {!isLoggedIn ? (
            <button
              onClick={() => setOpenLogin(true)}
              className="sm:hidden absolute right-5 top-1/2 -translate-y-1/2
                       bg-amber-950 hover:bg-amber-900 text-white rounded-full 
                       w-9 h-9 flex items-center justify-center 
                       active:scale-[0.95] transition-all duration-300 shadow-md"
            >
              {/* 👤 Usuario (login) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="sm:hidden absolute right-5 top-1/2 -translate-y-1/2
                       bg-red-700 hover:bg-red-800 text-white rounded-full 
                       w-9 h-9 flex items-center justify-center 
                       active:scale-[0.95] transition-all duration-300 shadow-md"
            >
              {/* 🚪 Imagen personalizada de logout */}
              <img
                src="/img/logout.svg"
                alt="Cerrar sesión"
                className="w-5 h-5"
              />
            </button>
          )}
        </div>

        {/* 🔻 Menú inferior */}
        {/*
          AÑADÍ 'lg:hidden' AQUÍ para ocultar todo el menú en pantallas grandes 
        */}
        <div className="flex justify-center border-t border-gray-200 shadow-sm py-2 text-[0.7rem] sm:text-sm font-bold uppercase font-sans tracking-wide lg:hidden">
          {/* PENDIENTES */}
          <Link
            to="/pendientes"
            className={`hidden sm:inline-block relative mx-8 px-4 py-1 transition-all duration-200 group cursor-pointer ${
              isActive("/pendientes")
                ? "text-amber-800"
                : "text-gray-900 hover:text-amber-800"
            }`}
          >
            PENDIENTES
            <span
              className={`absolute left-0 bottom-0 h-[2px] bg-amber-800 transition-transform duration-500 origin-center ${
                isActive("/pendientes")
                  ? "w-full scale-x-100"
                  : "w-full scale-x-0 group-hover:scale-x-100"
              }`}
            ></span>
          </Link>

          {/* TODAS */}
          <Link
            to="/todas"
            className={`relative mx-3 px-4 py-1 transition-all duration-200 group cursor-pointer ${
              isActive("/todas")
                ? "text-amber-800"
                : "text-gray-900 hover:text-amber-800"
            }`}
          >
            TODAS
            <span
              className={`absolute left-0 bottom-0 h-[2px] bg-amber-800 transition-transform duration-500 origin-center ${
                isActive("/todas")
                  ? "w-full scale-x-100"
                  : "w-full scale-x-0 group-hover:scale-x-100"
              }`}
            ></span>
          </Link>

          {/* ✅ ADMIN solo si hay sesión */}
          {isLoggedIn && (
            <Link
              to="/admin"
              className={`relative mx-3 px-4 py-1 transition-all duration-200 group cursor-pointer ${
                isActive("/admin")
                  ? "text-amber-800"
                  : "text-gray-900 hover:text-amber-800"
              }`}
            >
              ADMINISTRAR TAREAS
              <span
                className={`absolute left-0 bottom-0 h-[2px] bg-amber-800 transition-transform duration-500 origin-center ${
                  isActive("/admin")
                    ? "w-full scale-x-100" // Corregí el '1E00'
                    : "w-full scale-x-0 group-hover:scale-x-100"
                }`}
              ></span>
            </Link>
          )}
        </div>
      </nav>

      {/* 🪟 Modal de login */}
      <Modal isOpen={openLogin} onClose={() => setOpenLogin(false)}>
        <Login onClose={() => setOpenLogin(false)} />
      </Modal>
    </>
  );
};

export default Header;
