try {
    const mongoose = require('mongoose');
    console.log('Mongoose loaded successfully version:', mongoose.version);
} catch (e) {
    console.error('Failed to load mongoose:', e.message);
    process.exit(1);
}
