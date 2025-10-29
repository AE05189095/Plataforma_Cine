const http = require('http');

function request(path, method = 'GET', body = null) {
  const options = { hostname: 'localhost', port: 5000, path, method, headers: { 'Content-Type': 'application/json' }, agent: false };
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main(){
  try{
    console.log('1) Intentando login con user seed (cliente@ejemplo.com / password123)');
    let res = await request('/api/auth/login', 'POST', { email: 'cliente@ejemplo.com', password: 'password123' });
    console.log('login status', res.status, res.body);
    const loginData = JSON.parse(res.body || '{}');

    console.log('\n2) Solicitando recover-password para cliente@ejemplo.com');
    res = await request('/api/auth/recover-password', 'POST', { email: 'cliente@ejemplo.com' });
    console.log('recover status', res.status, res.body);
    const recoverData = JSON.parse(res.body || '{}');

    if (recoverData.token) {
      console.log('\n3) Reseteando contraseña usando el token (newPassword: nueva123)');
      res = await request('/api/auth/reset-password', 'POST', { token: recoverData.token, newPassword: 'nueva123' });
      console.log('reset status', res.status, res.body);

      console.log('\n4) Intentando login con la nueva contraseña (nueva123)');
      res = await request('/api/auth/login', 'POST', { email: 'cliente@ejemplo.com', password: 'nueva123' });
      console.log('login nuevo status', res.status, res.body);
    } else {
      console.log('No se obtuvo token de recuperación.');
    }

  }catch(err){
    console.error(err);
  }
}

main();
