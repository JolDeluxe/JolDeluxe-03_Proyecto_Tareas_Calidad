// 📍 src/components/MensajeRegistro.tsx (NUEVO ARCHIVO)
import React from "react";

// 1. Definimos las props que recibirá (la función para volver al login)
interface MensajeRegistroProps {
  onShowLogin: () => void;
}

const MensajeRegistro: React.FC<MensajeRegistroProps> = ({ onShowLogin }) => {
  // 2. El JSX es solo el contenido de la info de registro
  return (
    <>
      {/* 3. La flecha de regreso ahora llama a la prop */}
      <button
        type="button"
        onClick={onShowLogin}
        className="absolute top-4 left-4 text-gray-500 hover:text-amber-950 transition-colors"
        aria-label="Volver a inicio de sesión"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <div className="flex justify-center mb-4 pt-8 sm:pt-4">
        <img
          src="/img/01_Cuadra.webp"
          alt="Cuadra"
          className="w-[160px] sm:w-[180px] md:w-[200px] h-auto"
        />
      </div>

      <h2 className="text-xl font-bold mb-4 text-center text-amber-950">
        Solicitar una Cuenta
      </h2>

      <div className="text-sm text-gray-700 space-y-4">
        <p>
          Para obtener acceso al sistema, por favor envía un correo electrónico
          a:
        </p>

        <a
          href="mailto:coordinador.procesostecnologicos@cuadra.com.mx"
          className="block text-center font-semibold text-amber-950 hover:text-amber-800"
        >
          <span className="break-words">coordinador.procesostecnologicos</span>
          <span className="whitespace-nowrap">@cuadra.com.mx</span>
        </a>

        <p>Asegúrate de incluir la siguiente información:</p>

        <ul className="list-disc list-inside space-y-1 pl-2 font-medium">
          <li>Tu nombre completo</li>
          <li>Departamento al que perteneces</li>
        </ul>

        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-3 rounded-r-md text-xs">
          <p className="font-semibold">Nota sobre la contraseña:</p>
          <p className="mt-1">
            Se te asignará una contraseña temporal. No es necesario que
            proporciones una, busca que sea una fácil de recordar y no muy
            personal.
          </p>
        </div>
      </div>
    </>
  );
};

export default MensajeRegistro;
