import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL, getAssetUrl } from '../lib/api';

// ============================================================================
// TYPES
// ============================================================================

interface ChatUser {
    _id: string;
    name: string;
    avatar?: string;
}

interface ChatMessage {
    _id: string;
    studentId: string;
    trainerId: string;
    senderId: ChatUser;
    content: string;
    createdAt: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const shouldShowDateDivider = (current: ChatMessage, previous?: ChatMessage) => {
    if (!previous) return true;
    return new Date(current.createdAt).toDateString() !== new Date(previous.createdAt).toDateString();
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

const Avatar: React.FC<{ user: ChatUser; size?: string }> = ({ user, size = 'w-8 h-8' }) => (
    <div className={`${size} rounded-full overflow-hidden flex-shrink-0 bg-[#d6b161]/20 border border-[#d6b161]/30 flex items-center justify-center text-[#d6b161] font-bold text-sm`}>
        {user.avatar ? (
            <img src={getAssetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
        ) : (
            user.name.charAt(0).toUpperCase()
        )}
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ChatPage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [otherParty, setOtherParty] = useState<{ name: string; avatar?: string } | null>(null);
    const [trainerId, setTrainerId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    const myId = user?._id || (user as any)?.id;
    const isStudent = user?.role === 'student';

    // ── Load chat history via REST ───────────────────────────────────────────
    useEffect(() => {
        if (!studentId || !myId) return;

        const loadHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get(`/chat/${studentId}`);
                setMessages(res.data.messages || []);
                setTrainerId(res.data.trainerId);

                // Determine who the "other party" is for the header
                if (isStudent) {
                    // Fetch trainer info from the first message or batch, fallback to generic
                    const trainerMsg = res.data.messages.find((m: ChatMessage) => m.senderId._id !== myId);
                    if (trainerMsg) {
                        setOtherParty({ name: trainerMsg.senderId.name, avatar: trainerMsg.senderId.avatar });
                    } else {
                        setOtherParty({ name: 'Trainer' });
                    }
                } else {
                    // Trainer: other party is the student
                    const studentMsg = res.data.messages.find((m: ChatMessage) => m.senderId._id !== myId);
                    if (studentMsg) {
                        setOtherParty({ name: studentMsg.senderId.name, avatar: studentMsg.senderId.avatar });
                    } else {
                        setOtherParty({ name: 'Student' });
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load chat');
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [studentId, myId, isStudent]);

    // ── Set up Socket.IO ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!studentId || !myId || !trainerId) return;

        const token = localStorage.getItem('token');
        const socket = io(API_BASE_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('joinRoom', { studentId, trainerId });
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('newMessage', (msg: ChatMessage) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('error', (err: { message: string }) => {
            console.error('Socket error:', err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [studentId, myId, trainerId]);

    // ── Auto-scroll to bottom ────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Send message ─────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || !socketRef.current || !trainerId) return;

        socketRef.current.emit('sendMessage', {
            studentId,
            trainerId,
            content: input.trim(),
        });

        setInput('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <Header />

            <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 bg-white dark:bg-[#112240] border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    {otherParty ? (
                        <Avatar
                            user={{ _id: '', name: otherParty.name, avatar: otherParty.avatar }}
                            size="w-10 h-10"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[#d6b161]/20 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-[#d6b161]" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 dark:text-white truncate">
                            {otherParty?.name || (isStudent ? 'Trainer' : 'Student')}
                        </h2>
                        <p className={`text-xs font-medium ${connected ? 'text-green-500' : 'text-gray-400'}`}>
                            {connected ? 'Online' : 'Connecting...'}
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-2 border-[#d6b161] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-red-500 text-center">{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-[#d6b161]/20 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-[#d6b161]" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Send a message to start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMine = msg.senderId._id === myId;
                            const prevMsg = idx > 0 ? messages[idx - 1] : undefined;
                            const showDivider = shouldShowDateDivider(msg, prevMsg);

                            return (
                                <React.Fragment key={msg._id}>
                                    {showDivider && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2">
                                                {formatDateDivider(msg.createdAt)}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                        </div>
                                    )}
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {!isMine && (
                                            <Avatar user={msg.senderId} size="w-7 h-7" />
                                        )}
                                        <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                                isMine
                                                    ? 'bg-[#d6b161] text-[#0a192f] rounded-tr-sm font-medium'
                                                    : 'bg-white dark:bg-[#112240] text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-tl-sm'
                                            }`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="px-4 py-3 bg-white dark:bg-[#112240] border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-end gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message... (Enter to send)"
                            rows={1}
                            className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a192f] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d6b161]/50 focus:border-[#d6b161] transition-colors text-sm max-h-32 overflow-y-auto"
                            style={{ minHeight: '42px' }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || !connected}
                            className="p-2.5 rounded-xl bg-[#d6b161] text-[#0a192f] hover:bg-[#c4a055] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                        Messages are automatically deleted after 7 days
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
