'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TotalClassesReportPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [cycles, setCycles] = useState<{ id: number; anio: number; enCurso: boolean }[]>([]);
    
    // Filters
    const [selectedCycle, setSelectedCycle] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('TODOS');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [results, setResults] = useState<{ id: number; cursoStr: string; totalDias: number }[] | null>(null);

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
        if (!selectedCycle || !fechaDesde || !fechaHasta) {
            alert('Por favor completa todos los filtros requeridos');
            return;
        }

        setLoadingData(true);
        setResults(null);
        try {
            const token = localStorage.getItem('token');
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/total-classes/data`);
            url.searchParams.append('ciclo', selectedCycle);
            url.searchParams.append('desde', fechaDesde);
            url.searchParams.append('hasta', fechaHasta);
            if (selectedCourseId !== 'TODOS') {
                url.searchParams.append('cursoId', selectedCourseId);
            }

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al buscar los datos');
            const data = await res.json();
            setResults(data);
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoadingData(false);
        }
    };

    const handleDownload = async () => {
        if (!selectedCycle || !fechaDesde || !fechaHasta) {
            alert('Por favor completa todos los filtros requeridos');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/total-classes`);
            url.searchParams.append('ciclo', selectedCycle);
            url.searchParams.append('desde', fechaDesde);
            url.searchParams.append('hasta', fechaHasta);
            if (selectedCourseId !== 'TODOS') {
                url.searchParams.append('cursoId', selectedCourseId);
            }

            const res = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Error al generar el reporte');
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `Dias_Totales_Clases_${selectedCourseId === 'TODOS' ? 'Todos' : selectedCourseId}_${fechaDesde}_${fechaHasta}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'No se pudo generar el PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/dashboard/reports" className="text-gray-500 hover:text-gray-800 transition">
                    ← Volver
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Reporte: Días Totales de Clases por Curso</h1>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ciclo Lectivo</label>
                        <select
                            value={selectedCycle}
                            onChange={e => setSelectedCycle(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        >
                            <option value="">Seleccionar...</option>
                            {cycles.map(c => (
                                <option key={c.id} value={c.anio}>{c.anio} {c.enCurso ? '(Actual)' : ''}</option>
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
                            <option value="TODOS">TODOS LOS CURSOS</option>
                            {filteredCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.anioCurso} "{c.division}" - {c.turno}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleSearch}
                        disabled={loadingData}
                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors ${loadingData ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loadingData ? 'Buscando...' : 'Buscar'}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={loading}
                        className={`bg-fuchsia-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-fuchsia-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800">
                <p><strong>Nota:</strong> Este reporte cuenta la cantidad de días efectivos de clase. Un día es considerado "Día de clase" para un curso si al menos un estudiante de dicho curso tiene cargada una asistencia (presente) en esa fecha.</p>
            </div>

            {results && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Resultados de la Búsqueda</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Curso</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Días Efectivos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                                        No hay datos para mostrar con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                results.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.cursoStr}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-fuchsia-600">
                                            {item.totalDias}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
