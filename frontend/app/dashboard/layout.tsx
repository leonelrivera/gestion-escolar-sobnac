'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Verificar si el token es válido o está expirado (opcional decodificación)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000;
            if (Date.now() >= expiry) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        } catch (e) {
            localStorage.removeItem('token');
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
