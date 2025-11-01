// /app/compra-exitosa/page.tsx

'use client'; 

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { CheckCircle } from 'lucide-react'; // Asumiendo que usas lucide-react o similar

export default function CompraExitosaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get('purchase_id');
  
  // Lógica de redireccionamiento automático después de 5 segundos
  useEffect(() => {
    const REDIRECT_DELAY = 5000; 

    const timer = setTimeout(() => {
      // Redirige a la página de inicio (localhost:3000/)
      router.push('/');
    }, REDIRECT_DELAY);

    // Función de limpieza
    return () => clearTimeout(timer);
  }, [router]); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      {/* Puedes necesitar instalar lucide-react si no lo tienes: npm install lucide-react */}
      {/*  */}
      <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
      
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        ¡Compra Exitosa! 🎉
      </h1>
      
      <p className="text-lg text-gray-600 mb-4">
        Su transacción ha sido procesada con éxito.
      </p>

      {purchaseId && (
        <p className="text-sm text-gray-500 mb-6">
          ID de Transacción: 
          <span className="font-mono bg-gray-200 p-1 rounded ml-2">
            {purchaseId}
          </span>
        </p>
      )}

      <p className="text-md text-gray-700">
        Será **redirigido a la pantalla principal** en 5 segundos...
      </p>
      
      <button 
        onClick={() => router.push('/')} 
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
      >
        Volver a Inicio Ahora
      </button>
    </div>
  );
}