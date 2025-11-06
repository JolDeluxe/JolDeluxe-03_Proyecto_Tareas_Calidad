// 📍 src/components/layout/Layout.tsx

import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { authService } from "../../api/auth.service";
import type { Usuario } from "../../types/usuario";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 3. Añadimos estado para guardar el usuario y el estado de carga
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // 4. Hook para verificar el token del usuario al cargar el layout
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");

      // Solo intentamos verificar si existe un token
      if (token) {
        try {
          // Llamamos al servicio 'authService.verify'
          const res = await authService.verify();
          if (res.valid && res.usuario) {
            setUser(res.usuario); // ✅ Token válido, guardamos el usuario
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Cargando aplicación...</p>
        {/* Aquí podrías poner un spinner o logo */}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 7. Pasamos el 'user' al Header para que sepa quién está logueado */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <Header user={user} />
      </header>

      {/* 8. Main ahora "crece" para llenar el espacio y tiene el padding */}
      <main className="flex-grow pt-[100px] lg:pt-[110px] bg-gray-100">
        {/* 9. Inyectamos la prop 'user' a los children (Principal, Pendientes, etc.) */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // @ts-expect-error
            return React.cloneElement(child, { user: user });
          }
          return child;
        })}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
