'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [config, setConfig] = useState<{ nombreInstitucion: string; logoBase64: string | null } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion`)
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(() => { });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/10 px-4">
            <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-primary/5">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 p-2">
                        {config?.logoBase64 ? (
                            <img src={config.logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <span className="text-3xl font-bold text-dark-green">SN</span>
                        )}
                    </div>
                    <h2 className="text-2xl font-extrabold text-dark-green text-center">
                        {config?.nombreInstitucion || 'Soberanía Nacional'}
                    </h2>
                    <p className="text-foreground/50 text-sm mt-1">Gestión Escolar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground/70 ml-1 mb-2" htmlFor="email">Correo Electrónico</label>
                        <input
                            type="email"
                            placeholder="usuario@escuela.com"
                            className="w-full px-5 py-4 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all placeholder:text-gray-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-foreground/70 ml-1 mb-2">Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-5 py-4 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all placeholder:text-gray-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-sm p-4 rounded-xl text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    <button className="w-full py-4 bg-dark-green text-white font-bold rounded-2xl shadow-lg shadow-dark-green/20 hover:bg-dark-green/90 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Ingresar
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-foreground/30">
                    SGE - Versión 1.0.0
                </div>
            </div>
        </div>
    );
}
