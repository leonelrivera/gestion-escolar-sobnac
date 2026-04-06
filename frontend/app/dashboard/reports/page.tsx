'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);

    const downloadReport = async (endpoint: string, filename: string) => {
        setDownloading(endpoint);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert('Error al generar el reporte.');
            }
        } catch (err) {
            alert('Error de conexión.');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Central de Reportes</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Risk Report Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 text-red-600 text-xl font-bold">
                            PDF
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Reporte de Riesgo Pedagógico</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Genera un listado consolidado de todos los estudiantes desaprobados, categorizados por nivel de riesgo.
                        </p>
                    </div>
                    <button
                        onClick={() => downloadReport('risk-report', 'reporte_riesgo.pdf')}
                        disabled={downloading === 'risk-report'}
                        className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${downloading === 'risk-report'
                                ? 'bg-gray-100 text-gray-400 cursor-wait'
                                : 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200'
                            }`}
                    >
                        {downloading === 'risk-report' ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>

                {/* Notas Generales Report Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-700 text-xl font-bold">
                            XLS
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Notas Generales por Informe</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Planilla interactiva de control académico por curso y periodo, con descarga en Excel.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard/reports/general-grades'}
                        className="w-full py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold shadow-sm shadow-green-200 transition-all"
                    >
                        Abrir Reporte
                    </button>
                </div>

                {/* Family Report Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 text-indigo-700 text-xl font-bold">
                            PDF
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Informe para Familias</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Planilla resumida (PDF) por estudiante para distribuir a los tutores, con firmas directivas.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard/reports/family-report'}
                        className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold shadow-sm shadow-indigo-200 transition-all"
                    >
                        Abrir Reporte
                    </button>
                </div>

                {/* Placeholder for other reports */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-50 border-dashed flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Planilla de Asistencia Anual</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Próximamente: Resumen de asistencias por curso y ciclo lectivo.
                        </p>
                    </div>
                    <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed">
                        No disponible
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-50 border-dashed flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2">Exportación de Estudiantes</h3>
                        <p className="text-gray-400 text-sm mb-4 flex-grow">
                            Próximamente: Exportación completa de datos de alumnos para Excel.
                        </p>
                    </div>
                    <button disabled className="w-full py-2 bg-gray-100 text-gray-400 font-bold rounded cursor-not-allowed">
                        No disponible
                    </button>
                </div>
                
                {/* CALIFICADORES */}
                <Link href="/dashboard/reports/calificadores" className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg transition flex flex-col justify-between group">
                    <div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-black text-gray-800 mb-2">Calificadores</h3>
                        <p className="text-gray-500 text-sm mb-4 flex-grow">
                            Planillas anuales (Boletines Completos) para estudiantes y familias.
                        </p>
                    </div>
                    <button className="w-full py-2.5 bg-blue-50 text-blue-600 font-bold rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
                        Abrir Reporte
                    </button>
                </Link>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-2">¿Cómo generar Boletines individuales?</h3>
                <p className="text-sm text-blue-600">
                    Para descargar el boletín de un alumno específico, dirígete al módulo de <strong>Estudiantes</strong>, haz clic en <strong>Ver</strong> sobre el alumno deseado y encontrarás el botón de descarga dentro de su ficha técnica.
                </p>
            </div>
        </div>
    );
}
