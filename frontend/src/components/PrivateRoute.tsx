// 📍 src/components/PrivateRoute.tsx (CORREGIDO)
import React from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // ✅ Verifica si hay token en localStorage
  const token = localStorage.getItem("token");

  if (!token) {
    // 🚫 Si no hay token, redirige a la página de login
    return <Navigate to="/login" replace />; // 👈 CORRECCIÓN (antes era "/")
  }

  // ✅ Si hay token, muestra el contenido protegido
  return <>{children}</>;
};

export default PrivateRoute;
