'use client';

import { useState, useEffect } from 'react';

const isBeforeEntryDate = (fechaIngreso: string | null, attendanceDate: string) => {
    if (!fechaIngreso) return false;
    const ingreso = new Date(fechaIngreso);
    const [year, month, day] = attendanceDate.split('-');
    const asistencia = new Date(+year, +month - 1, +day);
    const ingresoLocal = new Date(ingreso.getUTCFullYear(), ingreso.getUTCMonth(), ingreso.getUTCDate());
    return asistencia < ingresoLocal;
};

export default function AttendancePage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [cycles, setCycles] = useState<{ id: number; anio: number; enCurso: boolean }[]>([]);
    const [attendances, setAttendances] = useState<Record<number, boolean>>({}); // Key is inscripcionId
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedCycle, setSelectedCycle] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Opciones Masivas
    const [isFeriado, setIsFeriado] = useState(false);
    const [isSuspension, setIsSuspension] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Cargar Ciclos Lectivos
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setCycles(data);
                const active = data.find((c: any) => c.enCurso);
                if (active) setSelectedCycle(String(active.anio));
                else if (data.length > 0) setSelectedCycle(String(data[0].anio));
            })
            .catch(console.error);

        // Cargar Cursos
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/courses`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setCourses(data);
            })
            .catch(console.error);
    }, []);

    // Fetch students and existing attendance when filters change
    useEffect(() => {
        if (selectedCourseId && selectedDate) {
            fetchData();
        } else {
            setStudents([]);
        }
    }, [selectedCourseId, selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // 1. Get Students for the course
            const studentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students?curso=${selectedCourseId.split('-')[1]}&division=${selectedCourseId.split('-')[2]}&cicloLectivo=${selectedCycle}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Actually, querying by 'curso' string is tricky if I only have ID. 
            // Better to use the backend support for filtering by course ID if available, 
            // OR find the course object and use its properties.
            const course = courses.find(c => c.id === +selectedCourseId);
            if (!course) return;

            // My backend students filter uses 'curso' (anio) and 'division'.
            const sRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students?curso=${course.anioCurso}&division=${course.division}&cicloLectivo=${course.cicloLectivo.anio}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rawStudents = await sRes.json();
            const studentsData = rawStudents.filter((s: any) => s.condicion !== 'PASE');

            // 2. Get Existing Attendance
            const attRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance?cursoId=${selectedCourseId}&fecha=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const attendanceData = await attRes.json();

            // 3. Merge
            const attMap: Record<number, boolean> = {};
            studentsData.forEach((s: any) => {
                const inscripcion = s.inscripciones[0];
                if (!inscripcion) return;

                const record = attendanceData.find((a: any) => a.inscripcionId === inscripcion.id);
                if (record) {
                    attMap[inscripcion.id] = record.presente;
                } else {
                    attMap[inscripcion.id] = true;
                }
            });
            setAttendances(attMap);
            setStudents(studentsData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (insId: number) => {
        setAttendances(prev => ({
            ...prev,
            [insId]: !prev[insId]
        }));
    };

    const saveAttendance = async () => {
        const token = localStorage.getItem('token');
        let payload: any[] = [];
        
        if (isFeriado || isSuspension) {
            const observacion = isFeriado ? 'Feriado' : `Suspensión: ${suspensionReason}`;
            payload = students.map((s: any) => {
                if (isBeforeEntryDate(s.fechaIngreso, selectedDate)) return null;
                const inscripcion = s.inscripciones[0];
                return inscripcion ? {
                    inscripcionId: inscripcion.id,
                    fecha: selectedDate,
                    presente: false,
                    justificado: true,
                    observaciones: observacion
                } : null;
            }).filter(Boolean);
        } else {
            payload = Object.entries(attendances).map(([insId, presente]) => {
                const s = students.find((st: any) => st.inscripciones[0]?.id === +insId);
                if (s && isBeforeEntryDate(s.fechaIngreso, selectedDate)) return null;
                return {
                    inscripcionId: +insId,
                    fecha: selectedDate,
                    presente,
                    justificado: false,
                    observaciones: ''
                };
            }).filter(Boolean);
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Asistencia guardada correctamente');
                fetchData(); // Refresh to be sure
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCourses = courses.filter(c => String(c.cicloLectivo.anio) === selectedCycle);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Control de Asistencia</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciclo Lectivo</label>
                    <select
                        value={selectedCycle}
                        onChange={e => setSelectedCycle(e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                    >
                        <option value="">Seleccionar...</option>
                        {cycles.map(c => (
                            <option key={c.id} value={c.anio}>{c.anio} {c.enCurso && '(En Curso)'}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
                    <select
                        value={selectedCourseId}
                        onChange={e => setSelectedCourseId(e.target.value)} // Storing ID
                        className="w-full border rounded p-2 text-sm"
                    >
                        <option value="">Seleccionar Curso...</option>
                        {filteredCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.anioCurso} "{c.division}" ({c.turno})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-full border rounded p-2 text-sm"
                    />
                </div>
                <div>
                    <button
                        onClick={fetchData}
                        disabled={!selectedCourseId}
                        className="w-full bg-blue-600 text-white font-bold py-2 rounded disabled:bg-gray-300 hover:bg-blue-700 transition"
                    >
                        Cargar Lista
                    </button>
                </div>
            </div>

            {/* Opciones Masivas */}
            {!loading && students.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isFeriado"
                            checked={isFeriado}
                            onChange={(e) => {
                                setIsFeriado(e.target.checked);
                                if (e.target.checked) setIsSuspension(false);
                            }}
                            className="w-5 h-5 text-orange-600 cursor-pointer rounded"
                        />
                        <label htmlFor="isFeriado" className="font-bold text-orange-800 cursor-pointer">Día Feriado</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isSuspension"
                            checked={isSuspension}
                            onChange={(e) => {
                                setIsSuspension(e.target.checked);
                                if (e.target.checked) setIsFeriado(false);
                            }}
                            className="w-5 h-5 text-orange-600 cursor-pointer rounded"
                        />
                        <label htmlFor="isSuspension" className="font-bold text-orange-800 cursor-pointer">Suspensión de Actividades</label>
                    </div>
                    {isSuspension && (
                        <div className="flex-1 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Motivo breve (ej. Falta de agua, Desinfección...)"
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                className="w-full border-orange-200 rounded p-2 text-sm focus:ring-orange-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            )}

            {loading && <p className="text-center p-4">Cargando...</p>}

            {!loading && students.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Listado de Estudiantes ({students.length})</h3>
                        <div className="text-sm text-gray-500">
                            Presentes: <span className="text-green-600 font-bold">{students.filter(s => !isBeforeEntryDate(s.fechaIngreso, selectedDate)).filter(s => attendances[s.inscripciones[0]?.id]).length}</span> |
                            Ausentes: <span className="text-red-600 font-bold">{students.filter(s => !isBeforeEntryDate(s.fechaIngreso, selectedDate)).filter(s => !attendances[s.inscripciones[0]?.id]).length}</span>
                        </div>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estudiante</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => (
                                <tr key={student.id} className={`hover:bg-gray-50 ${(isFeriado || isSuspension) ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-gray-800 uppercase">
                                        {student.apellido}, {student.nombre}
                                        <span className="block text-xs text-gray-400 font-normal">{student.dni}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isBeforeEntryDate(student.fechaIngreso, selectedDate) ? (
                                            <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">PREVIO AL INGRESO</span>
                                        ) : (isFeriado || isSuspension) ? (
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">JUSTIFICADO MASIVO</span>
                                        ) : attendances[student.inscripciones[0]?.id] ? (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PRESENTE</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">AUSENTE</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center flex justify-center">
                                        {!isBeforeEntryDate(student.fechaIngreso, selectedDate) && (
                                            <button
                                                onClick={() => toggleAttendance(student.inscripciones[0]?.id)}
                                                disabled={isFeriado || isSuspension}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold disabled:bg-gray-100 disabled:text-gray-300 ${attendances[student.inscripciones[0]?.id]
                                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                                    }`}
                                                title={attendances[student.inscripciones[0]?.id] ? 'Marcar Ausente' : 'Marcar Presente'}
                                            >
                                                {attendances[student.inscripciones[0]?.id] ? '✕' : '✓'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 bg-gray-50 border-t text-right">
                        <button
                            onClick={saveAttendance}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition"
                        >
                            Guardar Asistencia
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
