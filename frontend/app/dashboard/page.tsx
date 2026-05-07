'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        cicloLectivo: '--',
        estudiantesActivos: '--',
        inasistenciasHoy: '--'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        cicloLectivo: data.cicloLectivo,
                        estudiantesActivos: data.estudiantesActivos.toString(),
                        inasistenciasHoy: data.inasistenciasHoy.toString()
                    });
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
            }
        };
        fetchStats();
    }, []);

    const downloadRiskReport = () => {
        const token = localStorage.getItem('token');
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/reports/risk-report?token=${token}`, '_blank');
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
                    <p className="text-gray-500 mt-1">Bienvenido al Sistema de Gestión Escolar.</p>
                </div>
                <button
                    onClick={downloadRiskReport}
                    className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition flex items-center gap-2"
                >
                    ⚠️ Descargar Reporte de Riesgo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-sm font-bold uppercase">Ciclo Lectivo</p>
                    <p className="text-4xl font-black text-blue-600 mt-2">{stats.cicloLectivo}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-sm font-bold uppercase">Estudiantes Activos</p>
                    <p className="text-4xl font-black text-green-600 mt-2">{stats.estudiantesActivos}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-sm font-bold uppercase">Inasistencias Hoy</p>
                    <p className="text-4xl font-black text-red-600 mt-2">{stats.inasistenciasHoy}</p>
                </div>
            </div>
        </div>
    );
}
