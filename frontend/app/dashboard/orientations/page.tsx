'use client';

import { useEffect, useState } from 'react';

interface Orientation {
    id: number;
    nombre: string;
    _count?: { cursos: number };
}

export default function OrientationsPage() {
    const [orientations, setOrientations] = useState<Orientation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState('');

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    useEffect(() => { fetchOrientations(); }, []);

    const fetchOrientations = async () => {
        setLoading(true);
        try {
            const res = await fetch('`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`/orientations', { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar orientaciones');
            setOrientations(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setNombre('');
        setFormError('');
        setShowModal(true);
    };

    const openEdit = (o: Orientation) => {
        setEditingId(o.id);
        setNombre(o.nombre);
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            const url = editingId
                ? ``${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`/orientations/${editingId}`
                : '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`/orientations';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify({ nombre }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al guardar');
            }
            setShowModal(false);
            fetchOrientations();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteError('');
        try {
            const res = await fetch(``${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`/orientations/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al eliminar');
            }
            setDeletingId(null);
            fetchOrientations();
        } catch (err: any) {
            setDeleteError(err.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Orientaciones</h1>
                <button onClick={openCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">
                    + Nueva Orientación
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

            {loading ? (
                <p className="text-center text-gray-400 animate-pulse">Cargando orientaciones...</p>
            ) : orientations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No hay orientaciones registradas.</p>
                    <p className="text-sm">Hacé clic en &quot;+ Nueva Orientación&quot; para crear una.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="text-left px-6 py-3 text-xs font-black text-gray-400 uppercase">Nombre</th>
                                <th className="text-center px-6 py-3 text-xs font-black text-gray-400 uppercase">Cursos</th>
                                <th className="text-right px-6 py-3 text-xs font-black text-gray-400 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orientations.map(o => (
                                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-800">{o.nombre}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {o._count?.cursos || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEdit(o)}
                                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition mr-2"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => { setDeletingId(o.id); setDeleteError(''); }}
                                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">
                            {editingId ? 'Editar Orientación' : 'Crear Orientación'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nombre</label>
                                <input
                                    placeholder="Ej: Economía y Administración"
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-bold"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            {formError && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium">
                                    {formError}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-gray-500 font-medium hover:text-gray-700">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition">
                                    {saving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmar Eliminación */}
            {deletingId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-[400px] shadow-2xl">
                        <h2 className="text-lg font-bold mb-2 text-gray-800">¿Eliminar orientación?</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Esta acción no se puede deshacer. Si la orientación tiene cursos asociados, no podrá ser eliminada.
                        </p>

                        {deleteError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium mb-4">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-gray-500 font-medium hover:text-gray-700">
                                Cancelar
                            </button>
                            <button onClick={() => handleDelete(deletingId)} className="px-5 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
