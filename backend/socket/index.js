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
   
    // Envoyer un message
    socket.on('sendMessage', async ({ recipientId, content }) => {
      try {
        const Message = require('../models/Message');
        const roomId  = getRoomId(socket.user._id, recipientId);

        const message = await Message.create({
          sender:    socket.user._id,
          recipient: recipientId,
          content,
          room:      roomId
        });

        await message.populate('sender', 'name avatar department');
        await message.populate('recipient', 'name avatar');

        // ✅ Envoyer à TOUTE la room (incluant l'émetteur)
        // Cela évite les doublons côté frontend
        io.to(roomId).emit('newMessage', message);

        // Notification au destinataire
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'message',
          sender: socket.user,
          message: `${socket.user.name} vous a envoyé un message`
        });
       console.log("envoyer")
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

   // ✅ Modifier un message
    socket.on('editMessage', async ({ messageId, content }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });

        // Vérifier que c'est bien son message
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        message.content   = content;
        message.edited    = true;
        message.editedAt  = new Date();
        await message.save();

        // ✅ Notifier toute la room
        io.to(message.room).emit('messageEdited', {
          messageId: message._id,
          content:   message.content,
          edited:    message.edited,
          editedAt:  message.editedAt
        });
          console.log("modifier")
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ✅ Supprimer un message
    socket.on('deleteMessage', async ({ messageId }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });

        // Vérifier que c'est bien son message
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        // Soft delete
        message.deleted   = true;
        message.deletedAt = new Date();
        message.content   = '[Message supprimé]';
        await message.save();

        // ✅ Notifier toute la room
        io.to(message.room).emit('messageDeleted', {
          messageId: message._id,
          deleted:   true
        });

        console.log("supprimer")

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

   
    // Indicateur de frappe
    socket.on('typing', ({ roomId, isTyping, userId, userName }) => {
      socket.to(roomId).emit('userTyping', { userId, userName, isTyping });
    });


    // Quitter une room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
    });
   
    // Rejoindre room personnelle
    socket.on('joinPersonalRoom', (userId) => {
      socket.join(`user_${userId}`);
    });
  
   
    // Déconnexion
    socket.on('disconnect', () => {
      activeUsers.delete(socket.user._id.toString());
      console.log(`❌ Utilisateur déconnecté: ${socket.user.name}`);
    });
  });
};





 /*

 `
module.exports = (io) => {

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
    activeUsers.set(socket.user._id.toString(), socket.id);

    // ✅ Room personnelle pour les notifications
    socket.join(`user_${socket.user._id}`);

    // Rejoindre une conversation
    socket.on('joinRoom', (otherUserId) => {
      const roomId = getRoomId(socket.user._id, otherUserId);
      socket.join(roomId);
    });

    // Envoyer un message
    socket.on('sendMessage', async ({ recipientId, content }) => {
      try {
        const Message = require('../models/Message');
        const roomId  = getRoomId(socket.user._id, recipientId);

        const message = await Message.create({
          sender:    socket.user._id,
          recipient: recipientId,
          content,
          room:      roomId
        });

        await message.populate('sender', 'name avatar department');
        await message.populate('recipient', 'name avatar');

        // ✅ Envoyer à TOUTE la room (incluant l'émetteur)
        // Cela évite les doublons côté frontend
        io.to(roomId).emit('newMessage', message);

        // Notification au destinataire
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'message',
          sender: socket.user,
          message: `${socket.user.name} vous a envoyé un message`
        });

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ✅ Modifier un message
    socket.on('editMessage', async ({ messageId, content }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });

        // Vérifier que c'est bien son message
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        message.content   = content;
        message.edited    = true;
        message.editedAt  = new Date();
        await message.save();

        // ✅ Notifier toute la room
        io.to(message.room).emit('messageEdited', {
          messageId: message._id,
          content:   message.content,
          edited:    message.edited,
          editedAt:  message.editedAt
        });

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ✅ Supprimer un message
    socket.on('deleteMessage', async ({ messageId }) => {
      try {
        const Message = require('../models/Message');
        const message = await Message.findById(messageId);

        if (!message) return socket.emit('error', { message: 'Message introuvable' });

        // Vérifier que c'est bien son message
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', { message: 'Non autorisé' });
        }

        // Soft delete
        message.deleted   = true;
        message.deletedAt = new Date();
        message.content   = '[Message supprimé]';
        await message.save();

        // ✅ Notifier toute la room
        io.to(message.room).emit('messageDeleted', {
          messageId: message._id,
          deleted:   true
        });

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Indicateur de frappe
    socket.on('typing', ({ recipientId, isTyping }) => {
      const roomId = getRoomId(socket.user._id, recipientId);
      socket.to(roomId).emit('userTyping', {
        userId:   socket.user._id,
        userName: socket.user.name,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.user._id.toString());
    });
  });
};
    // Indicateur de frappe
    socket.on('typing', ({ roomId, isTyping, userId, userName }) => {
      socket.to(roomId).emit('userTyping', { userId, userName, isTyping });
    });*/