import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true; // Si no hay roles requeridos, dejar pasar.
        }

        const { user } = context.switchToHttp().getRequest();

        // Asumimos que el JWTStrategy inyecta el usuaro con su rol en req.user
        if (!user || !user.rol) {
            return false;
        }

        // El ADMIN siempre tiene acceso a todo.
        if (user.rol === Rol.ADMIN) {
            return true;
        }

        return requiredRoles.includes(user.rol);
    }
}
