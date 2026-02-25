'use client';

import { useState, useEffect } from 'react';

interface Cycle {
    id: number;
    anio: number;
    fechaInicio: string;
    fechaFin: string;
    enCurso: boolean;
}

export default function CyclesPage() {
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Cycle | null>(null);
    const [form, setForm] = useState({
        anio: new Date().getFullYear() + 1,
        fechaInicio: '',
        fechaFin: '',
        enCurso: false,
    });

    useEffect(() => {
        fetchCycles();
    }, []);

    const fetchCycles = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setCycles(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editing ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles/${editing.id}` : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`;
        const method = editing ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    anio: Number(form.anio),
                    fechaInicio: form.fechaInicio ? new Date(form.fechaInicio).toISOString() : undefined,
                    fechaFin: form.fechaFin ? new Date(form.fechaFin).toISOString() : undefined,
                    enCurso: form.enCurso
                })
            });

            if (res.ok) {
                fetchCycles();
                setEditing(null);
                setForm({
                    anio: new Date().getFullYear() + 1,
                    fechaInicio: '',
                    fechaFin: '',
                    enCurso: false,
                });
            } else {
                alert('Error al guardar el ciclo');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Seguro que desea eliminar este ciclo?')) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                fetchCycles();
            } else {
                const data = await res.json();
                alert(data.message || 'Error al eliminar');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (cycle: Cycle) => {
        setEditing(cycle);
        setForm({
            anio: cycle.anio,
            fechaInicio: cycle.fechaInicio.split('T')[0],
            fechaFin: cycle.fechaFin.split('T')[0],
            enCurso: cycle.enCurso,
        });
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Administración de Ciclos Lectivos</h1>

            {/* Formulario */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-lg font-bold mb-4">{editing ? 'Editar Ciclo' : 'Nuevo Ciclo'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
                        <input
                            type="number"
                            value={form.anio}
                            onChange={e => setForm({ ...form, anio: +e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
                        <input
                            type="date"
                            value={form.fechaInicio}
                            onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin</label>
                        <input
                            type="date"
                            value={form.fechaFin}
                            onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                            className="w-full border rounded p-2"
                            required
                        />
                    </div>
                    <div className="flex items-center pb-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.enCurso}
                                onChange={e => setForm({ ...form, enCurso: e.target.checked })}
                                className="w-5 h-5 rounded text-blue-600"
                            />
                            <span className="font-bold text-sm text-gray-700">En Curso (Activo)</span>
                        </label>
                    </div>
                    <div className="flex space-x-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                            {editing ? 'Actualizar' : 'Crear'}
                        </button>
                        {editing && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(null);
                                    setForm({ anio: new Date().getFullYear() + 1, fechaInicio: '', fechaFin: '', enCurso: false });
                                }}
                                className="bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Listado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Año</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400">Cargando ciclos...</td></tr>
                        ) : cycles.map(cycle => (
                            <tr key={cycle.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800">{cycle.anio}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(cycle.fechaInicio).toLocaleDateString()} - {new Date(cycle.fechaFin).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {cycle.enCurso ? (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                            ACTUAL
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs font-medium">Histórico</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button
                                        onClick={() => startEdit(cycle)}
                                        className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cycle.id)}
                                        className="text-red-500 hover:text-red-700 font-bold text-sm"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
