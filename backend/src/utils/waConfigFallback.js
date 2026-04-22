const getWhatsappConfig = (client) => {
  // HARDCODED FALLBACK FOR SHREYARTH UNIVERSITY
  if (client && client.name && client.name.toLowerCase().includes('shreyarth')) {
    return {
      phoneNumberId: '1074613152404424',
      wabaId: '1433761851305451',
      accessToken: 'EAAUZAwz8PZCJABRfcA4XgJmp8UzJ4ixXbpVA7CvnldS3pkDXdUkbtE2hyfYFHYsZAcZBgKaDwGpHCLf5N0iQfCTfJZAu0iwLmhrbcy2TON4DBvkEeZBZCKhLsSnZCF0ZBASOjWQwtv8ZA2mSZC2ZB0UtQiWcvuPwukLlzAJbLqdkkkW7QPNzJZAWVUKZAQEnPYo2wxzQZDZD',
      phoneNumber: '+91 63566 00606',
      wabaName: 'Shreyarth university'
    };
  }
  
  // Default to the database config
  return client?.whatsappConfig || {};
};

module.exports = { getWhatsappConfig };
