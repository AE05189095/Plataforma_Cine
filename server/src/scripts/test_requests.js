const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 5000, path, agent: false }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main(){
  try{
    const movies = await get('/api/movies');
    console.log('--- /api/movies', movies.status, movies.body);

    const showtimes = await get('/api/showtimes');
    console.log('--- /api/showtimes', showtimes.status, showtimes.body);
  }catch(err){
    console.error(err);
  }
}

main();
