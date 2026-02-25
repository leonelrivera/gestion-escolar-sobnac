'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditStudentPage() {
    const router = useRouter();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        dni: '',
        apellido: '',
        nombre: '',
        fechaNacimiento: '',
        lugarNacimiento: '',
        genero: '',
        domicilio: '',
        telefonoContacto: '',
        emailContacto: '',
        fechaIngreso: '',
        institucionOrigen: '',
        fechaEgreso: '',
        institucionDestino: '',
        condicion: 'REGULAR',
        grupoSanguineo: '',
        alergias: '',
        enfermedadesCronicas: '',
        obraSocial: '',
        nombreTutor: '',
        telefonoTutor: '',
        emailTutor: '',
        contactoEmergenciaNombre: '',
        contactoEmergenciaTelefono: '',
        orientacion: '',
        observacionesGenerales: '',
    });
    const [librosFolios, setLibrosFolios] = useState<{ libro: string; folio: string }[]>([{ libro: '', folio: '' }]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [vieneDeOtraInstitucion, setVieneDeOtraInstitucion] = useState(false);
    const [esPaseSaliente, setEsPaseSaliente] = useState(false);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Error al cargar datos');
                const data = await res.json();

                // Formatear fechas para inputs date (YYYY-MM-DD)
                const formatDate = (dateString: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

                setFormData({
                    ...data,
                    fechaNacimiento: formatDate(data.fechaNacimiento),
                    fechaIngreso: formatDate(data.fechaIngreso),
                    fechaEgreso: formatDate(data.fechaEgreso),
                    institucionOrigen: data.institucionOrigen || '',
                    institucionDestino: data.institucionDestino || '',
                    // ... otros campos si es necesario mapear null a ''
                });

                if (data.fechaIngreso || data.institucionOrigen) {
                    setVieneDeOtraInstitucion(true);
                }
                if (data.fechaEgreso || data.institucionDestino) {
                    setEsPaseSaliente(true);
                }

                if (data.librosFolios && data.librosFolios.length > 0) {
                    setLibrosFolios(data.librosFolios);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLibroChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newLibros = [...librosFolios];
        newLibros[index] = { ...newLibros[index], [e.target.name]: e.target.value };
        setLibrosFolios(newLibros);
    };

    const addLibro = () => setLibrosFolios([...librosFolios, { libro: '', folio: '' }]);
    const removeLibro = (index: number) => setLibrosFolios(librosFolios.filter((_, i: number) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const allowedFields = [
            'dni', 'apellido', 'nombre', 'fechaNacimiento', 'lugarNacimiento', 'genero',
            'domicilio', 'telefonoContacto', 'emailContacto', 'fechaIngreso', 'institucionOrigen',
            'fechaEgreso', 'institucionDestino', 'condicion', 'grupoSanguineo', 'alergias',
            'enfermedadesCronicas', 'obraSocial', 'nombreTutor', 'telefonoTutor', 'emailTutor',
            'contactoEmergenciaNombre', 'contactoEmergenciaTelefono', 'orientacion', 'observacionesGenerales'
        ];

        const dataToSend: any = {};
        allowedFields.forEach(field => {
            if ((formData as any)[field] !== undefined && (formData as any)[field] !== null) {
                dataToSend[field] = (formData as any)[field];
            }
        });

        // Limpiar datos condicionales si se desmarcan
        if (!vieneDeOtraInstitucion) {
            delete dataToSend.fechaIngreso;
            delete dataToSend.institucionOrigen;
        } else {
            // Asegurar tipos para fechas si son strings vacíos
            if (dataToSend.fechaIngreso === '') delete dataToSend.fechaIngreso;
        }

        if (!esPaseSaliente) {
            delete dataToSend.fechaEgreso;
            delete dataToSend.institucionDestino;
        } else {
            if (dataToSend.fechaEgreso === '') delete dataToSend.fechaEgreso;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...dataToSend,
                    // No enviamos librosFolios en update por ahora para evitar problemas de relación
                    // librosFolios: librosFolios.filter(lf => lf.libro && lf.folio) 
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar estudiante');

            router.push(`/dashboard/students/${id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 uppercase">Editar Estudiante</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reutilizar estructura de formulario de CreateStudentPage pero populada */}
                {/* Sección Datos Personales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">1. Identificación y Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">DNI</label>
                            <input name="dni" value={formData.dni} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Apellido</label>
                            <input name="apellido" value={formData.apellido} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Nombre</label>
                            <input name="nombre" value={formData.nombre} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">F. Nacimiento</label>
                            <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} required onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 outline-none" />
                        </div>
                        {/* ... Resto de campos personales similares a create ... */}
                    </div>
                </div>

                {/* Sección Institucional (Ingreso y Egreso) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">Información Institucional</h3>

                    {/* INGRESO */}
                    <div className="mb-4 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <input
                            type="checkbox"
                            id="vieneDeOtraInstitucion"
                            checked={vieneDeOtraInstitucion}
                            onChange={(e) => setVieneDeOtraInstitucion(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="vieneDeOtraInstitucion" className="text-sm font-bold text-blue-800 cursor-pointer select-none">
                            ¿Vino de otra institución? (Ingreso)
                        </label>
                    </div>

                    {vieneDeOtraInstitucion && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase">F. Ingreso</label>
                                <input type="date" name="fechaIngreso" value={formData.fechaIngreso} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase">Institución Origen</label>
                                <input name="institucionOrigen" value={formData.institucionOrigen} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 outline-none" />
                            </div>
                        </div>
                    )}

                    {/* EGRESO / PASE */}
                    <div className="mb-4 flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100 mt-6">
                        <input
                            type="checkbox"
                            id="esPaseSaliente"
                            checked={esPaseSaliente}
                            onChange={(e) => setEsPaseSaliente(e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded cursor-pointer"
                        />
                        <label htmlFor="esPaseSaliente" className="text-sm font-bold text-red-800 cursor-pointer select-none">
                            ¿Se retira a otra institución? (Pase Saliente / Baja)
                        </label>
                    </div>

                    {esPaseSaliente && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 border rounded-lg">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase">F. Egreso/Pase</label>
                                <input type="date" name="fechaEgreso" value={formData.fechaEgreso} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase">Institución Destino</label>
                                <input name="institucionDestino" value={formData.institucionDestino} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 outline-none" />
                            </div>
                        </div>
                    )}
                </div>

                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 border rounded-lg text-gray-600 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
