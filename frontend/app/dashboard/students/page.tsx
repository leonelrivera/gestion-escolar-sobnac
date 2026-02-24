'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Student {
    id: number;
    dni: string;
    apellido: string;
    nombre: string;
    fechaNacimiento: string;
    condicion: string;
    librosFolios: { libro: string; folio: string }[];
    inscripciones: {
        curso: {
            anioCurso: string;
            division: string;
            turno: string;
            cicloLectivo: { anio: number };
            orientacion?: { nombre: string };
        }
    }[];
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        cicloLectivo: '', // Will be set after fetching cycles
        curso: '',
        division: '',
        condicion: '',
        sinCurso: false,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const [courses, setCourses] = useState<any[]>([]);
    const [cycles, setCycles] = useState<any[]>([]);
    const [assignModal, setAssignModal] = useState<{ studentId: number; name: string } | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Fetch Courses
        fetch('http://localhost:3001/courses', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setCourses)
            .catch(console.error);

        // Fetch Cycles to set default
        fetch('http://localhost:3001/cycles', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setCycles(data);
                const active = data.find((c: any) => c.enCurso);
                if (active) {
                    setFilters(prev => ({ ...prev, cicloLectivo: String(active.anio) }));
                } else if (data.length > 0) {
                    setFilters(prev => ({ ...prev, cicloLectivo: String(data[0].anio) }));
                }
            })
            .catch(console.error);
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Remove empty keys
            const queryObj: any = { ...filters };
            if (filters.sinCurso) queryObj.sinCurso = 'true';

            const query = new URLSearchParams(queryObj).toString();
            const res = await fetch(`http://localhost:3001/students?${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Error al cargar estudiantes');

            const data = await res.json();
            setStudents(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const val = e.target.name === 'sinCurso' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFilters({ ...filters, [e.target.name]: val });
    };

    const formatAnio = (anio: string) => {
        const num = parseInt(anio);
        if (isNaN(num)) return anio;
        const suffixes: Record<number, string> = {
            1: '1RO', 2: '2DO', 3: '3RO', 4: '4TO', 5: '5TO', 6: '6TO', 7: '7MO'
        };
        return suffixes[num] || `${num}°`;
    };

    const handleAssign = async () => {
        if (!selectedCourseId || !assignModal) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/inscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    estudianteId: assignModal.studentId,
                    cursoId: +selectedCourseId,
                    condicion: 'REGULAR'
                })
            });

            if (res.ok) {
                setAssignModal(null);
                fetchStudents();
            } else {
                alert('Error al asignar el curso');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Libro Matriz (Estudiantes)</h1>
                <Link href="/dashboard/students/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                    + Nuevo Estudiante
                </Link>
            </div>

            {/* Buscador Global y Filtros */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        name="search"
                        placeholder="🔍 Buscar por DNI, Nombre o Apellido..."
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="w-full border-2 border-gray-100 rounded-xl p-3 pl-10 focus:border-blue-500 focus:outline-none transition font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciclo Lectivo</label>
                        <select name="cicloLectivo" value={filters.cicloLectivo} onChange={handleFilterChange} className="w-full border rounded p-2 text-sm font-bold bg-blue-50 border-blue-200">
                            {cycles.map(c => (
                                <option key={c.id} value={c.anio}>{c.anio} {c.enCurso ? '(ACTUAL)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
                        <select name="curso" value={filters.curso} onChange={handleFilterChange} className="w-full border rounded p-2 text-sm">
                            <option value="">Todos</option>
                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                <option key={n} value={String(n)}>{formatAnio(String(n))}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">División</label>
                        <select name="division" value={filters.division} onChange={handleFilterChange} className="w-full border rounded p-2 text-sm">
                            <option value="">Todas</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Condición</label>
                        <select name="condicion" value={filters.condicion} onChange={handleFilterChange} className="w-full border rounded p-2 text-sm">
                            <option value="">Todas</option>
                            <option value="REGULAR">Regular</option>
                            <option value="REPITENTE">Repitente</option>
                            <option value="PASE">Pase</option>
                            <option value="INGRESO">Ingreso</option>
                        </select>
                    </div>
                    <div className="pb-2">
                        <label className="flex items-center space-x-2 cursor-pointer bg-orange-50 p-2 rounded border border-orange-100">
                            <input
                                type="checkbox"
                                name="sinCurso"
                                checked={filters.sinCurso}
                                onChange={handleFilterChange}
                                className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-xs font-bold text-orange-800 uppercase">Sin Curso</span>
                        </label>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">DNI</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Apellido y Nombre</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Libro/Folio</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">F. Nacimiento</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Orientación</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Curso/Div</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Condición</th>
                            <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="px-4 py-4 bg-gray-50/50"></td>
                                </tr>
                            ))
                        ) : students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-medium">{student.dni}</td>
                                <td className="px-4 py-3 uppercase">{student.apellido}, {student.nombre}</td>
                                <td className="px-4 py-3">
                                    {student.librosFolios.map((lf, idx) => (
                                        <div key={idx} className="bg-blue-50 text-blue-700 px-1 rounded inline-block mr-1">
                                            {lf.libro}/{lf.folio}
                                        </div>
                                    ))}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {new Date(student.fechaNacimiento).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 italic text-gray-500">
                                    {student.inscripciones[0]?.curso?.orientacion?.nombre || '-'}
                                </td>
                                <td className="px-4 py-3 relative group">
                                    {student.inscripciones[0]?.curso ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">
                                                {formatAnio(student.inscripciones[0].curso.anioCurso)} "{student.inscripciones[0].curso.division}"
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setAssignModal({ studentId: student.id, name: `${student.apellido}, ${student.nombre}` });
                                                    setSelectedCourseId('');
                                                }}
                                                className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition hover:bg-gray-200"
                                                title="Cambiar Curso"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setAssignModal({ studentId: student.id, name: `${student.apellido}, ${student.nombre}` });
                                                setSelectedCourseId('');
                                            }}
                                            className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold hover:bg-orange-200"
                                        >
                                            + ASIGNAR
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.condicion === 'REGULAR' ? 'bg-green-100 text-green-700' :
                                        student.condicion === 'REPITENTE' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {student.condicion}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center space-x-2 flex items-center justify-center">
                                    <Link href={`/dashboard/students/${student.id}`} className="text-blue-600 hover:underline font-bold">Ver Perfil</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && students.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">
                        No se encontraron estudiantes con los filtros seleccionados.
                    </div>
                )}
            </div>

            {/* Modal de Asignación */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Asignar Curso</h3>
                        <p className="mb-4 text-sm text-gray-600">Estudiante: <span className="font-bold text-gray-800">{assignModal.name}</span></p>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar Curso</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full border rounded p-2 mb-4"
                        >
                            <option value="">Seleccionar...</option>
                            {courses
                                .filter((c: any) => String(c.cicloLectivo.anio) === filters.cicloLectivo) // Filter by selected cycle filter
                                .map((c: any) => (
                                    <option key={c.id} value={c.id}>{formatAnio(c.anioCurso)} "{c.division}" ({c.cicloLectivo.anio})</option>
                                ))}
                        </select>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setAssignModal(null)}
                                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedCourseId}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
