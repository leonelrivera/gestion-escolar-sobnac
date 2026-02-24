'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
    id: number;
    dni: string;
    nombre: string;
    apellido: string;
}

interface Inscription {
    id: number;
    estudiante: Student;
}

interface Course {
    id: number;
    anioCurso: string;
    division: string;
    turno: string;
    cicloLectivo: { id: number; anio: number };
    inscripciones: Inscription[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Búsqueda de alumnos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [searching, setSearching] = useState(false);

    // Selección masiva
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [targetCycles, setTargetCycles] = useState<any[]>([]);
    const [targetCourses, setTargetCourses] = useState<Course[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [promoting, setPromoting] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    };

    const fetchCourse = async () => {
        try {
            const res = await fetch(`http://localhost:3001/courses/${id}`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Error al cargar el curso');
            setCourse(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setSearching(true);
        try {
            const res = await fetch(`http://localhost:3001/students?search=${searchTerm}`, { headers: getHeaders() });
            if (res.ok) setSearchResults(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const addStudent = async (studentId: number) => {
        try {
            const res = await fetch(`http://localhost:3001/inscriptions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ estudianteId: studentId, cursoId: Number(id) }),
            });
            if (res.ok) {
                setSearchTerm('');
                setSearchResults([]);
                fetchCourse();
            } else {
                const data = await res.json();
                alert(data.message || 'Error al inscribir');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSelection = (studentId: number) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const openPromotion = async () => {
        setShowPromotionModal(true);
        try {
            const res = await fetch('http://localhost:3001/cycles', { headers: getHeaders() });
            if (res.ok) setTargetCycles(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedCycleId) {
            fetch(`http://localhost:3001/courses?cicloLectivoId=${selectedCycleId}`, { headers: getHeaders() })
                .then(res => res.json())
                .then(data => setTargetCourses(data));
        }
    }, [selectedCycleId]);

    const handlePromote = async () => {
        if (!selectedCourseId) return;
        setPromoting(true);
        try {
            const res = await fetch(`http://localhost:3001/inscriptions/bulk`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    estudianteIds: selectedStudents,
                    cursoId: Number(selectedCourseId)
                }),
            });
            if (res.ok) {
                alert('Promoción exitosa');
                setShowPromotionModal(false);
                setSelectedStudents([]);
                fetchCourse();
            } else {
                const data = await res.json();
                alert(data.message || 'Error en la promoción');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPromoting(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando detalle del curso...</div>;
    if (error || !course) return <div className="p-8 text-red-600">{error || 'Curso no encontrado'}</div>;

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/courses" className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                    <span className="text-xl">←</span>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-800">
                        {course.anioCurso} "{course.division}"
                    </h1>
                    <p className="text-gray-500 font-medium">Ciclo Lectivo {course.cicloLectivo.anio} • Turno {course.turno}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Listado de Alumnos */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                Alumnos Inscriptos
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{course.inscripciones.length}</span>
                            </h2>
                            {selectedStudents.length > 0 && (
                                <button
                                    onClick={openPromotion}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                                >
                                    Promover/Trasladar ({selectedStudents.length})
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
                                    <tr>
                                        <th className="px-6 py-3 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={selectedStudents.length === course.inscripciones.length && course.inscripciones.length > 0}
                                                onChange={() => {
                                                    if (selectedStudents.length === course.inscripciones.length) setSelectedStudents([]);
                                                    else setSelectedStudents(course.inscripciones.map(i => i.estudiante.id));
                                                }}
                                            />
                                        </th>
                                        <th className="px-6 py-3">Alumno</th>
                                        <th className="px-6 py-3">DNI</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {course.inscripciones.map(ins => (
                                        <tr key={ins.id} className={`hover:bg-blue-50/30 transition ${selectedStudents.includes(ins.estudiante.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                    checked={selectedStudents.includes(ins.estudiante.id)}
                                                    onChange={() => toggleSelection(ins.estudiante.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800">{ins.estudiante.apellido}, {ins.estudiante.nombre}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{ins.estudiante.dni}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/students/${ins.estudiante.id}`} className="text-blue-600 hover:underline text-sm font-bold">Ver Perfil</Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {course.inscripciones.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                                                No hay alumnos inscriptos en este curso.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Buscador de Alumnos */}
                <div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-4">
                        <h2 className="font-bold text-gray-800 mb-4">Agregar Alumno</h2>
                        <form onSubmit={handleSearch} className="relative mb-4">
                            <input
                                placeholder="Buscar por DNI o Nombre..."
                                className="w-full border border-gray-200 rounded-xl p-3 pr-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition">
                                🔍
                            </button>
                        </form>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {searching && <p className="text-center text-xs text-gray-400 py-4 animate-pulse">Buscando...</p>}
                            {searchResults.map(student => (
                                <div key={student.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-blue-50/50 hover:border-blue-100 transition group">
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-gray-800 truncate">{student.apellido}, {student.nombre}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase">{student.dni}</div>
                                    </div>
                                    <button
                                        onClick={() => addStudent(student.id)}
                                        className="bg-white text-blue-600 text-xs font-black p-2 rounded-lg border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition hover:bg-blue-600 hover:text-white"
                                    >
                                        +
                                    </button>
                                </div>
                            ))}
                            {searchTerm && !searching && searchResults.length === 0 && (
                                <p className="text-center text-xs text-gray-400 py-4">No se encontraron resultados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Promoción */}
            {showPromotionModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-[440px] shadow-2xl">
                        <h2 className="text-xl font-bold mb-5 text-gray-800">Promover/Trasladar Alumnos</h2>
                        <p className="text-sm text-gray-500 mb-4 font-medium">
                            Se inscribirá a {selectedStudents.length} alumnos en el curso de destino seleccionado.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciclo Lectivo de Destino</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                                    value={selectedCycleId}
                                    onChange={e => setSelectedCycleId(e.target.value)}
                                >
                                    <option value="">Seleccionar ciclo...</option>
                                    {targetCycles.map(c => <option key={c.id} value={c.id}>{c.anio} {c.enCurso ? '(En Curso)' : ''}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Curso de Destino</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium disabled:opacity-50"
                                    value={selectedCourseId}
                                    onChange={e => setSelectedCourseId(e.target.value)}
                                    disabled={!selectedCycleId}
                                >
                                    <option value="">Seleccionar curso...</option>
                                    {targetCourses.map(c => <option key={c.id} value={c.id}>{c.anioCurso} "{c.division}" ({c.turno})</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                            <button type="button" onClick={() => setShowPromotionModal(false)} className="px-4 py-2.5 text-gray-500 font-medium hover:text-gray-700">
                                Cancelar
                            </button>
                            <button
                                onClick={handlePromote}
                                disabled={promoting || !selectedCourseId}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                {promoting ? 'Procesando...' : 'Confirmar Promoción'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
