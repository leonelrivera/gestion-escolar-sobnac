'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StudentMovement {
    id: number;
    dni: string;
    apellido: string;
    nombre: string;
    condicion: string;
    fechaIngreso: string | null;
    paseFecha: string | null;
    fechaEgreso: string | null;
    paseEstado: string | null;
    institucionOrigen: string | null;
    paseDestino: string | null;
    paseColegio: string | null;
    inscripciones: {
        curso: {
            anioCurso: string;
            division: string;
            turno: string;
        }
    }[];
}

export default function MovementsPage() {
    const [movements, setMovements] = useState<StudentMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        dni: '',
        fechaIngreso: '',
        fechaEgreso: '',
        curso: '',
        division: '',
        cicloLectivo: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/cycles`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setCycles(data);
                let initialCiclo = '';
                const active = data.find((c: any) => c.enCurso);
                if (active) {
                    initialCiclo = String(active.anio);
                } else if (data.length > 0) {
                    initialCiclo = String(data[0].anio);
                }
                setFilters(prev => ({ ...prev, cicloLectivo: initialCiclo }));
                setTimeout(() => fetchMovements(initialCiclo), 100);
            })
            .catch(() => fetchMovements());
    }, []);

    const fetchMovements = async (forceCiclo?: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = new URLSearchParams();
            if (filters.dni) query.append('dni', filters.dni);
            if (filters.fechaIngreso) query.append('fechaIngreso', filters.fechaIngreso);
            if (filters.fechaEgreso) query.append('fechaEgreso', filters.fechaEgreso);
            if (filters.curso) query.append('curso', filters.curso);
            if (filters.division) query.append('division', filters.division);
            const currentCiclo = forceCiclo !== undefined ? forceCiclo : filters.cicloLectivo;
            if (currentCiclo) query.append('cicloLectivo', currentCiclo);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/report/movements?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMovements(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const formatAnio = (anio: string) => {
        const num = parseInt(anio);
        if (isNaN(num)) return anio;
        const suffixes: Record<number, string> = {
            1: '1RO', 2: '2DO', 3: '3RO', 4: '4TO', 5: '5TO', 6: '6TO', 7: '7MO'
        };
        return suffixes[num] || `${num}°`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800">Altas y Bajas (Movimientos)</h1>
                    <p className="text-gray-500 font-medium mt-1">Registro histórico de ingresos y egresos de estudiantes.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 items-end border border-gray-100">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ciclo Lectivo</label>
                    <select name="cicloLectivo" value={filters.cicloLectivo} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-blue-50 text-blue-900 focus:border-blue-500 outline-none w-36 font-black">
                        <option value="">Todos</option>
                        {cycles.map(c => (
                            <option key={c.id} value={c.anio}>{c.anio} {c.enCurso ? '(ACTUAL)' : ''}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">DNI</label>
                    <input name="dni" value={filters.dni} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-gray-50 focus:border-blue-500 outline-none w-32 font-bold" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Curso</label>
                    <select name="curso" value={filters.curso} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-gray-50 focus:border-blue-500 outline-none w-32 font-bold text-gray-800">
                        <option value="">Todos</option>
                        {[1, 2, 3, 4, 5, 6, 7].map(n => (
                            <option key={n} value={String(n)}>{formatAnio(String(n))}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">División</label>
                    <select name="division" value={filters.division} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-gray-50 focus:border-blue-500 outline-none w-32 font-bold text-gray-800">
                        <option value="">Todas</option>
                        {['1ra', '2da', '3ra', '4ta', '5ta', '6ta', '7ma'].map(div => (
                            <option key={div} value={div}>{div.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha Ingreso Exacta</label>
                    <input type="date" name="fechaIngreso" value={filters.fechaIngreso} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-gray-50 focus:border-blue-500 outline-none font-bold text-gray-800" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Fecha Egreso/Pase Exacta</label>
                    <input type="date" name="fechaEgreso" value={filters.fechaEgreso} onChange={handleFilterChange} className="block border-2 border-gray-200 rounded-lg p-2 bg-gray-50 focus:border-blue-500 outline-none font-bold text-gray-800" />
                </div>
                <button onClick={() => fetchMovements()} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-black hover:bg-blue-700 transition shadow-md hover:shadow-lg">Filtrar</button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Fecha Mov.</th>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Alumno / DNI</th>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Curso Asignado</th>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">Origen / Destino</th>
                            <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {movements.map((m) => {
                            const isIngreso = m.condicion === 'INGRESO' || m.fechaIngreso;
                            const isPase = m.condicion === 'PASE' || m.paseFecha || m.fechaEgreso;
                            const currentCourse = m.inscripciones?.[0]?.curso;

                            return (
                                <tr key={m.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isIngreso && m.fechaIngreso && <div className="text-sm font-bold text-green-700">IN: {m.fechaIngreso.split('T')[0]}</div>}
                                        {isPase && (m.paseFecha || m.fechaEgreso) && <div className="text-sm font-bold text-orange-700">OUT: {(m.paseFecha || m.fechaEgreso)?.split('T')[0]}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isIngreso && <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-1 rounded mr-2">INGRESO</span>}
                                        {isPase && <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-1 rounded mt-1 inline-block">PASE {m.paseEstado ? `(${m.paseEstado})` : ''}</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{m.apellido}, {m.nombre}</div>
                                        <div className="text-xs text-gray-500 font-medium">DNI: {m.dni}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-600">
                                        {currentCourse ? `${currentCourse.anioCurso} ${currentCourse.division} ${currentCourse.turno}` : 'Sin Asignar'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                        {isIngreso && m.institucionOrigen && <div className="mb-1"><span className="text-xs text-gray-400">De:</span> {m.institucionOrigen}</div>}
                                        {isPase && m.paseColegio && <div><span className="text-xs text-gray-400">A:</span> {m.paseColegio} ({m.paseDestino})</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/dashboard/students/${m.id}`} className="text-blue-600 hover:underline text-sm font-bold">Ver Perfil</Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && movements.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">
                        No se encontraron movimientos con los filtros seleccionados.
                    </div>
                )}
                {loading && (
                    <div className="p-8 text-center text-blue-500 font-bold animate-pulse">
                        Cargando movimientos...
                    </div>
                )}
            </div>
        </div>
    );
}
