const http = require('http');

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "123456789",
              phone_number_id: "1035644772963331"
            },
            contacts: [{ profile: { name: "Test User" }, wa_id: "919999999999" }],
            messages: [
              {
                from: "919999999999",
                id: "MOCK_MSG_" + Date.now(),
                timestamp: Math.floor(Date.now() / 1000),
                text: { body: "Hello Test" },
                type: "text"
              }
            ]
          },
          field: "messages"
        }
      ]
    }
  ]
};

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/whatsapp/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response: ${data}`);
    if (res.statusCode === 200) {
      console.log('✅ Webhook simulation successful!');
    } else {
      console.log('❌ Webhook simulation failed.');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify(payload));
req.end();
