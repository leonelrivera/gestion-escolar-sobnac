'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AttendanceReportPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [cycles, setCycles] = useState<{ id: number; anio: number; enCurso: boolean }[]>([]);
    
    // Filters
    const [selectedCycle, setSelectedCycle] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{ estudiantes: any[], fechas: string[], asistencias: any[] } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(res => {
                setCycles(res);
                const active = res.find((c: any) => c.enCurso);
                if (active) setSelectedCycle(String(active.anio));
                else if (res.length > 0) setSelectedCycle(String(res[0].anio));
            })
            .catch(console.error);

        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/courses`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setCourses)
            .catch(console.error);
            
        // Default dates to current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFechaDesde(firstDay.toISOString().split('T')[0]);
        setFechaHasta(lastDay.toISOString().split('T')[0]);
    }, []);

    const filteredCourses = courses.filter(c => String(c.cicloLectivo.anio) === selectedCycle);

    const handleSearch = async () => {
        if (!selectedCourseId || !fechaDesde || !fechaHasta) {
            alert('Por favor completa todos los filtros');
            return;
        }
        setLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            // Get attendance records
            const attRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance?cursoId=${selectedCourseId}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const attendances = await attRes.json();
            
            // Get all students for the course
            const course = courses.find(c => c.id === +selectedCourseId);
            const sRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students?curso=${course.anioCurso}&division=${course.division}&cicloLectivo=${course.cicloLectivo.anio}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const students = await sRes.json();
            
            // Extract unique dates
            const fechasSet = new Set<string>();
            attendances.forEach((a: any) => {
                fechasSet.add(a.fecha.split('T')[0]);
            });
            const fechas = Array.from(fechasSet).sort();
            
            setData({ estudiantes: students, fechas, asistencias: attendances });
        } catch (error) {
            console.error(error);
            alert('Error al cargar reporte');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!selectedCourseId || !fechaDesde || !fechaHasta) return;
        const token = localStorage.getItem('token');
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/attendance?cursoId=${selectedCourseId}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
        
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                if (!res.ok) throw new Error('Error al generar PDF');
                return res.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `control_asistencias_${fechaDesde}_al_${fechaHasta}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => {
                console.error(err);
                alert('No se pudo descargar el PDF');
            });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Reporte de Control de Asistencias</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                            onChange={e => setSelectedCourseId(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="">Seleccionar Curso...</option>
                            {filteredCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.anioCurso} "{c.division}" ({c.turno})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSearch}
                            disabled={!selectedCourseId || !fechaDesde || !fechaHasta || loading}
                            className="flex-1 bg-blue-600 text-white font-bold py-2 rounded disabled:bg-gray-300 hover:bg-blue-700 transition"
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>
            </div>

            {data && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-700">Resultados</h2>
                        <button
                            onClick={handleDownloadPDF}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-sm text-sm"
                        >
                            📄 Descargar Planilla PDF
                        </button>
                    </div>

                    {data.fechas.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No hay registros de asistencia en el rango seleccionado.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse border border-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-3 border border-gray-200 text-xs font-bold text-gray-600 uppercase w-64 min-w-[200px]">Estudiante</th>
                                        {data.fechas.map(f => (
                                            <th key={f} className="p-2 border border-gray-200 text-center text-[10px] font-bold text-gray-600 min-w-[40px]">
                                                {f.split('-')[2]}/{f.split('-')[1]}
                                            </th>
                                        ))}
                                        <th className="p-2 border border-gray-200 text-center text-xs font-bold text-green-700 min-w-[50px]">P</th>
                                        <th className="p-2 border border-gray-200 text-center text-xs font-bold text-red-700 min-w-[50px]">A</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.estudiantes.map((student: any) => {
                                        const inscripcion = student.inscripciones[0];
                                        if (!inscripcion) return null;
                                        
                                        let presentes = 0;
                                        let ausentes = 0;

                                        return (
                                            <tr key={student.id} className="hover:bg-blue-50/30">
                                                <td className="p-3 border border-gray-200 font-medium text-sm text-gray-800 uppercase">
                                                    {student.apellido}, {student.nombre}
                                                </td>
                                                {data.fechas.map(f => {
                                                    const asis = data.asistencias.find((a: any) => a.inscripcionId === inscripcion.id && a.fecha.split('T')[0] === f);
                                                    let label = '-';
                                                    let colorClass = 'text-gray-400';
                                                    
                                                    if (asis) {
                                                        if (asis.presente) {
                                                            label = 'P';
                                                            colorClass = 'text-green-600 font-bold';
                                                            presentes++;
                                                        } else if (asis.justificado) {
                                                            label = 'J';
                                                            colorClass = 'text-orange-500 font-bold';
                                                        } else {
                                                            label = 'A';
                                                            colorClass = 'text-red-600 font-bold';
                                                            ausentes++;
                                                        }
                                                    }

                                                    return (
                                                        <td key={f} className={`p-2 border border-gray-200 text-center text-sm ${colorClass}`} title={asis?.observaciones || ''}>
                                                            {label}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-2 border border-gray-200 text-center font-bold text-green-700 bg-green-50/30">{presentes}</td>
                                                <td className="p-2 border border-gray-200 text-center font-bold text-red-700 bg-red-50/30">{ausentes}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
