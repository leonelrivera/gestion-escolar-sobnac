'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [config, setConfig] = useState<{ nombreInstitucion: string; logoBase64: string | null } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({ nombreInstitucion: 'SGE - Soberanía Nacional', logoBase64: null }));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <main className="flex flex-col items-center gap-12 w-full max-w-4xl animate-in fade-in duration-1000">

        {/* Logo Section */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-white rounded-full shadow-2xl p-4 border-4 border-primary/20">
          {config?.logoBase64 ? (
            <img
              src={config.logoBase64}
              alt="Logo Institucional"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-primary text-6xl font-bold">SN</div>
          )}
        </div>

        {/* Text Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-dark-green tracking-tight">
            {config?.nombreInstitucion || 'Soberanía Nacional'}
          </h1>
          <p className="text-xl md:text-2xl text-foreground/70 font-medium">
            Sistema de Gestión Escolar
          </p>
        </div>

        {/* Action Section */}
        <div className="flex flex-col sm:flex-row gap-6 mt-4">
          <Link
            href="/login"
            className="group relative flex h-14 w-64 items-center justify-center overflow-hidden rounded-xl bg-primary text-dark-green text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10">Ingresar al Sistema</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
          </Link>
        </div>

        {/* Footer info */}
        <p className="fixed bottom-8 text-foreground/40 text-sm">
          © {new Date().getFullYear()} - Gestión Educativa Digital
        </p>
      </main>
    </div>
  );
}
