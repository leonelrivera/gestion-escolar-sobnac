'use client';

import { useState, useEffect } from 'react';

// Tipos
interface Cycle { id: number; anio: number; enCurso: boolean; }
interface ClosureParam {
    id: number;
    instancia: string;
    cuatrimestre: number;
    cerrado: boolean;
}

const INSTANCES = [
    { key: 'INFORME_1', label: 'INFORME 1' },
    { key: 'INFORME_2', label: 'INFORME 2' },
    { key: 'PFA', label: 'PFA' },
    { key: 'CIERRE', label: 'CIERRE' },
    { key: 'COMPLEMENTARIO_DIC', label: 'DICIEMBRE' },
    { key: 'COMPLEMENTARIO_FEB', label: 'FEBRERO' },
    { key: 'FINAL', label: 'FINAL' },
];

export default function CyclesClosurePage() {
    const [cycles, setCycles] = useState<Cycle[]>([]);
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');
    const [params, setParams] = useState<ClosureParam[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('http://localhost:3001/cycles', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(r => r.json())
            .then(data => {
                setCycles(data);
                const current = data.find((c: Cycle) => c.enCurso);
                if (current) setSelectedCycleId(String(current.id));
            });
    }, []);

    useEffect(() => {
        if (selectedCycleId) fetchParams();
    }, [selectedCycleId]);

    const fetchParams = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/cycles/${selectedCycleId}/parameters`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setParams(await res.json());
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleClosure = async (instancia: string, cuatrimestre: number, currentStatus: boolean) => {
        try {
            const res = await fetch('http://localhost:3001/cycles/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    cicloLectivoId: +selectedCycleId,
                    instancia,
                    cuatrimestre,
                    cerrado: !currentStatus // Toggle
                })
            });

            if (res.ok) {
                fetchParams(); // Refresh
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStatus = (instancia: string, cuatrimestre: number) => {
        const p = params.find(p => p.instancia === instancia && p.cuatrimestre === cuatrimestre);
        return p?.cerrado || false;
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Administración de Períodos Evaluativos</h1>

            <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ciclo Lectivo</label>
                <select
                    value={selectedCycleId}
                    onChange={e => setSelectedCycleId(e.target.value)}
                    className="w-full md:w-1/3 border rounded-lg p-2.5 bg-gray-50 font-bold"
                >
                    {cycles.map(c => <option key={c.id} value={c.id}>{c.anio}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cuatrimestre</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Instancia de Evaluación</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Estado de Carga</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[1, 2].map(cuatri => (
                            INSTANCES.map(inst => {
                                // Instancias complementarias solo van en el 2do cuatrimestre (o anual, simplificado aqui)
                                if (cuatri === 1 && ['COMPLEMENTARIO_DIC', 'COMPLEMENTARIO_FEB', 'FINAL'].includes(inst.key)) return null;

                                const isClosed = getStatus(inst.key, cuatri);

                                return (
                                    <tr key={`${cuatri}-${inst.key}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-600">{cuatri}º Cuatrimestre</td>
                                        <td className="px-6 py-4 font-bold text-gray-800">{inst.label}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleClosure(inst.key, cuatri, isClosed)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center justify-center ml-auto w-32 transition-colors ${isClosed
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                {isClosed ? '🔒 CERRADO' : '🔓 ABIERTO'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
