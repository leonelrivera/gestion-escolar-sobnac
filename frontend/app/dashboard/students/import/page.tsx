'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { usePermissions } from '@/hooks/usePermissions';

export default function BulkImportStudentsPage() {
    const router = useRouter();
    const { canBulkImportStudents, role } = usePermissions();

    const [fileData, setFileData] = useState<any[]>([]);
    const [existingDnis, setExistingDnis] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (role && !canBulkImportStudents) {
            router.push('/dashboard/students');
        }
    }, [role, canBulkImportStudents, router]);

    useEffect(() => {
        // Precargar DNI existentes para la validación cruzada
        fetchExistingDnis();
    }, []);

    const fetchExistingDnis = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students?limit=50000`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.items)) {
                    setExistingDnis(data.items.map((s: any) => s.dni));
                } else if (Array.isArray(data)) {
                    setExistingDnis(data.map((s: any) => s.dni));
                }
            }
        } catch (err) {
            console.error('Error fetching DNIs:', err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError('');

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // Convertir la hoja a formato JSON con opciones header: 1 para procesar manual
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                // La primer fila es la de Headers
                if (data.length <= 1) {
                    throw new Error("El archivo parece estar vacío o no contiene filas contiguas de datos.");
                }

                const headers: any = data[0];
                const rows = data.slice(1);

                // Normalizar headers (ignorar mayúsculas, signos, espacios al principio)
                const normalizeHeader = (h: string) => String(h).toUpperCase().replace(/[^A-Z]/g, '');

                const mapHeaderToIndex = (namePattern: string) => {
                    return headers.findIndex((h: string) => normalizeHeader(h).includes(namePattern));
                };

                const idxDni = mapHeaderToIndex('DNI');
                const idxApellido = mapHeaderToIndex('APELLIDO');
                const idxNombre = mapHeaderToIndex('NOMBRE');
                const idxFechaNac = mapHeaderToIndex('FECHANA');
                const idxGenero = mapHeaderToIndex('GENERO');
                const idxLugarNac = mapHeaderToIndex('LUGARNAC') > -1 ? mapHeaderToIndex('LUGARNAC') : mapHeaderToIndex('NACIMIENTO');
                const idxDomicilio = mapHeaderToIndex('DOMICILIO');
                const idxNomTutor = mapHeaderToIndex('TUTOR') > -1 ? mapHeaderToIndex('TUTOR') : mapHeaderToIndex('NOMBRETUTOR');
                const idxTelTutor = mapHeaderToIndex('TELTUT') > -1 ? mapHeaderToIndex('TELTUT') : mapHeaderToIndex('TELEFONOTUTOR');

                if (idxDni === -1 || idxApellido === -1 || idxNombre === -1 || idxLugarNac === -1) {
                    throw new Error("No se encontraron columnas requeridas (DNI, Apellido, Nombre, Lugar de Nacimiento). Verifique el formato de la planilla.");
                }

                // Parse Excel date (serial number) to YYYY-MM-DD
                const parseExcelDate = (excelDate: any) => {
                    if (!excelDate) return '';
                    if (typeof excelDate === 'number') {
                        const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                        return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
                    }
                    if (typeof excelDate === 'string') {
                        // try to parse string DD/MM/YYYY or similar
                        if (excelDate.includes('/')) {
                            const parts = excelDate.split('/');
                            if (parts.length === 3) {
                                // Assuming DD/MM/YYYY
                                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        }
                    }
                    return String(excelDate);
                };

                const formattedData = rows.filter((r: any) => r[idxDni]).map((r: any) => {
                    const mappedDni = String(r[idxDni]).trim();
                    const reqMissing = !mappedDni || !r[idxApellido] || !r[idxNombre] || !r[idxFechaNac] || !r[idxLugarNac] || !r[idxDomicilio] || !r[idxNomTutor] || !r[idxTelTutor];
                    const exists = existingDnis.includes(mappedDni);

                    let status = 'Ok';
                    if (reqMissing) status = 'ErrorFaltanDatos';
                    else if (exists) status = 'IgnoradoDuplicado';

                    return {
                        dni: mappedDni,
                        apellido: String(r[idxApellido] || '').trim(),
                        nombre: String(r[idxNombre] || '').trim(),
                        fechaNacimiento: parseExcelDate(r[idxFechaNac]),
                        genero: String(r[idxGenero] || '').substring(0, 1).toUpperCase() === 'F' ? 'Femenino' : String(r[idxGenero] || '').substring(0, 1).toUpperCase() === 'M' ? 'Masculino' : 'Otro',
                        lugarNacimiento: String(r[idxLugarNac] || '').trim(),
                        domicilio: String(r[idxDomicilio] || '').trim(),
                        nombreTutor: r[idxNomTutor] ? String(r[idxNomTutor]).trim() : undefined,
                        telefonoTutor: r[idxTelTutor] ? String(r[idxTelTutor]).trim() : undefined,
                        _status: status, // Metadata interna para la UI
                        condicion: 'REGULAR',
                    };
                });

                setFileData(formattedData);
            } catch (err: any) {
                setError(err.message || "Error al leer el archivo. Asegúrese de que sea formato XLSX.");
            } finally {
                setLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleConfirmUpload = async () => {
        const validRows = fileData.filter(d => d._status === 'Ok');
        
        if (validRows.length === 0) {
            setError("No hay filas válidas para subir a la base de datos.");
            return;
        }

        setUploading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const dataToSend = validRows.map(r => {
                const copy = { ...r };
                delete copy._status;
                return copy;
            });

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/students/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(dataToSend),
            });

            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.message || 'Error al guardar los estudiantes');
            }

            alert("Estudiantes cargados exitosamente.");
            router.push('/dashboard/students');
        } catch (err: any) {
            setError(err.message);
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        // Crear un libro nuevo con los headers esperados
        const wsData = [
            ["DNI", "Apellido", "Nombre", "Fecha_Nacimiento", "Genero", "Lugar_Nacimiento", "Domicilio", "Nombre_Tutor", "Telefono_Tutor"],
            ["12345678", "Perez", "Juan", "15/04/2010", "Masculino", "La Rioja", "Calle Falsa 123", "Maria Perez", "3804123456"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hoja1");

        // Usar el método integrado que suele ser el más compatible
        XLSX.writeFile(wb, "planilla_alumnos.xlsx");
    };

    const hasErrors = fileData.some(d => d._status === 'ErrorFaltanDatos');

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 uppercase">Carga Masiva de Estudiantes</h2>
                <button onClick={() => router.push('/dashboard/students')} className="bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded hover:bg-gray-300 transition">
                    ← Volver
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-blue-600 mb-2">Instrucciones</h3>
                    <ol className="list-decimal ml-5 text-sm font-semibold text-gray-600 space-y-1">
                        <li>Haga clic en el botón <strong>Descargar Plantilla</strong> para obtener el formato necesario.</li>
                        <li>Complete sus datos respetando las cabeceras (Los datos de ejemplo pueden ser borrados o sobreescritos).</li>
                        <li>Los campos: <b className="text-blue-600">DNI, Apellido, Nombre, Fecha_Nacimiento, Genero, Lugar_Nacimiento, Domicilio, Nombre_Tutor, y Telefono_Tutor</b> son estrictamente requeridos.</li>
                        <li>Suba el archivo rellenado a continuación.</li>
                    </ol>
                </div>
                <button onClick={handleDownloadTemplate} className="bg-blue-50 text-blue-700 font-bold border border-blue-200 px-6 py-3 rounded-lg shadow-sm hover:bg-blue-100 transition">
                    📥 Descargar Plantilla Modelo (.xlsx)
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Seleccionar archivo rellenado:
                </label>
                <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100 cursor-pointer border rounded-xl" 
                    disabled={loading || uploading}
                />
            </div>

            {error && <div className="bg-red-50 text-red-700 font-black p-4 rounded-lg mb-6 border border-red-200">{error}</div>}

            {fileData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 uppercase">Vista Previa de Datos</h3>
                        <div className="text-sm font-bold">
                            <span className="text-green-600 bg-green-50 px-3 py-1 rounded mr-3">Listos para Subir: {fileData.filter(d => d._status === 'Ok').length}</span>
                            <span className="text-yellow-600 bg-yellow-50 px-3 py-1 rounded mr-3">Ignorados (Ya Existen): {fileData.filter(d => d._status === 'IgnoradoDuplicado').length}</span>
                            <span className="text-red-600 bg-red-50 px-3 py-1 rounded">Con Errores: {fileData.filter(d => d._status === 'ErrorFaltanDatos').length}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
                        <table className="min-w-full text-sm text-left shadow-sm rounded-lg overflow-hidden border">
                            <thead className="bg-gray-100 text-gray-600 uppercase font-black text-[10px] sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 border-r">Estado</th>
                                    <th className="px-4 py-3">DNI</th>
                                    <th className="px-4 py-3">Apellido</th>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Nacimiento</th>
                                    <th className="px-4 py-3">Tutor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fileData.map((row, index) => {
                                    let bgClass = "bg-white hover:bg-gray-50";
                                    let statusText = "Válido";
                                    let statusBadgeClass = "bg-green-100 text-green-800 border-green-200 mt-0.5";

                                    if (row._status === 'ErrorFaltanDatos') {
                                        bgClass = "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500 border-b";
                                        statusText = "Faltan Requeridos";
                                        statusBadgeClass = "bg-red-200 text-red-800 border-red-300 mt-0.5";
                                    } else if (row._status === 'IgnoradoDuplicado') {
                                        bgClass = "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500 border-b";
                                        statusText = "DNI Duplicado";
                                        statusBadgeClass = "bg-yellow-200 text-yellow-800 border-yellow-300 mt-0.5";
                                    }

                                    return (
                                        <tr key={index} className={`border-b border-gray-200 ${bgClass}`}>
                                            <td className="px-4 py-2 font-bold whitespace-nowrap border-r">
                                                <span className={`px-2 py-[2px] rounded text-[10px] uppercase font-bold border ${statusBadgeClass}`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 font-bold">{row.dni}</td>
                                            <td className="px-4 py-2">{row.apellido}</td>
                                            <td className="px-4 py-2">{row.nombre}</td>
                                            <td className="px-4 py-2">{row.fechaNacimiento}</td>
                                            <td className="px-4 py-2 text-gray-600 font-semibold">{row.nombreTutor || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex flex-col items-end">
                        <button 
                            onClick={handleConfirmUpload} 
                            disabled={uploading || fileData.filter(d => d._status === 'Ok').length === 0 || hasErrors}
                            className={`px-8 py-3 rounded-lg font-black shadow-lg transition-all text-white
                                ${uploading || fileData.filter(d => d._status === 'Ok').length === 0 || hasErrors 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 shadow-green-900/20'}`}
                        >
                            {uploading ? 'Procesando Subida ⏳ ...' : 'Confirmar e Importar Estudiantes ✔'}
                        </button>
                        
                        {hasErrors ? (
                            <p className="text-red-600 text-right mt-3 text-sm font-bold bg-red-50 p-2 rounded">
                                ⚠️ Debe corregir las filas en ROJO en su archivo Excel y volver a subirlo para continuar.
                            </p>
                        ) : fileData.filter(d => d._status === 'Ok').length > 0 ? (
                            <p className="text-gray-500 text-right mt-3 text-xs font-bold">
                                Los registros con estado "DNI Duplicado" serán salteados automáticamente.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
