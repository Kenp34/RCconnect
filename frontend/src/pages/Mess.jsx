import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { getRoomId } from '../helpers/rooms';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Messages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null); // Conversation ouverte
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null); // Pour scroller en bas automatiquement

    // Connexion Socket.io
    const socketRef = useSocket(
        (msg) => setMessages(prev => [...prev, msg]), // Nouveau message reçu
        () => { } // Notifications gérées ailleurs
    );

    // Charger les conversations au montage
    useEffect(() => {
        axios.get(`${API}/messages`).then(r => setConversations(r.data));
    }, []);

    // Charger les messages quand on change de conversation
    useEffect(() => {
        if (!activeConv) return;
        const roomId = getRoomId(user._id, activeConv._id);
        socketRef.current?.emit('joinRoom', roomId); // Rejoindre la room
        axios.get(`${API}/messages/${activeConv._id}`).then(r => setMessages(r.data));
    }, [activeConv]);

    // Scroller en bas à chaque nouveau message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim() || !activeConv) return;
        const roomId = getRoomId(user._id, activeConv._id);
        socketRef.current.emit('sendMessage', {
            roomId,
            recipientId: activeConv._id,
            content: input
        });
        setInput(''); // Vider l'input immédiatement
    };

    return (
        <div className='flex h-screen max-w-4xl mx-auto'>
            {/* Liste des conversations */}
            <div className='w-64 border-r overflow-y-auto'>
                {conversations.map(conv => {
                    const other = conv.sender._id === user._id ? conv.recipient : conv.sender;
                    return (
                        <div key={conv._id} onClick={() => setActiveConv(other)}
                            className='p-3 hover:bg-gray-100 cursor-pointer border-b'>
                            <p className='font-semibold text-sm'>{other.name}</p>
                            <p className='text-xs text-gray-500 truncate'>{conv.content}</p>
                        </div>
                    );
                })}
            </div>

            {/* Zone de chat */}
            <div className='flex-1 flex flex-col'>
                <div className='flex-1 overflow-y-auto p-4 space-y-2'>
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-3 py-2 max-w-xs text-sm ${msg.sender._id === user._id ? 'bg-blue-600 text-white' : 'bg-gray-100'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className='border-t p-3 flex gap-2'>
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder='Votre message...'
                        className='flex-1 border rounded-full px-4 py-2 text-sm' />
                    <button onClick={sendMessage}
                        className='bg-blue-600 text-white px-4 py-2 rounded-full text-sm'>
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
}
