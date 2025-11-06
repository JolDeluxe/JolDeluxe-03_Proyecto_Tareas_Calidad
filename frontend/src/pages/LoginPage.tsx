// 📍 src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import Login from "../components/Login";
import MensajeRegistro from "../components/MensajeRegistro";

const LoginPage: React.FC = () => {
  // 2. Lógica del estado de la vista (se mantiene)
  const [view, setView] = useState<"login" | "registerInfo">("login");

  const [randomIndex] = useState(Math.floor(Math.random() * 6));
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState("");

  useEffect(() => {
    const movilUrl = `/img/loginMovil/${randomIndex}.webp`;
    const escritorioUrl = `/img/loginEscritorio/${randomIndex}.webp`;

    const updateBackground = () => {
      if (window.innerWidth >= 640) {
        setCurrentBackgroundUrl(escritorioUrl);
      } else {
        setCurrentBackgroundUrl(movilUrl);
      }
    };

    window.addEventListener("resize", updateBackground);
    updateBackground();
    return () => window.removeEventListener("resize", updateBackground);
  }, [randomIndex]);

  return (
    <div
      className="flex items-center justify-center min-h-screen relative 
                 bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: `url(${currentBackgroundUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs"></div>

      <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-md p-6 sm:p-8 text-gray-800">
        {view === "login" ? (
          <Login onShowRegister={() => setView("registerInfo")} />
        ) : (
          <MensajeRegistro onShowLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
