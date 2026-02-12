import React, { useState } from "react";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";
import ModalUsuario from "./ModalUsuario";
import ModalConfirmarEstatus from "./ModalConfirmarEstatus"; // ✅ Importamos el nuevo modal
import { usuariosService } from "../../api/usuarios.service";
import { toast } from "react-toastify";
import type { Departamento } from "../../api/departamentos.service";

interface TablaUsuariosProps {
  filtro: string;
  query: string;
  usuarios: Usuario[];
  loading: boolean;
  onRecargarUsuarios: () => void;
  currentUser: Usuario | null;
  departamentos: Departamento[];
}

const TablaUsuarios: React.FC<TablaUsuariosProps> = ({
  filtro,
  query,
  usuarios,
  loading,
  onRecargarUsuarios,
  currentUser,
  departamentos,
}) => {
  // --- Estados ---
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  // ✅ Estados para el modal de confirmación
  const [openModalConfirm, setOpenModalConfirm] = useState(false);
  const [usuarioAConfirmar, setUsuarioAConfirmar] = useState<Usuario | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // --- HELPER: Normalización de texto ---
  const normalizeText = (text: string) => {
    return text
      ? text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
      : "";
  };

  // --- LÓGICA DE FILTRADO MAESTRA ---
  const usuariosFiltrados = usuarios.filter((u) => {
    // 1. Omitir Invitados
    if (u.rol === Rol.INVITADO) return false;

    // 2. Filtro por Búsqueda
    const textoUsuario = normalizeText(`${u.nombre} ${u.username}`);
    const textoBusqueda = normalizeText(query);
    const matchQuery = query.trim() === "" || textoUsuario.includes(textoBusqueda);

    // 3. Filtro por Categoría
    let matchCategoria = true;
    if (filtro === "TODOS") {
      matchCategoria = u.estatus === "ACTIVO";
    } else {
      matchCategoria = u.rol === filtro;
    }

    return matchQuery && matchCategoria;
  });

  // --- Handlers ---
  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setOpenModalEditar(true);
  };

  // ✅ 1. Solo abre el modal, no ejecuta la acción todavía
  const solicitarCambioEstatus = (usuario: Usuario) => {
    setUsuarioAConfirmar(usuario);
    setOpenModalConfirm(true);
  };

  // ✅ 2. Ejecuta la acción cuando el usuario confirma en el modal
  const handleConfirmarEstatus = async () => {
    if (!usuarioAConfirmar) return;

    setIsConfirming(true);
    const esActivo = usuarioAConfirmar.estatus === "ACTIVO";
    const nuevoEstatus = esActivo ? "INACTIVO" : "ACTIVO";

    try {
      await usuariosService.updateEstatus(usuarioAConfirmar.id, nuevoEstatus);
      toast.success(`Usuario ${esActivo ? "desactivado" : "reactivado"} correctamente.`);
      onRecargarUsuarios();
      setOpenModalConfirm(false); // Cerrar modal solo si éxito
      setUsuarioAConfirmar(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al cambiar el estatus.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-gray-500 italic">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <span className="text-gray-600 font-semibold">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="w-full text-sm font-sans pb-0.5">
      {usuariosFiltrados.length > 0 ? (
        <>
          {/* VISTA ESCRITORIO */}
          <div className="hidden lg:block max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-100 text-black text-xs uppercase sticky top-0 z-20 shadow-inner">
                <tr>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[25%]">Nombre</th>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[20%]">Username</th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[15%]">Rol</th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[15%]">Estatus</th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[20%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosFiltrados.map((row) => {
                  const esMismoUsuario = currentUser?.id === row.id;
                  const esSuperAdmin = currentUser?.rol === Rol.SUPER_ADMIN;
                  const esAdminBuscado = row.rol === Rol.ADMIN;
                  const puedeEditar = esSuperAdmin || esMismoUsuario || (currentUser?.rol === Rol.ADMIN && !esAdminBuscado);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3 text-left font-semibold text-gray-900 w-[25%]">{row.nombre}</td>
                      <td className="px-3 py-3 text-left text-gray-600 w-[20%] font-mono text-xs">{row.username}</td>

                      <td className="px-3 py-3 text-center w-[15%]">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border 
                          ${row.rol === Rol.ADMIN ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                            row.rol === Rol.ENCARGADO ? "bg-blue-100 text-blue-700 border-blue-200" :
                              "bg-rose-100 text-rose-700 border-rose-200"}`}>
                          {row.rol === Rol.ADMIN ? "Gestión" : row.rol === Rol.ENCARGADO ? "Supervisión" : "Operativo"}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-center w-[15%]">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full border
                          ${row.estatus === "ACTIVO"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                          {row.estatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center w-[20%]">
                        <div className="flex items-center justify-center gap-3 h-7">
                          {puedeEditar ? (
                            <button
                              onClick={() => abrirModalEditar(row)}
                              title="Editar usuario"
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 hover:bg-amber-600 hover:text-white transition-all duration-200 cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                              </svg>
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center text-gray-300" title="No tienes permisos para editar este administrador">
                              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" /></svg>
                            </div>
                          )}

                          {currentUser?.id !== row.id && (esSuperAdmin || (currentUser?.rol === Rol.ADMIN && !esAdminBuscado)) && (
                            <button
                              onClick={() => solicitarCambioEstatus(row)} // 👈 CAMBIO AQUÍ: Llamamos al modal
                              title={row.estatus === "ACTIVO" ? "Desactivar" : "Reactivar"}
                              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-200 cursor-pointer
                                ${row.estatus === "ACTIVO"
                                  ? "border-red-400 text-red-600 hover:bg-red-600 hover:text-white"
                                  : "border-green-400 text-green-700 hover:bg-green-100"
                                }`}
                            >
                              {row.estatus === "ACTIVO" ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5" fill="currentColor">
                                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* VISTA MÓVIL */}
          <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
            {usuariosFiltrados.map((row) => {
              const esMismoUsuario = currentUser?.id === row.id;
              const esSuperAdmin = currentUser?.rol === Rol.SUPER_ADMIN;
              const esAdminBuscado = row.rol === Rol.ADMIN;
              const puedeEditar = esSuperAdmin || esMismoUsuario || (currentUser?.rol === Rol.ADMIN && !esAdminBuscado);

              return (
                <div key={row.id} className="border border-gray-300 shadow-sm p-4 rounded-md bg-white relative">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-base leading-snug">{row.nombre}</h3>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border
                      ${row.estatus === "ACTIVO"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                      {row.estatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">Usuario:</span>{" "}
                      <span className="font-mono text-gray-800">{row.username}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">Rol:</span>{" "}
                      <span className={`font-semibold 
                        ${row.rol === Rol.ADMIN ? "text-yellow-700" : row.rol === Rol.ENCARGADO ? "text-blue-700" : "text-rose-700"}`}>
                        {row.rol === Rol.ADMIN ? "Gestión" : row.rol === Rol.ENCARGADO ? "Supervisión" : "Operativo"}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-around items-center mt-4 pt-2 border-t border-gray-200 h-[46px]">
                    {puedeEditar ? (
                      <button
                        onClick={() => abrirModalEditar(row)}
                        className="flex flex-col items-center text-amber-700 hover:text-amber-800 transition cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 text-amber-700" fill="currentColor">
                          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">Editar</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" /></svg>
                        <span className="text-[11px] font-semibold">Bloqueado</span>
                      </div>
                    )}

                    {currentUser?.id !== row.id && (esSuperAdmin || (currentUser?.rol === Rol.ADMIN && !esAdminBuscado)) && (
                      <button
                        onClick={() => solicitarCambioEstatus(row)} // 👈 CAMBIO AQUÍ: Llamamos al modal
                        className={`flex flex-col items-center transition cursor-pointer
                          ${row.estatus === "ACTIVO"
                            ? "text-red-700 hover:text-red-800"
                            : "text-green-700 hover:text-green-800"}`}
                      >
                        {row.estatus === "ACTIVO" ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 text-red-700" fill="currentColor">
                              <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                            </svg>
                            <span className="text-[11px] font-semibold">Desactivar</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 text-green-700" fill="currentColor">
                              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                            </svg>
                            <span className="text-[11px] font-semibold">Activar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {openModalEditar && (
            <ModalUsuario
              isOpen={openModalEditar}
              onClose={() => setOpenModalEditar(false)}
              usuarioAEditar={usuarioSeleccionado}
              onSuccess={onRecargarUsuarios}
              currentUser={currentUser}
              departamentos={departamentos}
            />
          )}

          {/* ✅ RENDERIZADO DEL MODAL DE CONFIRMACIÓN */}
          {openModalConfirm && (
            <ModalConfirmarEstatus
              isOpen={openModalConfirm}
              onClose={() => {
                setOpenModalConfirm(false);
                setUsuarioAConfirmar(null);
              }}
              onConfirm={handleConfirmarEstatus}
              usuario={usuarioAConfirmar}
              isSubmitting={isConfirming}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay usuarios que coincidan con los filtros.
        </div>
      )}
    </div>
  );
};

export default TablaUsuarios;