import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Pendientes from "./pages/Pendientes";
import Principal from "./pages/Principal";
import Admin from "./pages/Admin";
import Super_Admin from "./pages/Super_Admin";
import Usuarios from "./pages/Usuarios"; // 👈 Tu nueva página
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import LoginPage from "./pages/LoginPage";
import { authService } from "./api/auth.service";
import type { Usuario } from "./types/usuario";
import { Rol } from "./types/usuario"; // 👈 Importante importar el Enum

import { subscribeUser } from "./push-subscription";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AppLayout: React.FC = () => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await authService.verify();
          if (res.valid && res.usuario) {
            setUser(res.usuario);
            subscribeUser(res.usuario.id);
          }
        } catch (error) {
          console.error("Error en la verificación automática:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        <img
          src="/img/01_Cuadra.webp"
          alt="Cargando aplicación"
          className="w-48 sm:w-64 md:w-80 lg:w-96 h-auto object-contain animate-pulse"
        />
      </div>
    );
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route
          path="/"
          element={
            !user ? <Navigate to="/login" replace /> :
              user.rol === Rol.SUPER_ADMIN ? <Navigate to="/super-admin" replace /> :
                <Navigate to="/pendientes" replace />
          }
        />

        <Route path="/todas" element={<Principal user={user} />} />
        <Route path="/pendientes" element={<Pendientes user={user} />} />

        {/* 👇 RUTA EXCLUSIVA SUPER ADMIN */}
        <Route
          path="/super-admin"
          element={
            user && user.rol === Rol.SUPER_ADMIN ? (
              <Super_Admin user={user} />
            ) : (
              <Navigate to="/pendientes" replace />
            )
          }
        />

        {/* 👇 RUTA ADMIN DEPARTAMENTO (Gestión Tareas) */}
        <Route
          path="/admin"
          element={
            // 🛑 CORREGIDO: Usamos OR en lugar de array.includes para evitar error de tipado
            user && (user.rol === Rol.ADMIN || user.rol === Rol.ENCARGADO) ? (
              <Admin user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 👇 NUEVA RUTA: GESTIÓN DE USUARIOS (Solo Admin Depto) */}
        <Route
          path="/usuarios"
          element={
            // Solo dejamos entrar si es ADMIN explícitamente
            user && user.rol === Rol.ADMIN ? (
              <Usuarios user={user} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/pendientes" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        theme="colored"
        pauseOnHover
      />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;