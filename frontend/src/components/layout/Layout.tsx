// 📍 src/components/layout/Layout.tsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import type { Usuario } from "../../types/usuario"; // 1. Importa el tipo

// 2. Define la interfaz de Props
interface LayoutProps {
  children: React.ReactNode;
  user: Usuario | null; // 3. ACEPTA 'user' como prop
}

// 4. Aplica la interfaz y desestructura las props
const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  // 5. Se borró todo el useState y useEffect. Este componente es "tonto".

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        {/* 6. Pasa el 'user' (recibido por props) al Header */}
        <Header user={user} />
      </header>

      <main className="flex-grow pt-[100px] lg:pt-[110px] bg-gray-100">
        {/* 7. Simplemente renderiza los children. 
               No más React.cloneElement. 
               Las páginas recibirán 'user' desde App.tsx */}
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
