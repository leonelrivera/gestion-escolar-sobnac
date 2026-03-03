'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Role = 'ADMIN' | 'DIRECTIVO' | 'SECRETARIO' | 'PROSECRETARIO' | 'DEP_ESTUDIANTES' | 'COORDINADOR' | 'JEFE_PRECEPTOR' | 'PRECEPTOR';

const ALL_ROLES: Role[] = ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'];

const menuItems = [
    { href: '/dashboard', label: 'Inicio', icon: '🏠', roles: ALL_ROLES },
    { href: '/dashboard/students', label: 'Estudiantes', icon: '🎓', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR'] },
    { href: '/dashboard/courses', label: 'Cursos', icon: '📚', roles: ALL_ROLES },
    { href: '/dashboard/orientations', label: 'Orientaciones', icon: '🧭', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES'] },
    { href: '/dashboard/subjects', label: 'Materias', icon: '📖', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES'] },
    { href: '/dashboard/grades', label: 'Notas', icon: '📝', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'DEP_ESTUDIANTES', 'JEFE_PRECEPTOR', 'PRECEPTOR'] },
    { href: '/dashboard/attendance', label: 'Asistencias', icon: '📅', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'JEFE_PRECEPTOR', 'PRECEPTOR'] },
    { href: '/dashboard/cycles', label: 'Ciclos Lectivos', icon: '📅', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO'] },
    { href: '/dashboard/cycles/closure', label: 'Cierre de Periodos', icon: '🔒', roles: ['ADMIN', 'PROSECRETARIO'] },
    // Nuevos módulos a construir:
    { href: '/dashboard/users', label: 'Usuarios', icon: '👥', roles: ['ADMIN', 'PROSECRETARIO', 'JEFE_PRECEPTOR'] },
    { href: '/dashboard/stats', label: 'Estadística y Riesgo', icon: '📊', roles: ['ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO', 'COORDINADOR'] },
    { href: '/dashboard/reports', label: 'Reportes', icon: '📑', roles: ALL_ROLES },
];

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

export default function Sidebar() {
    const pathname = usePathname();

    const [userRole, setUserRole] = useState<Role | null>(null);

    useEffect(() => {
        setUserRole(decodeRoleFromToken());
    }, []);

    const filteredItems = menuItems.filter(item => userRole && item.roles.includes(userRole));

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold mb-8 text-center text-blue-400">SOBNAC</h2>
            <nav className="flex-1">
                <ul>
                    {filteredItems.map((item) => (
                        <li key={item.href} className="mb-2">
                            <Link
                                href={item.href}
                                className={`flex items-center p-3 rounded-lg transition-colors ${pathname === item.href
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <span className="mr-3 text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
                    className="flex items-center w-full p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                >
                    <span className="mr-3">🚪</span>
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
