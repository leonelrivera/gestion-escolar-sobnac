'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [nombre, setNombre] = useState('');
    const [logoBase64, setLogoBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion`)
            .then(res => res.json())
            .then(data => {
                setNombre(data.nombreInstitucion);
                setLogoBase64(data.logoBase64);
            });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    nombreInstitucion: nombre,
                    logoBase64: logoBase64
                })
            });

            if (res.ok) {
                setMessage('Configuración actualizada con éxito. Recarga la página para ver los cambios.');
            } else {
                setMessage('Error al actualizar la configuración.');
            }
        } catch (err) {
            setMessage('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-dark-green uppercase tracking-wider">Ajustes del Sistema</h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-primary/10 space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Nombre de la Institución</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Logo Institucional (Gama de Verdes)</label>
                    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5">
                        {logoBase64 && (
                            <img src={logoBase64} alt="Previsualización logo" className="h-32 w-32 object-contain bg-white p-2 rounded-lg shadow-sm" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-dark-green hover:file:bg-primary/80 transition-all cursor-pointer"
                        />
                        <p className="text-xs text-foreground/50 text-center">Recomendado: Imagen cuadrada con fondo transparente (PNG)</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-center font-medium ${message.includes('éxito') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-dark-green text-white font-bold rounded-xl shadow-lg hover:bg-dark-green/90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </form>
        </div>
    );
}
