'use client';

import { useState, useEffect } from 'react';
import AssignCoursesModal from '@/components/AssignCoursesModal';

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

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [userToAssign, setUserToAssign] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        nombreCompleto: '',
        email: '',
        password: '',
        rol: 'PRECEPTOR'
    });

    const ROLES = [
        'ADMIN', 'DIRECTIVO', 'SECRETARIO', 'PROSECRETARIO',
        'DEP_ESTUDIANTES', 'COORDINADOR', 'JEFE_PRECEPTOR', 'PRECEPTOR'
    ];

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

    const openCreateModal = () => {
        setEditingUserId(null);
        setFormData({ nombreCompleto: '', email: '', password: '', rol: 'PRECEPTOR' });
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUserId(user.id);
        setFormData({
            nombreCompleto: user.nombreCompleto,
            email: user.email,
            password: '', // Password empty unless user wants to change it
            rol: user.rol
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingUserId
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${editingUserId}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users`;

            const method = editingUserId ? 'PATCH' : 'POST';

            // For editing, if password is empty, don't send it
            const payload = { ...formData };
            if (editingUserId && !payload.password) {
                delete (payload as any).password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ nombreCompleto: '', email: '', password: '', rol: 'PRECEPTOR' });
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || 'Error al procesar solicitud');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando usuarios...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                >
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
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-xs font-bold text-gray-600 hover:text-gray-900"
                                        >
                                            Editar
                                        </button>
                                        {user.rol === 'PRECEPTOR' && (
                                            <button
                                                onClick={() => {
                                                    setUserToAssign(user);
                                                    setShowAssignModal(true);
                                                }}
                                                className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1"
                                                title="Asignar Cursos"
                                            >
                                                <span>📅</span>
                                                Asignar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">
                            {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.nombreCompleto}
                                    onChange={e => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="juan@ejemplo.com"
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1">
                                    Contraseña {editingUserId && '(opcional)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUserId}
                                    placeholder={editingUserId ? "Dejar vacío para no cambiar" : "••••••••"}
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase mb-1">Rol de Acceso</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-gray-700"
                                    value={formData.rol}
                                    onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                >
                                    {ROLES.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                                >
                                    {saving ? 'Guardando...' : (editingUserId ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal de Asignación de Cursos */}
            {showAssignModal && userToAssign && (
                <AssignCoursesModal
                    userId={userToAssign.id}
                    userName={userToAssign.nombreCompleto}
                    onClose={() => {
                        setShowAssignModal(false);
                        setUserToAssign(null);
                        fetchUsers(); // Refresh list to see changes if needed
                    }}
                />
            )}
        </div>
    );
}
