'use client';

import { useState, useEffect } from 'react';

interface RiskStat {
    total: number;
    bajo: number;
    medio: number;
    alto: number;
    sinRiesgo: number;
    studentsRisk: Array<{
        id: number;
        nombre: string;
        curso: string;
        desaprobadas: number;
        riesgo: string;
    }>;
}

export default function StatsPage() {
    const [stats, setStats] = useState<RiskStat | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reports/stats/risk`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then((r) => r.json())
            .then((data) => setStats(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando estadísticas...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Estadísticas y Riesgos</h1>

            {/* Cards Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Alumnos</p>
                    <p className="text-3xl font-black text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100">
                    <p className="text-xs font-bold text-red-400 uppercase mb-1">Riesgo Alto</p>
                    <p className="text-3xl font-black text-red-600">{stats.alto}</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl shadow-sm border border-orange-100">
                    <p className="text-xs font-bold text-orange-400 uppercase mb-1">Riesgo Medio</p>
                    <p className="text-3xl font-black text-orange-600">{stats.medio}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-100">
                    <p className="text-xs font-bold text-green-400 uppercase mb-1">Sin Riesgo</p>
                    <p className="text-3xl font-black text-green-600">{stats.sinRiesgo}</p>
                </div>
            </div>

            {/* Detail Table */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-bold text-gray-700">Alumnos en Situación de Riesgo</h2>
                    <span className="text-xs text-gray-400 font-medium">Ordenado por severidad</span>
                </div>
                <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100 sticky top-0">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-600">Estudiante</th>
                                <th className="px-6 py-4 font-bold text-gray-600">Curso</th>
                                <th className="px-6 py-4 font-bold text-gray-600 text-center">Materias</th>
                                <th className="px-6 py-4 font-bold text-gray-600">Nivel de Riesgo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.studentsRisk
                                .sort((a, b) => b.desaprobadas - a.desaprobadas)
                                .map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{s.nombre}</td>
                                        <td className="px-6 py-4 text-gray-600">{s.curso}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-black text-gray-700">{s.desaprobadas}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.riesgo === 'Alto' ? 'bg-red-100 text-red-800' :
                                                    s.riesgo === 'Medio' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {s.riesgo}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
