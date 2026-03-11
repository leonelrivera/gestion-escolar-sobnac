import { useState, useEffect } from 'react';

type Role = 'ADMIN' | 'DIRECTIVO' | 'SECRETARIO' | 'PROSECRETARIO' | 'DEP_ESTUDIANTES' | 'COORDINADOR' | 'JEFE_PRECEPTOR' | 'PRECEPTOR';

function decodeRoleFromToken(): Role | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.rol as Role;
    } catch {
        return null;
    }
}

export function usePermissions() {
    const [role, setRole] = useState<Role | null>(null);

    useEffect(() => {
        setRole(decodeRoleFromToken());
    }, []);

    // --- Permisos de Estudiantes ---
    // ADMIN, SECR, DIRECTIVO, PROSEC, DEP_ESTUDIANTES: Total
    // JEFE_PRECEPTOR: Ver y Editar (No crear)
    // PRECEPTOR: SOLO VER
    // COORDINADOR: SOLO VER
    const canCreateStudent = ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES'].includes(role || '');
    const canEditStudent = ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'JEFE_PRECEPTOR'].includes(role || '');

    // --- Permisos de Cursos ---
    // ADMIN, SECR, DIRECTIVO, PROSEC, DEP_ESTUDIANTES: Total
    // JEFE_PRECEPTOR: Ver
    // PRECEPTOR: Ver
    // COORDINADOR: Ver
    const canCreateCourse = ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES'].includes(role || '');
    const canEditCourse = canCreateCourse;
    const canDeleteCourse = canCreateCourse;
    const canAddStudentToCourse = canCreateCourse;
    const canPromoteOrTransfer = canCreateCourse;

    // --- Permisos de Usuarios ---
    const canViewUsers = ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'JEFE_PRECEPTOR'].includes(role || '');
    const canCreateUsers = canViewUsers;

    // Devuelve qué roles puede crear el usuario actual
    const allowedRolesToCreate = (): Role[] => {
        if (role === 'ADMIN') return ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];
        if (role === 'DIRECTIVO' || role === 'SECRETARIO') return ['DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];
        if (role === 'PROSECRETARIO') return ['PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];
        if (role === 'JEFE_PRECEPTOR') return ['PRECEPTOR'];
        return [];
    };

    return {
        role,
        canCreateStudent,
        canEditStudent,
        canCreateCourse,
        canEditCourse,
        canDeleteCourse,
        canAddStudentToCourse,
        canPromoteOrTransfer,
        canViewUsers,
        canCreateUsers,
        allowedRolesToCreate: allowedRolesToCreate(),
    };
}
