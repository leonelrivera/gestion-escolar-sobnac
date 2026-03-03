'use client';

import { useState, useEffect } from 'react';

interface User {
    id: number;
    nombreCompleto: string;
    email: string;
    rol: string;
    activo: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('No tienes permisos o hubo un error al cargar usuarios.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ activo: !currentStatus }),
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            alert('Error al actualizar estado');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando usuarios...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
                    + Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-600">Nombre</th>
                            <th className="px-6 py-4 font-bold text-gray-600">Email</th>
                            <th className="px-6 py-4 font-bold text-gray-600">Rol</th>
                            <th className="px-6 py-4 font-bold text-gray-600">Estado</th>
                            <th className="px-6 py-4 font-bold text-gray-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.nombreCompleto}</td>
                                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleStatus(user.id, user.activo)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                        >
                                            {user.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button className="text-xs font-bold text-gray-400 cursor-not-allowed">Editar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
