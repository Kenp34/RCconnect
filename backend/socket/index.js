const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ AJOUTER CETTE FONCTION (MANQUANTE)
const getRoomId = (userId1, userId2) => {
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
};

module.exports = (io) => {
  // Middleware d'authentification
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
 
  const activeUsers = new Map();
 
  io.on('connection', (socket) => {
    console.log(`✅ Utilisateur connecté: ${socket.user.name}`);
   
    activeUsers.set(socket.user._id.toString(), socket.id);
    socket.join(`user_${socket.user._id}`);
   
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`📌 ${socket.user.name} a rejoint: ${roomId}`);
    });
   
    // ✅ ENVOYER UN MESSAGE (CORRIGÉ)
    socket.on('sendMessage', async ({ recipientId, content }) => {
      try {
        console.log(`📤 sendMessage de ${socket.user.name} à ${recipientId}`);
        
        const Message = require('../models/Message');
        const roomId = getRoomId(socket.user._id, recipientId);
        
        console.log(`📌 roomId calculée: ${roomId}`);

        const message = await Message.create({
          sender: socket.user._id,
          recipient: recipientId,
          content,
          room: roomId
        });

        await message.populate('sender', 'name avatar department');
        await message.populate('recipient', 'name avatar');

        // ✅ Envoyer à TOUS dans la room (expéditeur + destinataire)
        io.to(roomId).emit('newMessage', message);
        console.log(`📩 newMessage émis vers room: ${roomId}`);

        // ✅ Notification au destinataire
        io.to(`user_${recipientId}`).emit('newNotification', {
          type: 'message',
          sender: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
          message: `${socket.user.name} vous a envoyé un message`,
          createdAt: new Date()
        });
        
      } catch (err) {
        console.error('❌ Erreur:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // Modifier un message
    socket.on('editMessage', async ({ messageId, content }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        message.content = content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();

        io.to(message.room).emit('messageEdited', {
          messageId: message._id,
          content: message.content,
          edited: true,
          editedAt: message.editedAt
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Supprimer un message
    socket.on('deleteMessage', async ({ messageId }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        message.deleted = true;
        message.deletedAt = new Date();
        message.content = '[Message supprimé]';
        await message.save();

        io.to(message.room).emit('messageDeleted', {
          messageId: message._id,
          deleted: true
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Indicateur de frappe
    socket.on('typing', ({ roomId, isTyping, userId, userName }) => {
      socket.to(roomId).emit('userTyping', { userId, userName, isTyping });
    });

    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
    });
   
    socket.on('joinPersonalRoom', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`📡 ${socket.user?.name} a rejoint sa room personnelle`);
    });
      
    socket.on('disconnect', () => {
      activeUsers.delete(socket.user._id.toString());
      console.log(`❌ Déconnecté: ${socket.user.name}`);
    });
  });
};