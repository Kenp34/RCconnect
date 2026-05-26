import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import ConversationList from '../components/message/ConversationList';
import ChatArea from '../components/message/ChatArea';
import styles from './message.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Mettre à jour le dernier message dans la liste
  const updateConversationLastMessage = (message) => {
    setConversations(prev => {
      const otherId = message.sender._id === user._id
        ? message.recipient._id
        : message.sender._id;

      const exists = prev.some(conv => {
        const convOtherId = conv.sender?._id === user._id
          ? conv.recipient?._id
          : conv.sender?._id;
        return convOtherId === otherId;
      });

      // Si la conversation n'existe pas encore, l'ajouter
      if (!exists) {
        const newConv = {
          _id: message._id,
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender,
          recipient: message.recipient,
          unread: false
        };
        return [newConv, ...prev];
      }

      const updated = prev.map(conv => {
        const convOtherId = conv.sender?._id === user._id
          ? conv.recipient?._id
          : conv.sender?._id;
        if (convOtherId === otherId) {
          return { ...conv, content: message.content, createdAt: message.createdAt };
        }
        return conv;
      });
      return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  };

  // Socket avec callbacks
  const { joinRoom, sendMessage, sendTyping } = useSocket(

    (newMessage) => {
       // ✅ Le socket reçoit le message confirmé par le serveur
       // On l'ajoute UNE SEULE FOIS ici
      setMessages(prev => {
        // Vérifier si le message existe déjà (éviter doublons)
        const exists = prev.some(m => m._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      updateConversationLastMessage(newMessage);
    },
    ({ messageId, content, edited, editedAt }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, content, edited, editedAt } : msg
      ));
    },
    ({ messageId, deleted }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, deleted, content: '[Message supprimé]' }
          : msg
      ));
    },
    (userId, userName, isTyping) => {
      setTypingUser(isTyping ? { id: userId, name: userName } : null);
      setTimeout(() => setTypingUser(null), 2000);
    }
  );

  



  // Charger conversations + abonnements
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: convs }, { data: me }] = await Promise.all([
          axios.get(`${API}/messages`),
          axios.get(`${API}/users/me`)
        ]);
        setConversations(convs);
        setFollowing(me.following || []);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchData();
  }, []);

  // Charger les messages d'une conversation
  const loadMessages = async (otherUser) => {
    setLoading(true);
    setActiveConversation(otherUser);
    joinRoom(otherUser._id);
    try {
      const { data } = await axios.get(`${API}/messages/${otherUser._id}`);
      setMessages(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Envoyer un message
  const handleSendMessage = async (content) => {
    if (!content.trim() || !activeConversation) return;

    try {
      // ✅ Envoyer SEULEMENT via API
      // Socket.io retournera le message à TOUS (incluant l'émetteur)
      // donc PAS d'optimistic update ici
      await axios.post(`${API}/messages`, {
        recipientId: activeConversation._id,
        content: content.trim()
      });

      // Émettre via Socket pour notifier le destinataire
      sendMessage(activeConversation._id, content.trim());

    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  };
  // Supprimer un message
  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/messages/${messageId}`);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, deleted: true, content: '[Message supprimé]' }
          : msg
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Modifier un message
  const handleEditMessage = async (messageId, newContent) => {
    try {
      const { data } = await axios.put(
        `${API}/messages/${messageId}`,
        { content: newContent }
      );
      setMessages(prev => prev.map(msg =>
        msg._id === messageId
          ? { ...msg, content: data.content, edited: true, editedAt: data.editedAt }
          : msg
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Indicateur de frappe
  const handleTyping = (isTyping) => {
    if (activeConversation) {
      sendTyping(activeConversation._id, isTyping);
    }
  };

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesWrapper}>
        <ConversationList
          conversations={conversations}
          following={following}
          activeConversation={activeConversation}
          onSelectConversation={loadMessages}
          currentUser={user}
        />
        <ChatArea
          messages={messages}
          activeConversation={activeConversation}
          currentUser={user}
          loading={loading}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          typingUser={typingUser}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
        />
      </div>
    </div>
  );
}



/* (newMessage) => {
    setMessages(prev => [...prev, newMessage]);
    updateConversationLastMessage(newMessage);
  },*/