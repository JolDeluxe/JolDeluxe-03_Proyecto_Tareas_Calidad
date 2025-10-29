import type { Request, Response, NextFunction } from "express";
type Rol = "ADMIN" | "USUARIO";
export declare const verifyToken: (requiredRole?: Rol) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=verifyToken.d.ts.map