const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/email-marketing/templates');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
