const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 1000 },
  room:      { type: String, required: true },  // Ex: 'conv_userId1_userId2'
  read:      { type: Boolean, default: false },  // Lu ou non lu
}, { timestamps: true });

// Index pour accélérer les requêtes par room
MessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);