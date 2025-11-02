// /app/compra-exitosa/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';

export default function CompraExitosaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get('purchase_id');

  // Redirecciona automáticamente después de 5 segundos
  useEffect(() => {
    const REDIRECT_DELAY = 5000;
    const timer = setTimeout(() => {
      router.push('/');
    }, REDIRECT_DELAY);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Header />
      <main className="px-4 py-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex flex-col items-center">
            <CheckCircle className="w-20 h-20 text-green-400 mb-4" />

            <h1 className="text-3xl font-bold mb-2">
              ¡Compra Exitosa! 🎉
            </h1>

            <p className="text-lg text-slate-300 mb-4">
              Tu transacción se procesó correctamente.
            </p>

            {purchaseId && (
              <p className="text-sm text-slate-400 mb-6">
                ID de transacción:
                <span className="font-mono bg-gray-800 border border-gray-700 text-amber-300 px-2 py-1 rounded ml-2">
                  {purchaseId}
                </span>
              </p>
            )}

            <p className="text-md text-slate-300">
              Serás redirigido a la pantalla principal en 5 segundos…
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Volver a inicio ahora
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}