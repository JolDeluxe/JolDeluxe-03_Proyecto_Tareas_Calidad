// src/components/layout/Footer.tsx

import React from "react";

const Footer: React.FC = () => {
  return (
    // 'mt-auto' es clave cuando se usa flex-col en el layout
    <footer className="mt-auto bg-gray-100 border-t border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto text-center jus">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} | Esta herramienta desarrollada por
          el equipo de{" "}
          <strong className="font-semibold">Procesos Tecnológicos</strong>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
