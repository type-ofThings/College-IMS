const http = require('http');

async function testExport() {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/export-results/fake_quiz_id123',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body:', data.substring(0, 100));
    });
  });

  req.on('error', e => console.error(e));
  req.end();
}

testExport();
