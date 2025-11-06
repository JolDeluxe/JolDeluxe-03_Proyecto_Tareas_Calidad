// 📍 src/components/PublicRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Si el usuario ESTÁ logueado, redirige a la raíz de la app
    return <Navigate to="/" replace />;
  }

  // Si NO está logueado, muestra el children (la página de Login)
  return <>{children}</>;
};

export default PublicRoute;
