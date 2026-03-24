const mongoose = require('mongoose');

const WidgetSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  theme_color: { type: String, default: '#25D366' },
  welcome_text: { type: String, default: 'Hi there! How can we help you today?' },
  button_text: { type: String, default: 'Chat with us' },
  position: { type: String, enum: ['left', 'right'], default: 'right' },
  whatsapp_number_id: { type: String }, // Which WABA number receives the messages
}, { timestamps: true });

module.exports = mongoose.model('Widget', WidgetSchema);
