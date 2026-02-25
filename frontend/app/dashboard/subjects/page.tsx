'use client';

import { useState, useEffect } from 'react';

interface Subject {
    id: number;
    nombre: string;
    anioCurso: string;
    orientacionFiltro?: string;
}

interface Orientation {
    id: number;
    nombre: string;
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [orientations, setOrientations] = useState<Orientation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectOrientacion, setSelectOrientacion] = useState('');

    const getHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [subjRes, orientRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/subjects`, { headers: getHeaders() }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orientations`, { headers: getHeaders() })
            ]);

            if (subjRes.ok) setSubjects(await subjRes.json());
            if (orientRes.ok) setOrientations(await orientRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = currentSubject.id
            ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/subjects/${currentSubject.id}`
            : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/subjects`;
        const method = currentSubject.id ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(currentSubject),
            });

            if (res.ok) {
                fetchInitialData();
                setShowModal(false);
                setCurrentSubject({});
            }
        } catch (error) {
            console.error('Error saving subject:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar esta materia?')) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/subjects/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            if (res.ok) fetchInitialData();
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    const filteredSubjects = subjects.filter(s =>
        (s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.anioCurso.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectOrientacion === '' || s.orientacionFiltro === selectOrientacion)
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Materias</h1>
                    <p className="text-gray-600">Gestión de la Caja Curricular</p>
                </div>
                <button
                    onClick={() => { setCurrentSubject({}); setShowModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                    + Nueva Materia
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[250px]">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o año..."
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-[250px]">
                    <select
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectOrientacion}
                        onChange={(e) => setSelectOrientacion(e.target.value)}
                    >
                        <option value="">Todas las Orientaciones</option>
                        <option value="E.S.O">E.S.O / Ciclo Básico</option>
                        {orientations.map(o => (
                            <option key={o.id} value={o.nombre}>{o.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-700">Nombre</th>
                            <th className="p-4 font-semibold text-gray-700">Año</th>
                            <th className="p-4 font-semibold text-gray-700">Orientación/Referencia</th>
                            <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-500">Cargando materias...</td></tr>
                        ) : filteredSubjects.length === 0 ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-500">No se encontraron materias.</td></tr>
                        ) : (
                            filteredSubjects.map(s => (
                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                    <td className="p-4 font-medium text-gray-800">{s.nombre}</td>
                                    <td className="p-4 text-gray-600">{s.anioCurso}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.orientacionFiltro === 'E.S.O' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {s.orientacionFiltro || 'General'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => { setCurrentSubject(s); setShowModal(true); }}
                                            className="text-blue-600 hover:text-blue-800 mr-3 font-medium transition"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="text-red-500 hover:text-red-700 font-medium transition"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-4 text-white">
                            <h2 className="text-xl font-bold">{currentSubject.id ? 'Editar Materia' : 'Nueva Materia'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={currentSubject.nombre || ''}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Año</label>
                                    <select
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={currentSubject.anioCurso || ''}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, anioCurso: e.target.value })}
                                    >
                                        <option value="">Seleccione un año</option>
                                        <option value="1ro">1ro</option>
                                        <option value="2do">2do</option>
                                        <option value="3ro">3ro</option>
                                        <option value="4to">4to</option>
                                        <option value="5to">5to</option>
                                        <option value="6to">6to</option>
                                        <option value="7mo">7mo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Orientación / Referencia</label>
                                    <select
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={currentSubject.orientacionFiltro || ''}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, orientacionFiltro: e.target.value })}
                                    >
                                        <option value="">General</option>
                                        <option value="E.S.O">E.S.O</option>
                                        {orientations.map(o => (
                                            <option key={o.id} value={o.nombre}>{o.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
