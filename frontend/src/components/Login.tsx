// 📍 src/components/Login.tsx (NUEVO ARCHIVO)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/auth.service";
import { toast } from "react-toastify";

interface LoginProps {
  onShowRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onShowRegister }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { token, usuario } = await authService.login(form);

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      window.dispatchEvent(new Event("storage"));

      toast.success(`Bienvenido ${usuario.nombre}`, {
        autoClose: 2000,
      });

      navigate("/");
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      toast.error("Usuario o contraseña incorrectos", {
        autoClose: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center mb-4">
        <img
          src="/img/01_Cuadra.webp"
          alt="Cuadra"
          className="w-[160px] sm:w-[180px] md:w-[200px] h-auto"
        />
      </div>

      <h2 className="text-xl font-bold mb-5 text-center text-amber-950">
        Iniciar Sesión
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold mb-1">Usuario</label>
          <input
            type="text"
            placeholder="usuario"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-950 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`mt-2 ${
            loading ? "bg-gray-400" : "bg-amber-950 hover:bg-amber-900"
          } text-white font-semibold py-2 rounded-md transition-colors duration-300 cursor-pointer`}
        >
          {loading ? "Conectando..." : "Entrar"}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={onShowRegister}
          className="text-sm font-medium text-amber-950 hover:text-amber-800 hover:underline focus:outline-none"
        >
          ¿No tienes una cuenta? Solicítala aquí
        </button>
      </div>
    </>
  );
};

export default Login;
