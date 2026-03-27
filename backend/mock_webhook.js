const fetch = require('node-fetch');

const payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1035644772963331",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "1035644772963331"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.test.1234",
                "timestamp": "1603059201",
                "text": {
                  "body": "Hi there"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
};

fetch('http://localhost:5000/api/whatsapp/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
