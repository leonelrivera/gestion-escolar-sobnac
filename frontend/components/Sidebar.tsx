'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
    { href: '/dashboard', label: 'Inicio', icon: '🏠' },
    { href: '/dashboard/students', label: 'Estudiantes', icon: '🎓' },
    { href: '/dashboard/courses', label: 'Cursos', icon: '📚' },
    { href: '/dashboard/orientations', label: 'Orientaciones', icon: '🧭' },
    { href: '/dashboard/subjects', label: 'Materias', icon: '📖' },
    { href: '/dashboard/grades', label: 'Notas', icon: '📝' },
    { href: '/dashboard/attendance', label: 'Asistencias', icon: '📅' },
    { href: '/dashboard/cycles', label: 'Ciclos Lectivos', icon: '📅' },
    { href: '/dashboard/cycles/closure', label: 'Cierre de Periodos', icon: '🔒' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold mb-8 text-center text-blue-400">SOBNAC</h2>
            <nav className="flex-1">
                <ul>
                    {menuItems.map((item) => (
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
