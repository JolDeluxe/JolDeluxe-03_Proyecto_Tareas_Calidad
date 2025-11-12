// 📍 src/App.tsx
import React, { useState, useEffect } from "react"; // 1. Importar hooks
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
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import LoginPage from "./pages/LoginPage";
import { authService } from "./api/auth.service";
import type { Usuario } from "./types/usuario";

// 🔽 --- 1. IMPORTAR LA LÓGICA DE SUSCRIPCIÓN --- 🔽
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

            // 🔽 --- 2. LLAMAR A LA SUSCRIPCIÓN AQUÍ --- 🔽
            // Una vez que sabemos quién es el usuario, intentamos suscribirlo.
            // Esto se ejecutará cada vez que la app cargue y el usuario esté logueado.
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
  }, []); // El array vacío asegura que solo se ejecute una vez

  if (loading) {
    return (
      // 🚀 CORRECCIÓN: Usar h-screen y flex/grid para centrar en toda la vista
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        {/* 🚀 SPINNER MÁS GRANDE: h-12 w-12 */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>

        {/* Mensaje */}
        <span className="text-xl text-gray-900 font-bold">
          Cargando aplicacion...
        </span>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/pendientes" replace />} />
        <Route path="/todas" element={<Principal user={user} />} />
        <Route path="/pendientes" element={<Pendientes user={user} />} />
        {/* Tu App.tsx original tenía "/admin" apuntando a <Admin .../>
          Asegúrate de que la ruta y el componente sean correctos.
        */}
        <Route path="/admin" element={<Admin user={user} />} />
        <Route path="*" element={<Navigate to="/pendientes" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      {/* 🔽 --- 3. AÑADIR EL CONTENEDOR DE TOASTS (para las alertas) --- 🔽 */}
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
