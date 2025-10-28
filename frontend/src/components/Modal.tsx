import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-lg font-bold cursor-pointer"
          >
            x
          </button>
        </div>

        {/* Contenido del modal */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
