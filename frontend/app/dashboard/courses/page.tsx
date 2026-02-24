'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Cycle {
    id: number;
    anio: number;
    enCurso: boolean;
}

interface Course {
    id: number;
    anioCurso: string;
    division: string;
    turno: string;
    orientacion?: { id: number; nombre: string };
    cicloLectivo: Cycle;
    preceptor?: { id: number; nombreCompleto: string };
    inscripciones?: { id: number }[];
}

interface Orientation {
    id: number;
    nombre: string;
}

const EMPTY_COURSE = {
    cicloLectivoId: '',
    anioCurso: '',
    division: '',
    turno: 'MANANA',
    orientacionId: '',
};

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtro
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');

    // Orientaciones
    const [orientations, setOrientations] = useState<Orientation[]>([]);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_COURSE });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    // Confirmación de borrado
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        fetchCycles();
        fetchOrientations();
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [selectedCycleId]);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    const fetchCycles = async () => {
        try {
            const res = await fetch('http://localhost:3001/cycles', { headers: getHeaders() });
            if (!res.ok) {
                console.error('Error fetching cycles:', res.status);
                return;
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error('Cycles response is not an array:', data);
                return;
            }
            setCycles(data);
            // Seleccionar el ciclo en curso por defecto
            const enCurso = data.find((c: Cycle) => c.enCurso);
            if (enCurso) setSelectedCycleId(String(enCurso.id));
        } catch (err) {
            console.error('Error fetching cycles:', err);
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const url = selectedCycleId
                ? `http://localhost:3001/courses?cicloLectivoId=${selectedCycleId}`
                : 'http://localhost:3001/courses';
            const res = await fetch(url, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar cursos');
            const data = await res.json();
            setCourses(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrientations = async () => {
        try {
            const res = await fetch('http://localhost:3001/orientations', { headers: getHeaders() });
            if (res.ok) setOrientations(await res.json());
        } catch (err) {
            console.error('Error fetching orientations:', err);
        }
    };

    const openCreateModal = () => {
        setEditingCourseId(null);
        setFormData({ ...EMPTY_COURSE, cicloLectivoId: selectedCycleId || '' });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (course: Course) => {
        setEditingCourseId(course.id);
        setFormData({
            cicloLectivoId: String(course.cicloLectivo.id),
            anioCurso: course.anioCurso,
            division: course.division,
            turno: course.turno || 'MANANA',
            orientacionId: course.orientacion ? String(course.orientacion.id) : '',
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');

        const payload = {
            ...formData,
            cicloLectivoId: Number(formData.cicloLectivoId),
            orientacionId: formData.orientacionId ? Number(formData.orientacionId) : undefined,
        };

        try {
            const url = editingCourseId
                ? `http://localhost:3001/courses/${editingCourseId}`
                : 'http://localhost:3001/courses';
            const method = editingCourseId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al guardar');
            }

            setShowModal(false);
            fetchCourses();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteError('');
        try {
            const res = await fetch(`http://localhost:3001/courses/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al eliminar');
            }

            setDeletingId(null);
            fetchCourses();
        } catch (err: any) {
            setDeleteError(err.message);
        }
    };

    const formatAnio = (anio: string) => {
        const num = parseInt(anio);
        if (isNaN(num)) return anio;
        const suffixes: Record<number, string> = {
            1: '1RO', 2: '2DO', 3: '3RO', 4: '4TO', 5: '5TO', 6: '6TO', 7: '7MO'
        };
        return suffixes[num] || `${num}°`;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Cursos y Divisiones</h1>
                <button onClick={openCreateModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm">
                    + Nuevo Curso
                </button>
            </div>

            {/* Filtro por Ciclo */}
            <div className="mb-6 flex items-center gap-3">
                <label className="text-sm font-bold text-gray-500 uppercase">Ciclo Lectivo:</label>
                <select
                    className="border rounded-lg px-3 py-2 bg-white text-sm font-medium shadow-sm"
                    value={selectedCycleId}
                    onChange={e => setSelectedCycleId(e.target.value)}
                >
                    <option value="">Todos los ciclos</option>
                    {cycles.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.anio} {c.enCurso ? '(En Curso)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

            {/* Lista de Cursos */}
            {loading ? (
                <p className="text-center text-gray-400 animate-pulse">Cargando cursos...</p>
            ) : courses.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No hay cursos registrados para este ciclo.</p>
                    <p className="text-sm">Hacé clic en "+ Nuevo Curso" para crear uno.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800">{formatAnio(course.anioCurso)} "{course.division}"</h3>
                                    <p className="text-sm text-gray-500 mt-1">Turno: <span className="font-bold">{course.turno}</span></p>
                                </div>
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">
                                    {course.cicloLectivo.anio}
                                </span>
                            </div>

                            {course.orientacion && (
                                <p className="text-xs text-gray-400 mt-2">Orientación: {course.orientacion.nombre}</p>
                            )}

                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                <Link href={`/dashboard/courses/${course.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1">
                                    Ver Alumnos <span>→</span>
                                </Link>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {course.inscripciones?.length || 0} alumnos
                                </span>
                            </div>

                            {/* Acciones */}
                            <div className="mt-3 pt-3 border-t flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(course)}
                                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => { setDeletingId(course.id); setDeleteError(''); }}
                                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-[440px] shadow-2xl">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">
                            {editingCourseId ? 'Editar Curso' : 'Crear Curso'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciclo Lectivo</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                                    value={formData.cicloLectivoId}
                                    onChange={e => setFormData({ ...formData, cicloLectivoId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {cycles.map(c => <option key={c.id} value={c.id}>{c.anio} {c.enCurso ? '(En Curso)' : ''}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Año</label>
                                    <select
                                        className="w-full border rounded-lg p-2.5 bg-gray-50 font-bold"
                                        value={formData.anioCurso}
                                        onChange={e => setFormData({ ...formData, anioCurso: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                            <option key={n} value={String(n)}>{n}° Año ({formatAnio(String(n))})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">División</label>
                                    <input
                                        placeholder="Ej: A"
                                        className="w-full border rounded-lg p-2.5 bg-gray-50 font-bold uppercase"
                                        value={formData.division}
                                        onChange={e => setFormData({ ...formData, division: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Turno</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                                    value={formData.turno}
                                    onChange={e => setFormData({ ...formData, turno: e.target.value })}
                                >
                                    <option value="MANANA">Mañana</option>
                                    <option value="TARDE">Tarde</option>
                                    <option value="VESPERTINO">Vespertino</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Orientación (opcional)</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                                    value={formData.orientacionId}
                                    onChange={e => setFormData({ ...formData, orientacionId: e.target.value })}
                                >
                                    <option value="">Sin orientación</option>
                                    {orientations.map(o => (
                                        <option key={o.id} value={o.id}>{o.nombre}</option>
                                    ))}
                                </select>
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
                                    {saving ? 'Guardando...' : (editingCourseId ? 'Guardar Cambios' : 'Crear Curso')}
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
                        <h2 className="text-lg font-bold mb-2 text-gray-800">¿Eliminar curso?</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Esta acción no se puede deshacer. Si el curso tiene inscripciones asociadas, no podrá ser eliminado.
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
