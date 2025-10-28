// types/express.d.ts

// Declaración de tipos globales para Express
declare global {
  namespace Express {
    interface Request {
      /**
       * Información del usuario autenticado
       * Agregada por el middleware de JWT
       */
      user?: {
        id: number; // ID del usuario en la base de datos
        nombre: string; // Nombre completo del usuario
        username: string; // Username / login del usuario
        rol: "ADMIN" | "USUARIO"; // Rol del usuario
      };
    }
  }
}

// Esto es necesario para que TypeScript trate este archivo como módulo
export {};
