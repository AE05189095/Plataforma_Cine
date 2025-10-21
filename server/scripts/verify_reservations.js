#!/usr/bin/env node
// Script de verificación rápida de integridad de reservas
// Comprueba: (1) seatsBookedMap referencias purchases existentes, (2) purchases referencian el showtime correcto y user, (3) seatsBooked y seatsBookedMap son consistentes.

const mongoose = require('mongoose');
const Showtime = require('../src/models/Showtime');
const Purchase = require('../src/models/Purchase');
const User = require('../src/models/User');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_cine';

async function main() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Conectado a mongo:', uri);
  } catch (e) {
    console.error('No se pudo conectar a MongoDB en', uri, '->', e && e.message ? e.message : e);
    process.exit(1);
  }

  const showtimes = await Showtime.find({}).lean();
  let totalIssues = 0;

  for (const st of showtimes) {
    const stId = String(st._id);
    console.log('\n--- Showtime', stId, st.movie, st.hall);
    const map = Array.isArray(st.seatsBookedMap) ? st.seatsBookedMap : [];
    const seatsLegacy = Array.isArray(st.seatsBooked) ? st.seatsBooked : [];

    // Verificar cada entry en seatsBookedMap
    for (const entry of map) {
      const seat = entry && entry.seat ? String(entry.seat) : null;
      const pId = entry && entry.purchase ? String(entry.purchase) : null;
      if (!seat || !pId) {
        console.warn('  - Entry inválida en seatsBookedMap:', entry);
        totalIssues++;
        continue;
      }
      const p = await Purchase.findById(pId).lean();
      if (!p) {
        console.warn(`  - Purchase ${pId} referenciado por seat ${seat} no existe`);
        totalIssues++;
        continue;
      }
      if (String(p.showtime) !== stId) {
        console.warn(`  - Purchase ${pId} (showtime ${p.showtime}) no coincide con showtime ${stId} para seat ${seat}`);
        totalIssues++;
      }
      if (!p.user) {
        console.warn(`  - Purchase ${pId} no tiene user asociado`);
        totalIssues++;
      } else {
        const u = await User.findById(p.user).lean();
        if (!u) {
          console.warn(`  - Purchase ${pId} apunta a user ${p.user} que no existe`);
          totalIssues++;
        }
      }
    }

    // Verificar que seatsLegacy está en sintonía con map
    const seatsFromMap = map.map(x => x && x.seat).filter(Boolean);
    const extraLegacy = seatsLegacy.filter(s => !seatsFromMap.includes(s));
    const missingLegacy = seatsFromMap.filter(s => !seatsLegacy.includes(s));
    if (extraLegacy.length) {
      console.warn('  - Asientos en seatsBooked (legacy) no presentes en seatsBookedMap:', extraLegacy);
      totalIssues++;
    }
    if (missingLegacy.length) {
      console.warn('  - Asientos en seatsBookedMap no presentes en seatsBooked:', missingLegacy);
      totalIssues++;
    }

    console.log(`  Mapa entries: ${map.length}, legacy seats: ${seatsLegacy.length}`);
  }

  console.log('\nVerificación finalizada. Issues detectados:', totalIssues);
  await mongoose.disconnect();
}

main().catch(err => { console.error('Error en verificación:', err); process.exit(1); });
