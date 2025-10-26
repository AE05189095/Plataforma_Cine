# Scripts de mantenimiento

sync-image-domains.js

Este script consulta la API pública de películas (`GET /api/movies`) y extrae hostnames de las propiedades `posterUrl` (o `image`). Luego actualiza `client/next.config.ts` añadiendo los dominios faltantes en `images.domains`.

Uso desde la raíz del proyecto:

```powershell
# Ejecutar el script de sincronización (desde la raíz)
npm run --prefix client sync-image-domains
```

Notas:
- El script asume que la API está disponible en la variable de entorno `NEXT_PUBLIC_API_URL` o `API_BASE`, o en `http://localhost:5000`.
- Tras actualizar `next.config.ts` debes reiniciar el servidor de desarrollo de Next para que los cambios surtan efecto.
- Como mejora futura puedes integrar este script en tu pipeline CI/CD o ejecutar tras cambios en la administración de películas.
