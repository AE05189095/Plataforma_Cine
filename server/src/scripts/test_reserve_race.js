const fetch = require('node-fetch');

// Script simple para intentar reservar el mismo asiento desde dos clientes simultáneos
// Usage: node src/scripts/test_reserve_race.js <showtimeId> <seatId>

const [,, showtimeId, seatId] = process.argv;
if (!showtimeId || !seatId) {
  console.error('Usage: node test_reserve_race.js <showtimeId> <seatId>');
  process.exit(1);
}

const API = process.env.API_BASE || 'http://localhost:5000';

async function reserve(clientName) {
  try {
    const res = await fetch(`${API}/api/showtimes/${showtimeId}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats: [seatId] }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(clientName, res.status, body);
  } catch (err) {
    console.error(clientName, 'ERROR', err.message || err);
  }
}

(async () => {
  // lanzar dos reservas casi simultáneas
  await Promise.all([reserve('client-A'), reserve('client-B')]);
})();
