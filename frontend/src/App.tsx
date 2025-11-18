// 📍 src/App.tsx (Código modificado para incluir la restricción de roles en /admin)
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate, // Importación necesaria para la redirección
} from "react-router-dom";
import Layout from "./components/layout/Layout";
import Pendientes from "./pages/Pendientes";
import Principal from "./pages/Principal";
import Admin from "./pages/Admin";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import LoginPage from "./pages/LoginPage";
import { authService } from "./api/auth.service";
import type { Usuario } from "./types/usuario";

// 🔽 --- IMPORTAR LA LÓGICA DE SUSCRIPCIÓN --- 🔽
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

  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "ENCARGADO"];

  const adminElement =
    user && allowedRoles.includes(user.rol) ? (
      <Admin user={user} />
    ) : (
      <Navigate to="/pendientes" replace />
    );
  // 🔼🔼🔼

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/pendientes" replace />} />
        <Route path="/todas" element={<Principal user={user} />} />
        <Route path="/pendientes" element={<Pendientes user={user} />} />
        <Route path="/admin" element={adminElement} />
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
