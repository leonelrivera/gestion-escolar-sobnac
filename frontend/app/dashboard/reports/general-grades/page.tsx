'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GeneralGradesReportPage() {
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    
    const [selectedCiclo, setSelectedCiclo] = useState<string>('');
    const [selectedCurso, setSelectedCurso] = useState<string>('');
    const [cuatrimestre, setCuatrimestre] = useState<string>('1');
    const [instancia, setInstancia] = useState<string>('INFORME_1');

    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/cycles`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setCiclos(data);
                const activo = data.find((c: any) => c.enCurso);
                if (activo) setSelectedCiclo(String(activo.id));
                else if (data.length > 0) setSelectedCiclo(String(data[0].id));
            });
    }, []);

    useEffect(() => {
        if (!selectedCiclo) return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses?cicloLectivoId=${selectedCiclo}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setCursos(data));
    }, [selectedCiclo]);

    const handleSearch = async () => {
        if (!selectedCurso) return alert('Seleccione un curso');
        
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/general-grades?cursoId=${selectedCurso}&cuatrimestre=${cuatrimestre}&instancia=${instancia}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Error al cargar reporte');
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            alert('Error cargando el reporte');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (!selectedCurso) return alert('Seleccione un curso');
        setDownloading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/general-grades/excel?cursoId=${selectedCurso}&cuatrimestre=${cuatrimestre}&instancia=${instancia}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `notas_generales_${cuatrimestre}_${instancia}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Error al generar Excel');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setDownloading(false);
        }
    };

    const calcSummary = () => {
        if (!reportData || !reportData.alumnos) return null;
        const total = reportData.alumnos.length;
        
        let alta = 0;
        let media = 0;
        let baja = 0;

        const desaprMateria: Record<string, number> = {};
        const evaluadosMateria: Record<string, number> = {};

        reportData.materias.forEach((m: string) => {
            desaprMateria[m] = 0;
            evaluadosMateria[m] = 0;
        });

        reportData.alumnos.forEach((a: any) => {
            if (a.riesgo === 'A') alta++;
            if (a.riesgo === 'M') media++;
            if (a.riesgo === 'B') baja++;

            reportData.materias.forEach((m: string) => {
                const val = a.materias[m];
                if (val !== null && val !== undefined) {
                    evaluadosMateria[m]++;
                    if (val < 6) desaprMateria[m]++;
                }
            });
        });

        return { alta, media, baja, total, desaprMateria, evaluadosMateria };
    };

    const isCuatrimestreRegular = cuatrimestre === '1' || cuatrimestre === '2';

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/reports" className="text-gray-500 hover:text-gray-800 transition">
                        ← Volver
                    </Link>
                    <h1 className="text-2xl font-black text-black">Reporte: Notas Generales por Informe</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition"
                    >
                        {loading ? 'Cargando...' : 'Generar Vista'}
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={downloading || !reportData}
                        className="px-5 py-2.5 bg-green-600 text-white font-black rounded-lg hover:bg-green-700 transition disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                        {downloading ? 'Descargando...' : 'Descargar Excel'}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                   <label className="block text-xs font-black text-black uppercase mb-1">Ciclo Lectivo</label>
                   <select value={selectedCiclo} onChange={e => setSelectedCiclo(e.target.value)} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                       {ciclos.map(c => <option key={c.id} value={c.id}>{c.anio} {c.enCurso ? '(Actual)' : ''}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-black text-black uppercase mb-1">Curso</label>
                   <select value={selectedCurso} onChange={e => setSelectedCurso(e.target.value)} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                       <option value="">Seleccione Curso...</option>
                       {cursos.map(c => <option key={c.id} value={c.id}>{c.anioCurso} &quot;{c.division}&quot; {c.turno ? `- ${c.turno}` : ''}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-black text-black uppercase mb-1">Cuatrimestre / Etapa</label>
                   <select value={cuatrimestre} onChange={e => {
                       setCuatrimestre(e.target.value);
                       if (e.target.value !== '1' && e.target.value !== '2') {
                           setInstancia('CIERRE'); 
                       } else {
                           setInstancia('INFORME_1');
                       }
                   }} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                       <option value="1">1º Cuatrimestre</option>
                       <option value="2">2º Cuatrimestre</option>
                       <option value="DICIEMBRE">DICIEMBRE</option>
                       <option value="FEBRERO">FEBRERO</option>
                       <option value="C.FINAL">C.FINAL</option>
                   </select>
                </div>
                {isCuatrimestreRegular && (
                    <div>
                       <label className="block text-xs font-black text-black uppercase mb-1">Instancia</label>
                       <select value={instancia} onChange={e => setInstancia(e.target.value)} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                           <option value="INFORME_1">INFORME 1</option>
                           <option value="INFORME_2">INFORME 2</option>
                           <option value="PFA">PFA</option>
                           <option value="CIERRE">CIERRE</option>
                       </select>
                    </div>
                )}
            </div>

            {/* Render Tabla */}
            {reportData && (
                <div className="bg-white rounded-xl shadow border-2 border-gray-300 overflow-hidden text-sm flex-1">
                    <div className="p-4 bg-gray-50 border-b-2 border-gray-300 font-black text-lg text-black text-center">
                        Curso: {reportData.curso}
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-400">
                                    <th className="px-2 py-3 border-r-2 border-gray-300 font-black text-black">Nº</th>
                                    <th className="px-3 py-3 border-r-2 border-gray-300 font-black text-black text-left">DNI</th>
                                    <th className="px-2 py-3 border-r-2 border-gray-300 font-black text-black">Sexo</th>
                                    <th className="px-4 py-3 border-r-2 border-gray-300 font-black text-black text-left min-w-[250px]">Apellido y Nombre</th>
                                    {reportData.materias.map((m: string) => (
                                        <th key={m} className="px-2 py-3 border-r-2 border-gray-300 font-black text-black text-xs break-all w-16 px-1">{m}</th>
                                    ))}
                                    <th className="px-2 py-3 border-r-2 border-gray-300 font-black text-black bg-orange-50 whitespace-nowrap">C. Desapr</th>
                                    <th className="px-2 py-3 font-black text-black bg-red-50">R.P.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.alumnos.map((a: any, index: number) => (
                                    <tr key={a.id} className="border-b border-gray-300 hover:bg-yellow-50 transition-colors">
                                        <td className="px-2 py-2 border-r-2 border-gray-300 font-bold text-gray-700">{index + 1}</td>
                                        <td className="px-3 py-2 border-r-2 border-gray-300 font-bold text-gray-800 text-left whitespace-nowrap">{a.dni}</td>
                                        <td className="px-2 py-2 border-r-2 border-gray-300 font-bold text-gray-800">{a.genero}</td>
                                        <td className="px-4 py-2 border-r-2 border-gray-300 font-black text-black text-left uppercase whitespace-nowrap">{a.apellido}, {a.nombre}</td>
                                        {reportData.materias.map((m: string) => (
                                            <td key={m} className={`px-2 py-2 border-r-2 border-gray-300 font-black ${
                                                a.materias[m] !== null && a.materias[m] < 6 ? 'text-white bg-red-500' : 'text-black'
                                            }`}>
                                                {a.materias[m] !== null ? a.materias[m] : '-'}
                                            </td>
                                        ))}
                                        <td className="px-2 py-2 border-r-2 border-gray-300 font-black text-black bg-orange-50/50">{a.desaprobadas > 0 ? a.desaprobadas : ''}</td>
                                        <td className={`px-2 py-2 font-black text-center ${
                                            a.riesgo === 'A' ? 'text-white bg-red-600' :
                                            a.riesgo === 'M' ? 'text-white bg-orange-500' :
                                            a.riesgo === 'B' ? 'text-white bg-yellow-500' : 'text-transparent'
                                        }`}>
                                            {a.riesgo}
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Resumen Stats */}
                                {(() => {
                                    const sum = calcSummary();
                                    if (!sum) return null;
                                    return (
                                        <>
                                            <tr className="border-b-2 border-gray-400 bg-gray-100">
                                                <td colSpan={4} className="px-4 py-3 border-r-2 border-gray-300 text-right font-black text-black">
                                                    CANTIDAD DESAPROBADOS POR MATERIA
                                                </td>
                                                {reportData.materias.map((m: string) => (
                                                    <td key={m} className="px-2 py-3 border-r-2 border-gray-300 font-black text-black text-red-700 bg-red-100">
                                                        {sum.desaprMateria[m]}
                                                    </td>
                                                ))}
                                                <td className="px-2 py-3 border-r-2 border-gray-300" colSpan={2}></td>
                                            </tr>
                                            <tr className="border-b-2 border-gray-400 bg-gray-100">
                                                <td colSpan={4} className="px-4 py-3 border-r-2 border-gray-300 text-right font-black text-black">
                                                    PORCENTAJE DESAPROBADOS POR MATERIA
                                                </td>
                                                {reportData.materias.map((m: string) => {
                                                    const pct = sum.evaluadosMateria[m] > 0 
                                                        ? ((sum.desaprMateria[m] / sum.evaluadosMateria[m]) * 100).toFixed(0) + '%' 
                                                        : 'S/C';
                                                    return (
                                                        <td key={m} className="px-2 py-3 border-r-2 border-gray-300 font-black text-black bg-orange-100">
                                                            {pct}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-2 py-3 border-r-2 border-gray-300 font-black text-black text-xs whitespace-nowrap bg-red-50 text-right">Riesgos:</td>
                                                <td className="px-2 py-3 border-r-2 border-gray-300 font-black text-black p-0">
                                                    <div className="flex h-full w-full">
                                                        <div className="flex-1 bg-red-600 text-white p-1 flex items-center justify-center">A</div>
                                                        <div className="flex-1 bg-orange-500 text-white p-1 flex items-center justify-center border-l-2 border-r-2 border-white">M</div>
                                                        <div className="flex-1 bg-yellow-500 text-white p-1 flex items-center justify-center">B</div>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b-2 border-gray-400 bg-gray-100">
                                                <td colSpan={4} className="px-4 py-3 border-r-2 border-gray-300 text-right"></td>
                                                {reportData.materias.map((m: string) => (
                                                    <td key={m} className="border-r-2 border-gray-300"></td>
                                                ))}
                                                <td className="px-2 py-3 border-r-2 border-gray-300 text-right font-black text-black text-xs whitespace-nowrap">Conteo Alumnos:</td>
                                                <td className="border-r-2 border-gray-300 p-0 font-black">
                                                    <div className="flex h-full text-black h-8 text-xs bg-white">
                                                        <div className="flex-1 p-1 border-r-2 flex items-center justify-center border-gray-300 text-red-700 bg-red-50">{sum.alta}</div>
                                                        <div className="flex-1 p-1 border-r-2 flex items-center justify-center border-gray-300 text-orange-700 bg-orange-50">{sum.media}</div>
                                                        <div className="flex-1 p-1 flex items-center justify-center text-yellow-700 bg-yellow-50">{sum.baja}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
