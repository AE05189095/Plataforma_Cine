require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Hall = require('../models/Hall');
const Showtime = require('../models/Showtime');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada en .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Conectado a MongoDB para prune_halls');

  // Lista deseada de salas (según screenshot)
  const desired = [
    { name: 'Sala 1A', capacity: 64, isFixed: true },
    { name: 'Sala 2B', capacity: 64, isFixed: true },
    { name: 'Sala 3C', capacity: 64, isFixed: true },
    { name: 'Sala 4D', capacity: 64, isFixed: true },
    { name: 'Sala 5E', capacity: 64, isFixed: true },
    { name: 'Sala 6F', capacity: 64, isFixed: true },
  ];

  // Backup current halls
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `halls-backup-${now}.json`);

  const allHalls = await Hall.find({}).lean();
  fs.writeFileSync(backupFile, JSON.stringify(allHalls, null, 2), 'utf8');
  console.log(`Backup de ${allHalls.length} salas escrito en: ${backupFile}`);

  const desiredNames = desired.map(d => d.name);

  // Crear o actualizar las salas deseadas
  for (const d of desired) {
    const existing = await Hall.findOne({ name: d.name });
    if (existing) {
      let changed = false;
      if (existing.capacity !== d.capacity) {
        existing.capacity = d.capacity;
        changed = true;
      }
      if (existing.isFixed !== d.isFixed) {
        existing.isFixed = d.isFixed;
        changed = true;
      }
      if (changed) {
        await existing.save();
        console.log(`Actualizada sala existente: ${d.name}`);
      } else {
        console.log(`Sala ya correcta: ${d.name}`);
      }
    } else {
      await Hall.create({ name: d.name, capacity: d.capacity, isFixed: d.isFixed, movie: null });
      console.log(`Creada sala: ${d.name}`);
    }
  }

  // Buscar las salas que NO están en la lista deseada
  const toRemove = await Hall.find({ name: { $nin: desiredNames } });
  if (toRemove.length === 0) {
    console.log('No hay salas adicionales para eliminar. Nada que hacer.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Se eliminarán ${toRemove.length} salas no deseadas. Sus IDs:`);
  toRemove.forEach(h => console.log(` - ${h._id.toString()}  ${h.name}`));

  // Eliminar showtimes asociados a esas salas
  const removeIds = toRemove.map(h => h._id);
  const deletedShowtimes = await Showtime.deleteMany({ hall: { $in: removeIds } });
  console.log(`Eliminadas ${deletedShowtimes.deletedCount || deletedShowtimes.n || 0} showtimes asociadas a las salas eliminadas.`);

  // Eliminar las salas
  const res = await Hall.deleteMany({ _id: { $in: removeIds } });
  console.log(`Eliminadas ${res.deletedCount || res.n || 0} salas.`);

  await mongoose.disconnect();
  console.log('Operación completada y desconectado.');
}

if (require.main === module) {
  console.log('\n*** ATENCIÓN: Este script hará un backup y ELIMINARÁ salas que no estén en la lista de 6 especificadas.');
  console.log('Revisa el archivo antes de ejecutarlo si no estás seguro.\n');
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
