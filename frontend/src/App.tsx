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

// 4. AppLayout se convierte en el componente "inteligente"
const AppLayout: React.FC = () => {
  // 5. Añadimos el estado del usuario y el estado de carga
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // 6. Hook para verificar el usuario al cargar el layout
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Llamamos al servicio 'authService.verify'
          const res = await authService.verify();
          if (res.valid && res.usuario) {
            setUser(res.usuario); // ✅ Token válido, guardamos el usuario
          }
        } catch (error) {
          // El token era inválido o expiró
          console.error("Error en la verificación automática:", error);
          localStorage.removeItem("token"); // Limpiamos el token malo
        }
      }
      // Si no hay token, 'user' simplemente se queda 'null'
      setLoading(false); // Terminamos de cargar
    };

    verifyUser();
  }, []); // El array vacío [] asegura que esto solo se ejecute UNA VEZ

  // 7. Mostrar un estado de "Cargando..." mientras se verifica el token
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Cargando aplicación...</p>
        {/* Aquí podrías poner un spinner o logo */}
      </div>
    );
  }

  // 8. Una vez cargado, renderizar el Layout y las rutas
  return (
    // 9. Pasamos el 'user' al Layout (para que el Header lo reciba)
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/pendientes" replace />} />

        {/* 10. Pasamos 'user' explícitamente a CADA ruta */}
        {/* Tu 'Principal' ya lo acepta, por eso el error estaba aquí */}
        <Route path="/todas" element={<Principal user={user} />} />

        {/* ❗️ AVISO: También tendrás que pasar 'user' a estas rutas */}
        <Route path="/pendientes" element={<Pendientes user={user} />} />
        <Route path="/admin" element={<Admin user={user} />} />

        <Route path="*" element={<Navigate to="/pendientes" replace />} />
      </Routes>
    </Layout>
  );
};

// --- El resto de tu archivo App.tsx (sin cambios) ---
function App() {
  return (
    <Router>
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
