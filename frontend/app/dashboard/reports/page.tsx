'use client';

import { useState, useEffect } from 'react';

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

                {/* Placeholder for other reports */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 opacity-50 border-dashed flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600 text-xl font-bold">
                            PDF
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Planilla de Asistencia Anual</h2>
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
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600 text-xl font-bold">
                            CSV
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Exportación de Estudiantes</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Próximamente: Exportación completa de datos de alumnos para Excel.
                        </p>
                    </div>
                    <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed">
                        No disponible
                    </button>
                </div>
            </div>

            <div className="mt-12 bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-2">¿Cómo generar Boletines individuales?</h3>
                <p className="text-sm text-blue-600">
                    Para descargar el boletín de un alumno específico, dirígete al módulo de <strong>Estudiantes</strong>, haz clic en <strong>Ver</strong> sobre el alumno deseado y encontrarás el botón de descarga dentro de su ficha técnica.
                </p>
            </div>
        </div>
    );
}
