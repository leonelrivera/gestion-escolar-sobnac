'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

export default function StudentProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { canEditStudent } = usePermissions();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [observations, setObservations] = useState('');
    const [savingObs, setSavingObs] = useState(false);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Error al cargar perfil');
                const data = await res.json();
                setStudent(data);
                setObservations(data.observacionesGenerales || '');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    const handleUpdateObservations = async () => {
        setSavingObs(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ observacionesGenerales: observations })
            });
            if (!res.ok) throw new Error('Error al guardar observaciones');
            // Flash a nice feedback or just stay silent
        } catch (err) {
            console.error(err);
            alert('Error al guardar observaciones');
        } finally {
            setSavingObs(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'ficha' | 'trayectoria'>('ficha');

    if (loading) return <div className="p-8 text-center animate-pulse">Cargando ficha técnica...</div>;
    if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium">
                    ← Volver a la lista
                </button>
                <div className="space-x-4">
                    <button
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/bulletin/${student.id}?token=${localStorage.getItem('token')}`, '_blank')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-700 transition text-sm"
                    >
                        Descargar Boletín (PDF)
                    </button>
                    {canEditStudent && (
                        <button
                            onClick={() => router.push(`/dashboard/students/${student.id}/edit`)}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold border hover:bg-gray-200 text-sm"
                        >
                            Editar Datos
                        </button>
                    )}
                </div>
            </div>

            {/* Cabecera de Perfil */}
            <div className="bg-white rounded-2xl shadow-sm border p-6 flex items-start gap-6">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black">
                    {student.apellido[0]}{student.nombre[0]}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{student.apellido}, {student.nombre}</h1>
                            <p className="text-gray-500 font-medium text-sm">DNI: {student.dni} | {student.genero}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${student.condicion === 'REGULAR' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {student.condicion}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('ficha')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'ficha' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Ficha Técnica
                </button>
                <button
                    onClick={() => setActiveTab('trayectoria')}
                    className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'trayectoria' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Trayectoria Académica
                </button>
            </div>

            {activeTab === 'ficha' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sección 1: Salud y Emergencia */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="bg-red-50 px-6 py-3 border-b border-red-100 flex items-center gap-2">
                                <span className="text-red-600 font-bold text-sm">⚠️ Datos de Salud y Emergencia</span>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Grupo Sanguíneo</p>
                                        <p className="font-bold text-gray-700">{student.grupoSanguineo || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Obra Social</p>
                                        <p className="font-bold text-gray-700">{student.obraSocial || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Alergias</p>
                                    <p className="font-bold text-gray-700">{student.alergias || 'Ninguna informada'}</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <p className="text-[10px] font-bold text-orange-700 uppercase mb-1">Contacto de Emergencia</p>
                                    <p className="text-base font-black text-gray-800">{student.contactoEmergenciaNombre || 'SIN DATOS'}</p>
                                    <p className="text-sm font-bold text-gray-600">{student.contactoEmergenciaTelefono || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Familia y Contacto */}
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex items-center gap-2">
                                <span className="text-blue-600 font-bold text-sm">🏠 Datos Familiares</span>
                            </div>
                            <div className="p-6 space-y-4 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Padre/Madre/Tutor</p>
                                    <p className="font-bold text-gray-700 text-lg uppercase">{student.nombreTutor || '-'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Teléfono Tutor</p>
                                        <p className="font-bold text-gray-700">{student.telefonoTutor || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Email Tutor</p>
                                        <p className="font-bold text-gray-700">{student.emailTutor || '-'}</p>
                                    </div>
                                </div>
                                {student.nombreTutorAlternativo && (
                                    <div className="pt-2 border-t border-gray-100 mt-2">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Tutor Alternativo</p>
                                        <p className="font-bold text-gray-700 uppercase mb-1">{student.nombreTutorAlternativo}</p>
                                        <p className="font-bold text-gray-500 text-xs">📞 {student.telefonoTutorAlternativo || '-'} | ✉️ {student.emailTutorAlternativo || '-'}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Domicilio Estudiante</p>
                                    <p className="font-bold text-gray-700">{student.domicilio || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-2">
                            <span className="text-gray-700 font-bold text-sm">📚 Registro Libro Matriz y Académico</span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">Libros y Folios</h3>
                                <div className="space-y-2">
                                    {student.librosFolios.map((lf: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Asiento {i + 1}</span>
                                            <span className="font-black text-blue-600 text-sm">LIBRO {lf.libro} / FOLIO {lf.folio}</span>
                                        </div>
                                    ))}
                                    {student.librosFolios.length === 0 && <p className="text-xs text-gray-400 italic">No hay registros de libro/folio.</p>}
                                </div>
                            </div>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Lugar Nacimiento</p>
                                        <p className="font-bold text-gray-700">{student.lugarNacimiento || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Fecha Ingreso</p>
                                        <p className="font-bold text-gray-700">{student.fechaIngreso ? new Date(student.fechaIngreso).toLocaleDateString() : '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Institución de Origen</p>
                                    <p className="font-bold text-gray-700 uppercase">{student.institucionOrigen || '-'}</p>
                                </div>
                                <div className="pt-2 border-t mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Observaciones Generales</p>
                                        {canEditStudent && student.observacionesGenerales !== observations && (
                                            <button
                                                onClick={handleUpdateObservations}
                                                disabled={savingObs}
                                                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-bold disabled:opacity-50 transition"
                                            >
                                                {savingObs ? 'Guardando...' : '💾 Guardar'}
                                            </button>
                                        )}
                                    </div>
                                    {canEditStudent ? (
                                        <textarea
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            className="w-full text-xs text-gray-600 border border-gray-200 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none h-24 resize-none bg-gray-50 focus:bg-white"
                                            placeholder="Puede escribir notas y observaciones permanentes del estudiante aquí..."
                                        />
                                    ) : (
                                        <div className="w-full text-xs text-gray-600 border border-gray-200 rounded p-2 h-24 overflow-y-auto bg-gray-50 whitespace-pre-wrap">
                                            {observations || <span className="italic text-gray-400">Sin observaciones destacadas.</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-xl font-black text-gray-800 uppercase flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center text-xs">H</span>
                        Historial de Inscripciones
                    </h2>

                    <div className="space-y-4">
                        {student.inscripciones.sort((a: any, b: any) => b.curso.cicloLectivo.anio - a.curso.cicloLectivo.anio).map((ins: any) => (
                            <div key={ins.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-black text-blue-600">{ins.curso.cicloLectivo.anio}</span>
                                        <div>
                                            <p className="text-sm font-black uppercase text-gray-800">
                                                {ins.curso.anioCurso} "{ins.curso.division}" - {ins.curso.orientacion?.nombre || 'CICLO BASICO'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Turno: {ins.curso.turno}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ins.estadoFinal === 'APROBADO' || ins.condicionCiclo === 'Pasa de curso' ? 'bg-green-100 text-green-700' :
                                        ins.condicionCiclo === 'Repite' ? 'bg-red-100 text-red-700' :
                                            ins.curso.cicloLectivo.enCurso ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {ins.estadoFinal || (ins.curso.cicloLectivo.enCurso ? 'CURSANDO' : ins.condicionCiclo.toUpperCase())}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-3">Resumen de Calificaciones (Nota Final)</h4>
                                            <div className="space-y-1">
                                                {ins.calificaciones.filter((c: any) => c.instancia === 'FINAL').map((grade: any) => (
                                                    <div key={grade.id} className="flex justify-between items-center text-sm p-1 border-b border-gray-50">
                                                        <span className="text-gray-600 font-medium uppercase truncate max-w-[200px]">{grade.materia.nombre}</span>
                                                        <span className={`font-black ${grade.nota < 6 ? 'text-red-500' : 'text-gray-800'}`}>{grade.nota.toFixed(1)}</span>
                                                    </div>
                                                ))}
                                                {ins.calificaciones.filter((c: any) => c.instancia === 'FINAL').length === 0 && (
                                                    <p className="text-xs text-gray-400 italic">No hay notas finales cargadas aún.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-3">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-blue-700 uppercase mb-2">Asistencias Acumuladas</h4>
                                                    <div className="flex gap-4">
                                                        <div>
                                                            <p className="text-2xl font-black text-gray-800">{ins.asistencias.filter((a: any) => a.presente).length}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Presentes</p>
                                                        </div>
                                                        <div className="border-l pl-4">
                                                            <p className="text-2xl font-black text-red-600">{ins.asistencias.filter((a: any) => !a.presente).length}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Ausentes</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-blue-100">
                                                    <h4 className="text-[10px] font-bold text-blue-700 uppercase mb-2">Resumen de Situación Académica</h4>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-700">Materias reprobadas: <span className={ins.reprobadasCount > 0 ? 'text-red-600' : 'text-gray-800'}>{ins.reprobadasCount}</span></p>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${ins.condicionCiclo === 'Repite' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            Condición: {ins.condicionCiclo}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <button
                                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/bulletin/${student.id}?token=${localStorage.getItem('token')}`, '_blank')}
                                                    className="text-blue-600 text-xs font-black hover:underline uppercase"
                                                >
                                                    Ver Boletín Histórico →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer de Auditoría */}
            <div className="mt-12 pt-6 border-t text-center text-[10px] text-gray-400 uppercase font-medium">
                <p>
                    Expediente iniciado el {new Date(student.createdAt).toLocaleDateString()}
                    {student.usuarioCarga && ` por ${student.usuarioCarga.nombreCompleto}`}
                </p>
            </div>
        </div>
    );
}

// Fixed sort types
// student.inscripciones.sort((a: any, b: any) => b.curso.cicloLectivo.anio - a.curso.cicloLectivo.anio)
