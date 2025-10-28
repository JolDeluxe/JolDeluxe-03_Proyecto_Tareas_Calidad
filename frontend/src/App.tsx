// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Pendientes from "./components/Pendientes";
import Principal from "./components/Principal";
import Admin from "./components/Admin";
import { useEffect, useState } from "react";
import PrivateRoute from "./components/PrivateRoute"; // 👈 importa el protector

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={isMobile ? "/todas" : "/pendientes"} replace />}
          />

          <Route
            path="/pendientes"
            element={isMobile ? <Navigate to="/todas" replace /> : <Pendientes />}
          />

          <Route path="/todas" element={<Principal />} />

          {/* 🧱 Ruta protegida */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to={isMobile ? "/todas" : "/pendientes"} replace />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
