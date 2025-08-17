const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String },
  ip: { type: String }, // اضافه کردن فیلد IP برای rate limiting
  createdAt: { type: Date, default: Date.now } // تغییر نام date به createdAt
});

module.exports = mongoose.model('Request', requestSchema);