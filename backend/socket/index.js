const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Middleware d'authentification Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Token manquant'));
     
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });
 
  // Map des utilisateurs actifs
  const activeUsers = new Map();
 
  io.on('connection', (socket) => {
    console.log(`✅ Utilisateur connecté: ${socket.user.name}`);
   
    // Enregistrer l'utilisateur
    activeUsers.set(socket.user._id.toString(), socket.id);
   
    // Rejoindre la room personnelle pour les notifications
    socket.join(`user_${socket.user._id}`);
   
    // Rejoindre une room de conversation
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`📌 ${socket.user.name} a rejoint la room: ${roomId}`);
    });
   
    // Quitter une room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
    });
   
    // Rejoindre room personnelle
    socket.on('joinPersonalRoom', (userId) => {
      socket.join(`user_${userId}`);
    });
   
    // Indicateur de frappe
    socket.on('typing', ({ roomId, isTyping, userId, userName }) => {
      socket.to(roomId).emit('userTyping', { userId, userName, isTyping });
    });
   
    // Déconnexion
    socket.on('disconnect', () => {
      activeUsers.delete(socket.user._id.toString());
      console.log(`❌ Utilisateur déconnecté: ${socket.user.name}`);
    });
  });
};