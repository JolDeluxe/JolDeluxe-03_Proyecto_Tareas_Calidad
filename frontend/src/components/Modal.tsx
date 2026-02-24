import React, { useRef } from "react";

interface ModalProps {
  // Se elimina 'isOpen' ya que el componente padre lo controla
  onClose: () => void;
  children: React.ReactNode;
  // ✅ PROPIEDAD AÑADIDA para resolver el error
  title: string;
}

// Se desestructura el nuevo prop 'title'
const Modal: React.FC<ModalProps> = ({ onClose, children, title }) => {
  // Se elimina el chequeo de if (!isOpen) return null;

  const mouseDownInside = useRef(false);

  return (
    <div
      // Se añade p-4 para un mejor espaciado en móviles
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      // ✅ 3. Reemplazamos onClick por onMouseDown y onMouseUp
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          mouseDownInside.current = false;
        }
      }}
      onMouseUp={(e) => {
        if (!mouseDownInside.current && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        // Se añade overflow-hidden para asegurar bordes redondeados limpios
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md overflow-hidden"
        // ✅ 4. Agregamos onMouseDown
        onMouseDown={() => {
          mouseDownInside.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Encabezado con título y botón de cierre */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            // Usamos &times; para un ícono de cierre más profesional
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold cursor-pointer leading-none ml-4"
          >
            &times;
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;