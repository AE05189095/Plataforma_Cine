# Plataforma Cine - Cómo ejecutar el proyecto (VS Code)

Instrucciones simples para usar el Terminal integrado de Visual Studio Code (PowerShell). Explicación corta y comandos listos para copiar.

Partes del repo:

- `client/` → Next.js (app React)
- `server/` → API con Express y MongoDB

Requisitos mínimos:

- Node.js 18+ (incluye npm)
- MongoDB (local o Atlas)

Preparar variables de entorno (servidor):

1. Abre VS Code.
2. Abre el Explorador y selecciona la carpeta del proyecto (la raíz donde estás trabajando).
3. En `server/` crea un archivo llamado `.env` con esta línea (ajusta valores):

MONGODB_URI=mongodb://usuario:password@host:puerto/nombre_basedatos

Pasos rápidos (Terminal integrado de VS Code — PowerShell)

Abre el terminal integrado: Terminal > New Terminal (se abrirá PowerShell por defecto).

1) Instalar dependencias del servidor

```powershell
# Sitúate en la carpeta del servidor
Set-Location -Path .\server
npm install
```

2) Instalar dependencias del cliente (en la misma terminal o nueva pestaña)

```powershell
# Desde la raíz del proyecto o abriendo otra pestaña del terminal
Set-Location -Path .\client
npm install
```

3) Levantar el servidor (mantenerlo en ejecución)

```powershell
# En una pestaña del terminal, dentro de server
Set-Location -Path .\server
npm run dev

# Esto lanza el servidor en http://localhost:5000 (según configuración)
```

4) Levantar el cliente (segunda pestaña del terminal)

```powershell
# En otra pestaña del terminal, dentro de client
Set-Location -Path .\client
npm run dev

# Abre http://localhost:3000 en tu navegador
```

Comprobaciones rápidas si algo falla

- Si el servidor no arranca: revisa que `server/.env` exista y que `MONGODB_URI` sea válida.
- Si el cliente muestra errores de hidratación en desarrollo: prueba en una ventana de incógnito sin extensiones. Muchas extensiones del navegador inyectan atributos en el DOM (p. ej. `cz-shortcut-listen`) y causan warnings.

