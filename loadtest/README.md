# Prueba de carga intermedia con Artillery

Esta carpeta contiene un escenario de **sólo lectura** contra `/api/movies` y `/api/showtimes` con **warm-up**, **rampa** y **fase sostenida**, más generación de **reporte HTML**.

## Requisitos previos
- Backend corriendo en `http://localhost:4000`
- (Opcional) Frontend en `http://localhost:3000`
- Node.js instalado (para usar `npx`)

## Comandos rápidos

### Ejecutar la prueba y guardar resultados (Windows PowerShell)
```powershell
$env:BASE_URL="http://localhost:4000"
$env:FRONTEND="http://localhost:3000"
npx --yes artillery@latest run .\loadtest\artillery_intermedio.yml --output .\loadtest\result.json
```

### Ejecutar la prueba y guardar resultados (macOS/Linux bash)
```bash
BASE_URL=http://localhost:4000 FRONTEND=http://localhost:3000 npx --yes artillery@latest run loadtest/artillery_intermedio.yml --output loadtest/result.json
```

### Generar reporte HTML (Windows PowerShell)
```powershell
npx --yes artillery@latest report .\loadtest\result.json --output .\loadtest\report.html
Start-Process .\loadtest\report.html
```

### Generar reporte HTML (macOS/Linux bash)
```bash
npx --yes artillery@latest report loadtest/result.json --output loadtest/report.html
xdg-open loadtest/report.html  # Linux
open loadtest/report.html      # macOS
```

## Interpretación
- Objetivo: **p95 < 5000 ms** y **error rate < 1%** en la fase de **sustain**.
- Revisa `report.html` para percentiles por endpoint, RPS y errores.

## Notas
- Si necesitas cambiar el host/puerto, usa variables `BASE_URL` y `FRONTEND` como en los ejemplos.
- Resultados recomendados para ignorar en git:
```
loadtest/result.json
loadtest/report.html
```
## (Opcional) Agregar scripts al package.json (sólo herramientas) 

En la raíz (si tienes package.json en la raíz), añade:

{
  "scripts": {
    "load:artillery": "BASE_URL=http://localhost:4000 FRONTEND=http://localhost:3000 npx --yes artillery@latest run loadtest/artillery_intermedio.yml --output loadtest/result.json",
    "load:report": "npx --yes artillery@latest report loadtest/result.json --output loadtest/report.html"
  }
}

Windows PowerShell (variables de entorno) — alternativa:

{
  "scripts": {
    "load:artillery": "set BASE_URL=http://localhost:4000&& set FRONTEND=http://localhost:3000&& npx --yes artillery@latest run loadtest/artillery_intermedio.yml --output loadtest/result.json",
    "load:report": "npx --yes artillery@latest report loadtest/result.json --output loadtest/report.html"
  }
}

Ejecutar:

npm run load:artillery
npm run load:report

Añadir a .gitignore (para no versionar los resultados)

En el .gitignore de la raíz:

# Artillery load test outputs
loadtest/result.json
loadtest/report.html
