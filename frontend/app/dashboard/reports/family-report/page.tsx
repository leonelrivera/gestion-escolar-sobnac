'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FamilyReportPage() {
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [cursos, setCursos] = useState<any[]>([]);
    
    const [selectedCiclo, setSelectedCiclo] = useState<string>('');
    const [selectedCurso, setSelectedCurso] = useState<string>('');
    const [cuatrimestre, setCuatrimestre] = useState<string>('1');
    const [instancia, setInstancia] = useState<string>('INFORME_1');

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloadingCourse, setDownloadingCourse] = useState(false);
    const [downloadingStudent, setDownloadingStudent] = useState<number | null>(null);

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
    
    useEffect(() => {
        if (!selectedCurso) {
            setStudents([]);
            return;
        }
        setLoading(true);
        // Fetch students of the course just for the list
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${selectedCurso}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.inscripciones) {
                    const sorted = data.inscripciones.map((i: any) => i.estudiante).sort((a: any, b: any) => {
                        const nameA = `${a.apellido} ${a.nombre}`.toLowerCase();
                        const nameB = `${b.apellido} ${b.nombre}`.toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    setStudents(sorted);
                } else {
                    setStudents([]);
                }
            })
            .catch(() => setStudents([]))
            .finally(() => setLoading(false));
    }, [selectedCurso]);

    const handleDownloadCourse = async () => {
        if (!selectedCurso) return alert('Seleccione un curso');
        setDownloadingCourse(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/family-report/course?cursoId=${selectedCurso}&cuatrimestre=${cuatrimestre}&instancia=${instancia}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `informes_familia_curso.pdf`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 200);
            } else {
                alert('Error al generar PDF del curso');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setDownloadingCourse(false);
        }
    };
    
    const handleDownloadStudent = async (studentId: number, nombre: string) => {
        if (!selectedCurso) return alert('Seleccione un curso');
        setDownloadingStudent(studentId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/family-report/student/${studentId}?cursoId=${selectedCurso}&cuatrimestre=${cuatrimestre}&instancia=${instancia}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `informe_familia_${nombre.replace(/ /g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 200);
            } else {
                alert('Error al generar PDF del estudiante');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setDownloadingStudent(null);
        }
    };

    const isCuatrimestreRegular = cuatrimestre === '1' || cuatrimestre === '2';

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/reports" className="text-gray-500 hover:text-gray-800 transition">
                        ← Volver
                    </Link>
                    <h1 className="text-2xl font-black text-black">Informe para Familias</h1>
                </div>
                {selectedCurso && (
                    <button
                        onClick={handleDownloadCourse}
                        disabled={downloadingCourse}
                        className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition shadow-lg flex items-center gap-2 disabled:bg-red-400"
                    >
                        {downloadingCourse ? 'Generando PDF...' : 'Descargar Curso Completo (A4)'}
                    </button>
                )}
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
                       setInstancia('INFORME_1');
                   }} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                       <option value="1">1º Cuatrimestre</option>
                       <option value="2">2º Cuatrimestre</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-black text-black uppercase mb-1">Instancia</label>
                   <select value={instancia} onChange={e => setInstancia(e.target.value)} className="w-full border-2 border-gray-400 rounded p-2 text-sm font-black text-black">
                       <option value="INFORME_1">INFORME 1</option>
                       <option value="INFORME_2">INFORME 2</option>
                   </select>
                </div>
            </div>

            {/* Listado de Alumnos para descarga individual */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden flex-1">
                <div className="p-4 bg-gray-50 border-b-2 border-gray-200 font-bold text-gray-800">
                    Alumnos del Curso 
                    {students.length > 0 && <span className="ml-2 text-gray-500 font-normal">({students.length})</span>}
                </div>
                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-bold">Cargando alumnos...</div>
                ) : students.length > 0 ? (
                    <ul className="divide-y-2 divide-gray-100 max-h-[500px] overflow-y-auto">
                        {students.map((st: any) => (
                            <li key={st.id} className="p-4 flex items-center justify-between hover:bg-red-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700">
                                        {st.nombre.charAt(0)}{st.apellido.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-black text-black text-lg uppercase">{st.apellido}, {st.nombre}</div>
                                        <div className="text-gray-500 font-semibold text-sm">DNI: {st.dni}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadStudent(st.id, `${st.apellido}_${st.nombre}`)}
                                    disabled={downloadingStudent === st.id}
                                    className="px-4 py-2 bg-red-100 text-red-700 border-2 border-red-200 font-bold rounded-lg hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                                >
                                    {downloadingStudent === st.id ? 'Generando...' : 'Descargar Individual'}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : selectedCurso ? (
                    <div className="p-8 text-center text-gray-500 font-bold">No hay alumnos inscriptos en este curso.</div>
                ) : (
                    <div className="p-8 text-center text-gray-400 font-semibold">Selecciona un curso para ver los estudiantes.</div>
                )}
            </div>
        </div>
    );
}
