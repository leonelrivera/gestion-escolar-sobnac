'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditStudentPage() {
    const { id } = useParams();
    const router = useRouter();
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
        institucionDestino: '',
        condicion: 'REGULAR',
        grupoSanguineo: '',
        alergias: '',
        enfermedadesCronicas: '',
        obraSocial: '',
        nombreTutor: '',
        telefonoTutor: '',
        emailTutor: '',
        nombreTutorAlternativo: '',
        telefonoTutorAlternativo: '',
        emailTutorAlternativo: '',
        contactoEmergenciaNombre: '',
        contactoEmergenciaTelefono: '',
        orientacion: '',
        observacionesGenerales: '',
    });
    const [librosFolios, setLibrosFolios] = useState<{ libro: string; folio: string }[]>([{ libro: '', folio: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [vieneDeOtraInstitucion, setVieneDeOtraInstitucion] = useState(false);
    const [orientations, setOrientations] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/orientations`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setOrientations)
            .catch(console.error);

        if (id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.json())
                .then(data => {
                    setFormData({
                        dni: data.dni || '',
                        apellido: data.apellido || '',
                        nombre: data.nombre || '',
                        fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
                        lugarNacimiento: data.lugarNacimiento || '',
                        genero: data.genero || '',
                        domicilio: data.domicilio || '',
                        telefonoContacto: data.telefonoContacto || '',
                        emailContacto: data.emailContacto || '',
                        fechaIngreso: data.fechaIngreso ? data.fechaIngreso.split('T')[0] : '',
                        institucionOrigen: data.institucionOrigen || '',
                        institucionDestino: data.institucionDestino || '',
                        condicion: data.condicion || 'REGULAR',
                        grupoSanguineo: data.grupoSanguineo || '',
                        alergias: data.alergias || '',
                        enfermedadesCronicas: data.enfermedadesCronicas || '',
                        obraSocial: data.obraSocial || '',
                        nombreTutor: data.nombreTutor || '',
                        telefonoTutor: data.telefonoTutor || '',
                        emailTutor: data.emailTutor || '',
                        nombreTutorAlternativo: data.nombreTutorAlternativo || '',
                        telefonoTutorAlternativo: data.telefonoTutorAlternativo || '',
                        emailTutorAlternativo: data.emailTutorAlternativo || '',
                        contactoEmergenciaNombre: data.contactoEmergenciaNombre || '',
                        contactoEmergenciaTelefono: data.contactoEmergenciaTelefono || '',
                        orientacion: data.orientacion || '',
                        observacionesGenerales: data.observacionesGenerales || '',
                    });
                    if (data.librosFolios && data.librosFolios.length > 0) {
                        setLibrosFolios(data.librosFolios);
                    }
                    if (data.fechaIngreso || data.institucionOrigen) {
                        setVieneDeOtraInstitucion(true);
                    }
                })
                .catch(err => setError(err.message))
                .finally(() => setLoadingData(false));
        }
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
        setLoading(true);
        setError('');

        const dataToSend = { ...formData };
        if (!vieneDeOtraInstitucion) {
            delete (dataToSend as any).fechaIngreso;
            delete (dataToSend as any).institucionOrigen;
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
                    librosFolios: librosFolios.filter(lf => lf.libro && lf.folio)
                }),
            });

            if (!res.ok) throw new Error('Error al actualizar estudiante');

            router.push(`/dashboard/students/${id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) return <div className="p-8 text-center text-gray-400">Cargando datos del estudiante...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 uppercase">Editar Estudiante - Libro Matriz</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección Datos Personales */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">1. Identificación y Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">DNI</label>
                            <input name="dni" value={formData.dni} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Apellido</label>
                            <input name="apellido" value={formData.apellido} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Nombre</label>
                            <input name="nombre" value={formData.nombre} required onChange={handleChange} className="mt-1 block w-full border font-bold rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">F. Nacimiento</label>
                            <input type="date" value={formData.fechaNacimiento} name="fechaNacimiento" required onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Género</label>
                            <select name="genero" value={formData.genero} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none">
                                <option value="">Seleccionar...</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Lugar de Nacimiento</label>
                            <input name="lugarNacimiento" value={formData.lugarNacimiento} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                    </div>
                </div>

                {/* Sección Salud */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-red-600 border-b pb-2">2. Salud y Emergencias</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Grupo Sanguíneo</label>
                            <input name="grupoSanguineo" value={formData.grupoSanguineo} placeholder="Ej: A+" onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Obra Social / Cobertura</label>
                            <input name="obraSocial" value={formData.obraSocial} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Alergias</label>
                            <input name="alergias" value={formData.alergias} placeholder="Describir alergias si aplica" onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Enfermedades Crónicas</label>
                            <input name="enfermedadesCronicas" value={formData.enfermedadesCronicas} placeholder="Describir si aplica" onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-red-800 uppercase">Contacto de Emergencia (Nombre)</label>
                            <input name="contactoEmergenciaNombre" value={formData.contactoEmergenciaNombre} required onChange={handleChange} className="mt-1 block w-full border-red-200 rounded-lg p-2 focus:ring-red-500 outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] font-black text-red-800 uppercase">Teléfono de Emergencia</label>
                            <input name="contactoEmergenciaTelefono" value={formData.contactoEmergenciaTelefono} required onChange={handleChange} className="mt-1 block w-full border-red-200 rounded-lg p-2 focus:ring-red-500 outline-none" />
                        </div>
                    </div>
                </div>

                {/* Sección Familia */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">3. Grupo Familiar y Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Nombre del Tutor Responsable</label>
                            <input name="nombreTutor" value={formData.nombreTutor} required onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Teléfono del Tutor</label>
                            <input name="telefonoTutor" value={formData.telefonoTutor} required onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Email del Tutor</label>
                            <input type="email" name="emailTutor" value={formData.emailTutor} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>

                        {/* Segundo Tutor (Alternativo) */}
                        <div className="md:col-span-2 mt-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Nombre del Tutor Alternativo (Opcional)</label>
                            <input name="nombreTutorAlternativo" value={formData.nombreTutorAlternativo} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Teléfono Tutor Alt.</label>
                            <input name="telefonoTutorAlternativo" value={formData.telefonoTutorAlternativo} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Email Tutor Alt.</label>
                            <input type="email" name="emailTutorAlternativo" value={formData.emailTutorAlternativo} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>

                        <div className="md:col-span-2 mt-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Domicilio del Estudiante</label>
                            <input name="domicilio" value={formData.domicilio} required onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none" />
                        </div>
                    </div>
                </div>

                {/* Sección Institucional */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">4. Información Institucional (Libro Matriz)</h3>

                    <div className="mb-4 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <input
                            type="checkbox"
                            id="vieneDeOtraInstitucion"
                            checked={vieneDeOtraInstitucion}
                            onChange={(e) => setVieneDeOtraInstitucion(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="vieneDeOtraInstitucion" className="text-sm font-bold text-blue-800 cursor-pointer select-none">
                            ¿El estudiante vino de otra institución? (Ingreso / Pase Entrante)
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {vieneDeOtraInstitucion && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase">F. Ingreso</label>
                                    <input type="date" value={formData.fechaIngreso} name="fechaIngreso" onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none border-blue-200" required={vieneDeOtraInstitucion} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase">Institución Origen</label>
                                    <input name="institucionOrigen" value={formData.institucionOrigen} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none border-blue-200" required={vieneDeOtraInstitucion} />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Condición</label>
                            <select name="condicion" value={formData.condicion} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none">
                                <option value="REGULAR">Regular</option>
                                <option value="INGRESO">Ingreso</option>
                                <option value="REPITENTE">Repitente</option>
                                <option value="PASE">Pase</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Orientación</label>
                            <select name="orientacion" value={formData.orientacion} onChange={handleChange} className="mt-1 block w-full border rounded-lg p-2 bg-gray-50 focus:bg-white outline-none">
                                <option value="">Seleccionar...</option>
                                {orientations.map((o: any) => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase">Registros de Libros y Folios</label>
                            <button type="button" onClick={addLibro} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100">+ Agregar Libro</button>
                        </div>
                        {librosFolios.map((lf, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-center">
                                <input placeholder="Número de Libro" name="libro" value={lf.libro} onChange={(e) => handleLibroChange(index, e)} className="flex-1 border rounded p-1.5 text-sm" />
                                <input placeholder="Número de Folio" name="folio" value={lf.folio} onChange={(e) => handleLibroChange(index, e)} className="flex-1 border rounded p-1.5 text-sm" />
                                <button type="button" onClick={() => removeLibro(index)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-2 text-gray-700 uppercase text-sm">5. Observaciones Finales</h3>
                    <textarea
                        name="observacionesGenerales"
                        value={formData.observacionesGenerales}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white outline-none h-24"
                        placeholder="Cualquier información adicional relevante..."
                    ></textarea>
                </div>

                {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">{error}</div>}

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md transition disabled:bg-gray-400">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
