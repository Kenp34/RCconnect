import { useEffect, useRef ,useCallback,useState} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getRoomId } from '../helpers/rooms';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                   || 'http://localhost:5001';


export function useSocket(onNewMessage, onMessageEdited, onMessageDeleted, onTyping) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Stocker les callbacks dans des refs pour éviter les stale closures
  const onNewMessageRef = useRef(onNewMessage);
  const onMessageEditedRef = useRef(onMessageEdited);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onTypingRef = useRef(onTyping);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onMessageEditedRef.current = onMessageEdited;
    onMessageDeletedRef.current = onMessageDeleted;
    onTypingRef.current = onTyping;
  }, [onNewMessage, onMessageEdited, onMessageDeleted, onTyping]);

  useEffect(() => {
    if (!token || !user) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connecté');
      setIsConnected(true);
      socketRef.current.emit('joinPersonalRoom', user._id);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('newMessage', (message) => {
      onNewMessageRef.current?.(message);
    });

    socketRef.current.on('messageEdited', (data) => {
      onMessageEditedRef.current?.(data);
    });

    socketRef.current.on('messageDeleted', (data) => {
      onMessageDeletedRef.current?.(data);
    });

    socketRef.current.on('userTyping', ({ userId, userName, isTyping }) => {
      onTypingRef.current?.(userId, userName, isTyping);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, user]);

  const joinRoom = useCallback((otherUserId) => {
    if (!socketRef.current || !user?._id) return;
    const roomId = getRoomId(user._id, otherUserId);
    if (currentRoomRef.current) {
      socketRef.current.emit('leaveRoom', currentRoomRef.current);
    }
    socketRef.current.emit('joinRoom', roomId);
    currentRoomRef.current = roomId;
  }, [user]);

  const sendTyping = useCallback((recipientId, isTyping) => {
    if (!socketRef.current || !user?._id) return;
    const roomId = getRoomId(user._id, recipientId);
    socketRef.current.emit('typing', { roomId, isTyping, userId: user._id, userName: user.name });
  }, [user]);

  // ✅ Ne jamais retourner socketRef.current directement
  return { isConnected, joinRoom, sendTyping };
}