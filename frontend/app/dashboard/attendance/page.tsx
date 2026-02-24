'use client';

import { useState, useEffect } from 'react';

export default function AttendancePage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendances, setAttendances] = useState<Record<number, boolean>>({}); // Key is inscripcionId
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedCycle, setSelectedCycle] = useState('2025');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:3001/courses', { headers: { Authorization: `Bearer ${token}` } })
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
            const studentsRes = await fetch(`http://localhost:3001/students?curso=${selectedCourseId.split('-')[1]}&division=${selectedCourseId.split('-')[2]}&cicloLectivo=${selectedCycle}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Actually, querying by 'curso' string is tricky if I only have ID. 
            // Better to use the backend support for filtering by course ID if available, 
            // OR find the course object and use its properties.
            const course = courses.find(c => c.id === +selectedCourseId);
            if (!course) return;

            // My backend students filter uses 'curso' (anio) and 'division'.
            const sRes = await fetch(`http://localhost:3001/students?curso=${course.anioCurso}&division=${course.division}&cicloLectivo=${course.cicloLectivo.anio}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const studentsData = await sRes.json();

            // 2. Get Existing Attendance
            const attRes = await fetch(`http://localhost:3001/attendance?cursoId=${selectedCourseId}&fecha=${selectedDate}`, {
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
        const payload = Object.entries(attendances).map(([insId, presente]) => ({
            inscripcionId: +insId,
            fecha: selectedDate,
            presente
        }));

        try {
            const res = await fetch('http://localhost:3001/attendance/bulk', {
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
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
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

            {loading && <p className="text-center p-4">Cargando...</p>}

            {!loading && students.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Listado de Estudiantes ({students.length})</h3>
                        <div className="text-sm text-gray-500">
                            Presentes: <span className="text-green-600 font-bold">{Object.values(attendances).filter(Boolean).length}</span> |
                            Ausentes: <span className="text-red-600 font-bold">{Object.values(attendances).filter(v => !v).length}</span>
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
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-800 uppercase">
                                        {student.apellido}, {student.nombre}
                                        <span className="block text-xs text-gray-400 font-normal">{student.dni}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {attendances[student.inscripciones[0]?.id] ? (
                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PRESENTE</span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">AUSENTE</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleAttendance(student.inscripciones[0]?.id)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold ${attendances[student.inscripciones[0]?.id]
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                                }`}
                                            title={attendances[student.inscripciones[0]?.id] ? 'Marcar Ausente' : 'Marcar Presente'}
                                        >
                                            {attendances[student.inscripciones[0]?.id] ? '✕' : '✓'}
                                        </button>
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
