import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type Usuario } from "../types/usuario";

// Importación de los módulos separados
import DashboardGeneral from "../components/SuperAdmin/DashboardGeneral";
import GestionDeptos from "../components/SuperAdmin/GestionDeptos";
import GestionUsuariosGlobal from "../components/SuperAdmin/GestionUsuariosGlobal";
import VisorLogs from "../components/SuperAdmin/VisorLogs";

interface Props {
  user: Usuario;
}

const Super_Admin: React.FC<Props> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Leemos el parámetro 'tab' de la URL. Si no existe, por defecto mostramos el Resumen.
  const activeTab = searchParams.get("tab") || "RESUMEN";

  // Función para simular recarga (Igual que en Admin.tsx)
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Función para determinar el título dinámico según la sección
  const getTitle = () => {
    switch (activeTab) {
      case "DEPTOS": return "GESTIÓN DE DEPARTAMENTOS";
      case "USUARIOS": return "DIRECTORIO GLOBAL";
      case "LOGS": return "TERMINAL DEL SISTEMA";
      default: return "PANEL MAESTRO";
    }
  };

  return (
    // 👇 CLASES DE CONTENEDOR COPIADAS DE TU Admin.tsx PARA QUE OCUPE EL MISMO ANCHO
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">

      {/* Botón Flotante de Recarga (FAB) - Copia exacta */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`
          /* --- Estilos base (comunes) --- */
          p-3 bg-blue-600 text-white rounded-full shadow-xl 
          hover:bg-blue-700 transition-all duration-300
          
          /* --- Efecto al presionar (Click) --- */
          active:scale-90 
          
          /* --- Móvil/Tablet: Fijo en la esquina --- */
          fixed bottom-20 right-6 z-50
          
          /* --- Escritorio (lg): Vuelve a su lugar original --- */
          lg:bottom-180 lg:right-10

          /* --- Opacidad visual si está cargando --- */
          ${loading ? "opacity-75 cursor-wait" : ""}
        `}
        aria-label="Actualizar sistema"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-8 h-8 ${loading ? "animate-spin" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      {/* Título Principal (Estilo idéntico a Admin.tsx) */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {getTitle()}
      </h1>

      {/* Contenedor tipo "Card" (Estilo idéntico a Admin.tsx) */}
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0 min-h-[600px]">

        {/* Header interno de la tarjeta (Opcional, para mostrar info de usuario) */}
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-4 pt-4 pb-2 lg:pb-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">
            Super Admin: <span className="text-blue-600">{user.nombre}</span>
          </span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200 font-bold uppercase tracking-wider">
            Acceso Total
          </span>
        </div>

        {/* Contenido Dinámico */}
        <div className="p-4">
          {activeTab === "RESUMEN" && <DashboardGeneral />}
          {activeTab === "DEPTOS" && <GestionDeptos />}
          {activeTab === "USUARIOS" && <GestionUsuariosGlobal />}
          {activeTab === "LOGS" && <VisorLogs />}
        </div>

      </div>
    </div>
  );
};

export default Super_Admin;