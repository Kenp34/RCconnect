import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getRoomId } from '../helpers/rooms';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export function useSocket() {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Stocker les callbacks
  const callbacksRef = useRef({});

  // Fonction pour enregistrer les callbacks
  const registerCallbacks = useCallback((callbacks) => {
    console.log('📝 Registration des callbacks:', Object.keys(callbacks));
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  }, []);

  // Initialisation du socket
  useEffect(() => {
    if (!token || !user) {
      console.log('❌ Pas de token ou user');
      return;
    }

    console.log('🟢 Initialisation du socket...');

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connecté - ID:', socket.id);
      setIsConnected(true);
      socket.emit('joinPersonalRoom', user._id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket déconnecté');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket error:', error.message);
    });

    // ✅ Écouteurs avec logs
    socket.on('newMessage', (message) => {
      console.log('📩 [SOCKET] newMessage reçu:', message);
      if (callbacksRef.current.onNewMessage) {
        callbacksRef.current.onNewMessage(message);
      } else {
        console.warn('⚠️ Pas de callback onNewMessage');
      }
    });

    socket.on('messageEdited', (data) => {
      console.log('✏️ [SOCKET] messageEdited reçu');
      if (callbacksRef.current.onMessageEdited) {
        callbacksRef.current.onMessageEdited(data);
      }
    });

    socket.on('messageDeleted', (data) =>{
      console.log('🗑️ [SOCKET] messageDeleted reçu');
      if (callbacksRef.current.onMessageDeleted) {
        callbacksRef.current.onMessageDeleted(data);
      }
    });

    socket.on('userTyping', ({ userId, userName, isTyping }) => {
      if (callbacksRef.current.onTyping) {
        callbacksRef.current.onTyping(userId, userName, isTyping);
      }
    });

    socket.on('newNotification', (notification) => {
      console.log('🔔 Notification reçue:', notification);
      if (callbacksRef.current.onNotification) {
        callbacksRef.current.onNotification(notification);
      }
    });

    return () => {
      console.log('🔴 Nettoyage du socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, user]);

  // 📌 Rejoindre une room
  const joinRoom = useCallback((otherUserId) => {
    if (!socketRef.current || !user?._id) {
      console.warn('⚠️ Socket non disponible');
      return;
    }
    const roomId = getRoomId(user._id, otherUserId);
    if (currentRoomRef.current) {
      socketRef.current.emit('leaveRoom', currentRoomRef.current);
    }
    socketRef.current.emit('joinRoom', roomId);
    currentRoomRef.current = roomId;
    console.log(`📌 Room rejointe: ${roomId}`);
    return roomId;
  }, [user]);

  // 📤 Envoyer un message
  const sendMessage = useCallback((recipientId, content) => {
    if (!socketRef.current) {
      console.warn('⚠️ Socket non disponible');
      return;
    }
    console.log(`📤 Envoi message à: ${recipientId}`);
    socketRef.current.emit('sendMessage', { recipientId, content });
  }, []);

  // ⌨️ Indicateur de frappe
  const sendTyping = useCallback((recipientId, isTyping) => {
    if (!socketRef.current || !user?._id) return;
    const roomId = getRoomId(user._id, recipientId);
    socketRef.current.emit('typing', { roomId, isTyping, userId: user._id, userName: user.name });
  }, [user]);

  // 🚪 Quitter la room
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !currentRoomRef.current) return;
    socketRef.current.emit('leaveRoom', currentRoomRef.current);
    currentRoomRef.current = null;
  }, []);

  // 🏠 Room personnelle
  const joinPersonalRoom = useCallback(() => {
    if (!socketRef.current || !user?._id) return;
    socketRef.current.emit('joinPersonalRoom', user._id);
  }, [user]);

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    joinPersonalRoom,
    registerCallbacks  // 👈 IMPORTANT: exporter cette fonction
  };
}