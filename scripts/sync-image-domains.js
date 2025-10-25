#!/usr/bin/env node
/**
 * sync-image-domains.js
 *
 * Consulta la API (GET /api/movies) y extrae hostnames de posterUrl.
 * Actualiza client/next.config.ts añadiendo los dominios faltantes.
 *
 * Uso:
 *   node scripts/sync-image-domains.js
 * o vía npm: npm run --prefix client sync-image-domains
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');
const http = require('http');

async function fetchJson(apiUrl) {
  return new Promise((resolve, reject) => {
    const lib = apiUrl.startsWith('https') ? https : http;
    const req = lib.get(apiUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Respuesta no JSON: ' + err.message));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.abort(); reject(new Error('Timeout al consultar API')); });
  });
}

function extractHostnamesFromMovies(movies) {
  const hosts = new Set();
  if (!Array.isArray(movies)) return hosts;
  movies.forEach((m) => {
    const p = m && (m.posterUrl || m.image || m.images && m.images[0]);
    if (!p || typeof p !== 'string') return;
    try {
      const u = new URL(p);
      if (u.protocol === 'http:' || u.protocol === 'https:') hosts.add(u.hostname);
    } catch (e) {
      // si no es URL completa, ignorar
    }
  });
  return hosts;
}

function readNextConfig(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function updateNextConfig(filePath, newHosts) {
  const content = readNextConfig(filePath);
  if (!content) throw new Error('No se encontró ' + filePath);

  // Intentamos parsear la lista domains existente buscando 'domains: [ ... ]'
  const domainsRegex = /domains\s*:\s*\[([\s\S]*?)\]/m;
  const match = content.match(domainsRegex);
  if (!match) {
    throw new Error('No se pudo encontrar el array images.domains en next.config.ts');
  }

  const existingBlock = match[1];
  // extraer strings entre comillas
  const hostRegex = /['"]([^'"\n\r]+?)['"]/g;
  const existing = new Set();
  let m;
  while ((m = hostRegex.exec(existingBlock)) !== null) existing.add(m[1]);

  let changed = false;
  newHosts.forEach(h => { if (!existing.has(h)) { existing.add(h); changed = true; } });

  if (!changed) return { changed: false };

  const hostsArray = Array.from(existing).sort();
  const hostsText = hostsArray.map(h => `      '${h}',`).join('\n');

  // reemplazar el bloque
  const newContent = content.replace(domainsRegex, `domains: [\n${hostsText}\n    ]`);
  fs.writeFileSync(filePath, newContent, 'utf8');
  return { changed: true, hosts: hostsArray };
}

async function main() {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE || 'http://localhost:5000';
    // Primero probar la ruta especializada que devuelve dominios (más segura)
    const imageDomainsUrl = apiBase.replace(/\/$/, '') + '/api/movies/_internal/image-domains';
    console.log('Consultando dominios en (preferido):', imageDomainsUrl);

    let hosts = new Set();
    try {
      const domains = await fetchJson(imageDomainsUrl);
      if (Array.isArray(domains) && domains.length > 0) {
        domains.forEach(d => hosts.add(d));
      }
    } catch (err) {
      console.warn('No se pudo obtener /_internal/image-domains, intentando /api/movies (falla segura):', err.message);
      const moviesUrl = apiBase.replace(/\/$/, '') + '/api/movies';
      console.log('Consultando API de películas en', moviesUrl);
      let movies = [];
      try {
        movies = await fetchJson(moviesUrl);
      } catch (err2) {
        console.error('Error al obtener películas desde la API:', err2.message);
        process.exit(1);
      }
      const extracted = extractHostnamesFromMovies(movies);
      extracted.forEach(h => hosts.add(h));
    }
    if (hosts.size === 0) {
      console.log('No se encontraron posterUrl con host válido en la respuesta de la API. Nada que hacer.');
      return;
    }

    const nextConfigPath = path.resolve(__dirname, '..', 'client', 'next.config.ts');
    const result = updateNextConfig(nextConfigPath, hosts);
    if (!result.changed) {
      console.log('No hubo cambios. next.config.ts ya contiene los dominios.');
    } else {
      console.log('next.config.ts actualizado. Dominios actuales:');
      console.log(result.hosts.join(', '));
      console.log('\nRecuerda reiniciar el servidor de desarrollo de Next para aplicar los cambios.');
    }
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) main();
