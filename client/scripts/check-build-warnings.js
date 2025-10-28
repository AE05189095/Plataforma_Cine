/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');
const path = require('path');

// Ejecuta `npm run build` en la carpeta client y detecta la palabra 'warning' en la salida.
const cwd = path.resolve(__dirname, '..');
console.log('Ejecutando build en:', cwd);

const runner = 'npm';
// Usar shell: true para mayor compatibilidad en Windows PowerShell
const child = spawn(runner, ['run', 'build'], { cwd, env: process.env, shell: true });

let buffer = '';

child.stdout.on('data', (d) => {
  const s = d.toString();
  process.stdout.write(s);
  buffer += s;
});

child.stderr.on('data', (d) => {
  const s = d.toString();
  process.stderr.write(s);
  buffer += s;
});

child.on('close', (code) => {
  const warnings = buffer.match(/\bwarn(ing)?\b/i);
  if (warnings) {
    console.error('\nSe detectaron warnings en la salida del build. Falla el check.');
    // opcional: mostrar las líneas que contienen 'warn'
    const lines = buffer.split(/\r?\n/).filter(l => /\bwarn(ing)?\b/i.test(l));
    console.error('\n-- Líneas con warnings --');
    lines.forEach(l => console.error(l));
    process.exit(1);
  }

  if (code !== 0) {
    console.error('\nEl build terminó con código de salida', code);
    process.exit(code || 1);
  }

  console.log('\nNo se detectaron warnings en la salida del build.');
  process.exit(0);
});
