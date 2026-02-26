'use client';

import { useState, useEffect } from 'react';

// Tipos
interface Cycle { id: number; anio: number; enCurso: boolean; }
interface Course { id: number; anioCurso: string; division: string; cicloLectivoId: number; cicloLectivo: { id: number; anio: number } }
interface Subject { id: number; nombre: string; anioCurso: string; orientacionFiltro?: string; }
interface Student { id: number; nombre: string; apellido: string; dni: string; }

interface Period {
    cicloLectivoId: number;
    instancia: string;
    cuatrimestre: number;
    cerrado: boolean;
}

interface GradeMatrixRow {
    student: Student;
    grades: Record<string, number>; // key: "cuatrimestre-instancia"
}

// Columnas de la matriz
const QUARTERS = [1, 2];
const INSTANCES = [
    { key: 'INFORME_1', label: 'Inf 1' },
    { key: 'INFORME_2', label: 'Inf 2' },
    { key: 'PFA', label: 'PFA' },
    { key: 'CIERRE', label: 'Cierre' },
];
const FINAL_INSTANCES = [
    { key: 'COMPLEMENTARIO_DIC', label: 'Dic' },
    { key: 'COMPLEMENTARIO_FEB', label: 'Feb' },
    { key: 'FINAL', label: 'Final' },
];

export default function GradesPage() {
    // Selectores
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

    // Data
    const [matrix, setMatrix] = useState<GradeMatrixRow[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null); // "studentId-key" being saved

    // Auth Header
    const getHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    // Carga inicial de filtros
    useEffect(() => {
        Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`, { headers: getHeaders() }).then(r => r.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/courses`, { headers: getHeaders() }).then(r => r.json()),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/subjects`, { headers: getHeaders() }).then(r => r.json()),
        ]).then(([cyclesData, coursesData, subjectsData]) => {
            if (Array.isArray(cyclesData)) {
                setCycles(cyclesData);
                // Set default cycle
                const current = cyclesData.find((c: Cycle) => c.enCurso);
                if (current) setSelectedCycleId(String(current.id));
            }
            if (Array.isArray(coursesData)) setCourses(coursesData);
            if (Array.isArray(subjectsData)) setSubjects(subjectsData);
        }).catch(err => console.error(err));
    }, []);

    // Cargar matriz cuando cambian curso o materia
    useEffect(() => {
        if (selectedCourseId && selectedSubjectId) {
            fetchMatrix();
        } else {
            setMatrix([]);
        }
    }, [selectedCourseId, selectedSubjectId]);

    const fetchMatrix = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/grades/matrix?courseId=${selectedCourseId}&subjectId=${selectedSubjectId}`, {
                headers: getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setMatrix(data.students);
                setPeriods(data.periods);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (studentId: number, grade: number | string, cuatrimestre: number, instancia: string) => {
        if (grade === '' || isNaN(Number(grade))) return;

        // Client-side validation
        const isClosed = periods.find(p => p.instancia === instancia && p.cuatrimestre === cuatrimestre)?.cerrado;
        if (isClosed) {
            alert('El periodo está CERRADO. No se pueden modificar notas.');
            return;
        }

        const key = `${cuatrimestre}-${instancia}`;
        const cellId = `${studentId}-${key}`;
        setSaving(cellId);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/grades`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    estudianteId: studentId,
                    materiaId: +selectedSubjectId,
                    courseId: +selectedCourseId, // Context for validation
                    nota: +grade,
                    cuatrimestre,
                    instancia,
                    fecha: new Date().toISOString(),
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error');
            }

            // Actualizar estado local
            setMatrix(prev => prev.map(row => {
                if (row.student.id === studentId) {
                    return {
                        ...row,
                        grades: { ...row.grades, [key]: +grade }
                    };
                }
                return row;
            }));

        } catch (err: any) {
            alert(`Error: ${err.message}`);
            // Revert value? Requires complex state management or reload.
        } finally {
            setSaving(null);
        }
    };

    const getGradeInputs = (row: GradeMatrixRow, cuatrimestre: number) => {
        return INSTANCES.map(inst => {
            const gradeKey = `${cuatrimestre}-${inst.key}`;
            const val = row.grades[gradeKey];
            const isSaving = saving === `${row.student.id}-${gradeKey}`;
            const isClosed = periods.find(p => p.instancia === inst.key && p.cuatrimestre === cuatrimestre)?.cerrado;

            return (
                <td key={gradeKey} className={`p-1 border text-center ${isClosed ? 'bg-gray-100' : ''}`}>
                    <input
                        className={`w-12 text-center p-1 rounded border ${isSaving ? 'bg-blue-50 border-blue-400' : 'border-transparent hover:border-gray-200 focus:border-blue-500'} outline-none transition-colors font-medium disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        defaultValue={val ?? ''}
                        disabled={isClosed}
                        title={isClosed ? 'Periodo Cerrado' : ''}
                        onBlur={(e) => {
                            if (e.target.value !== String(val ?? '')) {
                                handleSave(row.student.id, e.target.value, cuatrimestre, inst.key);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                    />
                </td>
            );
        });
    };

    const getFinalInputs = (row: GradeMatrixRow) => {
        return FINAL_INSTANCES.map(inst => {
            const cuatrimestre = 2; // Asignamos al 2do cuatrimestre por defecto o 0
            const gradeKey = `${cuatrimestre}-${inst.key}`;
            const val = row.grades[gradeKey];
            const isSaving = saving === `${row.student.id}-${gradeKey}`;
            const isClosed = periods.find(p => p.instancia === inst.key && p.cuatrimestre === cuatrimestre)?.cerrado;

            return (
                <td key={gradeKey} className={`p-1 border text-center ${isClosed ? 'bg-gray-100' : 'bg-gray-50/50'}`}>
                    <input
                        className={`w-12 text-center p-1 rounded border ${isSaving ? 'bg-blue-50 border-blue-400' : 'border-transparent hover:border-gray-200 focus:border-blue-500'} outline-none transition-colors font-bold text-gray-700 disabled:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        defaultValue={val ?? ''}
                        disabled={isClosed}
                        title={isClosed ? 'Periodo Cerrado' : ''}
                        onBlur={(e) => {
                            if (e.target.value !== String(val ?? '')) {
                                handleSave(row.student.id, e.target.value, cuatrimestre, inst.key);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                    />
                </td>
            );
        });
    };

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Carga de Notas</h1>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ciclo Lectivo</label>
                    <select
                        value={selectedCycleId}
                        onChange={e => setSelectedCycleId(e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 font-bold"
                    >
                        {cycles.map(c => <option key={c.id} value={c.id}>{c.anio}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Curso</label>
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                    >
                        <option value="">Seleccionar Curso...</option>
                        {courses
                            .filter(c => !selectedCycleId || String(c.cicloLectivo.id) === selectedCycleId || String((c as any).cicloLectivoId) === selectedCycleId) // Ajustar según API real
                            .map(c => <option key={c.id} value={c.id}>{c.anioCurso} "{c.division}"</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Materia</label>
                    <select
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        className="w-full border rounded-lg p-2.5 bg-gray-50 font-medium"
                    >
                        <option value="">Seleccionar Materia...</option>
                        {subjects
                            .filter(s => {
                                const course = courses.find(c => c.id === +selectedCourseId);
                                if (!course) return true;

                                // Normalización de años para comparación (ej: "2do" -> "2", "2" -> "2")
                                const normalizeAnio = (a: string) => a.replace(/[^0-9]/g, '');
                                if (normalizeAnio(s.anioCurso) !== normalizeAnio(course.anioCurso)) return false;

                                // Orientación match
                                const courseOrientacion = (course as any).orientacion?.nombre?.toLowerCase() || '';
                                const subjectOrientacion = s.orientacionFiltro?.toLowerCase() || '';

                                // ESO matches 1st, 2nd, 3rd year regardless of "Bachiller..." name
                                if (subjectOrientacion === 'e.s.o') return true;
                                if (subjectOrientacion === '') return true; // General

                                // Fuzzy match: if subject orientacion is "comunicación" and course is "Bachiller en Comunicación"
                                return courseOrientacion.includes(subjectOrientacion);
                            })
                            .map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.orientacionFiltro || 'General'})</option>)}
                    </select>
                </div>
            </div>

            {/* Tabla Matriz */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto">
                {!selectedCourseId || !selectedSubjectId ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Selecciona un Curso y una Materia para ver la planilla.
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 animate-pulse">
                        Cargando planilla...
                    </div>
                ) : matrix.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        No hay estudiantes inscritos en este curso.
                    </div>
                ) : (
                    <table key={`${selectedCourseId}-${selectedSubjectId}`} className="w-full text-sm border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th rowSpan={2} className="p-3 text-left font-bold text-gray-600 border bg-gray-50 min-w-[200px] sticky left-0 z-20">Estudiante</th>
                                <th colSpan={4} className="p-2 text-center font-black text-gray-500 uppercase border bg-blue-50/50">1º Cuatrimestre</th>
                                <th colSpan={4} className="p-2 text-center font-black text-gray-500 uppercase border bg-green-50/50">2º Cuatrimestre</th>
                                <th colSpan={3} className="p-2 text-center font-black text-gray-500 uppercase border bg-yellow-50/50">Instancias Finales</th>
                            </tr>
                            <tr>
                                {/* Headers 1º Cuat */}
                                {INSTANCES.map(i => {
                                    const isClosed = periods.find(p => p.instancia === i.key && p.cuatrimestre === 1)?.cerrado;
                                    return (
                                        <th key={`1-${i.key}`} className={`p-2 text-center text-[10px] font-bold border w-16 ${isClosed ? 'bg-red-50 text-red-600' : 'bg-blue-50/30 text-gray-400'}`}>
                                            <div className="flex flex-col items-center gap-0.5">
                                                {isClosed && <span>🚫</span>}
                                                {i.label}
                                            </div>
                                        </th>
                                    );
                                })}
                                {/* Headers 2º Cuat */}
                                {INSTANCES.map(i => {
                                    const isClosed = periods.find(p => p.instancia === i.key && p.cuatrimestre === 2)?.cerrado;
                                    return (
                                        <th key={`2-${i.key}`} className={`p-2 text-center text-[10px] font-bold border w-16 ${isClosed ? 'bg-red-50 text-red-600' : 'bg-green-50/30 text-gray-400'}`}>
                                            <div className="flex flex-col items-center gap-0.5">
                                                {isClosed && <span>🚫</span>}
                                                {i.label}
                                            </div>
                                        </th>
                                    );
                                })}
                                {/* Headers Finales */}
                                {FINAL_INSTANCES.map(i => {
                                    const isClosed = periods.find(p => p.instancia === i.key && p.cuatrimestre === 2)?.cerrado;
                                    return (
                                        <th key={`F-${i.key}`} className={`p-2 text-center text-[10px] font-bold border w-16 ${isClosed ? 'bg-red-50 text-red-600' : 'bg-yellow-50/30 text-gray-400'}`}>
                                            <div className="flex flex-col items-center gap-0.5">
                                                {isClosed && <span>🚫</span>}
                                                {i.label}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map(row => (
                                <tr key={row.student.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-3 font-medium text-gray-700 border bg-white group-hover:bg-gray-50 sticky left-0 z-10 whitespace-nowrap">
                                        <span className="font-bold">{row.student.apellido}</span>, {row.student.nombre}
                                        <div className="text-[10px] text-gray-400">{row.student.dni}</div>
                                    </td>
                                    {getGradeInputs(row, 1)}
                                    {getGradeInputs(row, 2)}
                                    {getFinalInputs(row)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
