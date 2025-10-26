'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, User, Sparkles, Plus, Trash2, MessageCircle, Menu, Mic, MicOff, Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWhisperRecognition } from '@/hooks/useWhisperRecognition';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  created_at?: string;
}

interface Conversation {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userMemory, setUserMemory] = useState<any>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<'en' | 'fr'>('fr'); // Separate from UI language
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Whisper speech recognition hook with language support (uses chat language preference)
  const speechLang = chatLanguage === 'fr' ? 'fr' : 'en';
  const {
    isRecording,
    isProcessing,
    transcript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported: isSpeechSupported,
    error: speechError,
  } = useWhisperRecognition({
    language: speechLang,
    onTranscript: async (text) => {
      // Auto-submit when transcript is received from Whisper
      if (text.trim()) {
        await submitMessage(text);
        resetTranscript();
        setInput('');
      }
    }
  });

  // isListening combines recording and processing states
  const isListening = isRecording || isProcessing;

  const t = language === 'fr' ? {
    title: 'Assistant IA Personnel',
    placeholder: 'Demandez-moi n\'importe quoi...',
    send: 'Envoyer',
    newChat: 'Nouvelle conversation',
    conversations: 'Conversations',
    welcomeBack: (name?: string, hasMemory?: boolean) => {
      if (hasMemory && name) {
        return `Rebonjour ${name}! 👋 Content de te revoir. Que puis-je faire pour toi aujourd'hui?`;
      } else if (name) {
        return `Rebonjour ${name}! 👋 Comment puis-je t'aider aujourd'hui?`;
      }
      return `Rebonjour! 👋 Comment puis-je t'aider aujourd'hui?`;
    },
    welcomeFirst: 'Bonjour! Je suis FoxWise AI, ton assistant personnel. Je peux t\'aider à gérer tes tâches, planifier ta journée, et bien plus encore. Comment puis-je t\'aider?',
    examples: [
      '💡 "Crée une tâche pour acheter du lait"',
      '💡 "Quelles sont mes tâches pour aujourd\'hui?"',
      '💡 "Planifie ma journée de demain"',
    ],
  } : {
    title: 'Personal AI Assistant',
    placeholder: 'Ask me anything...',
    send: 'Send',
    newChat: 'New conversation',
    conversations: 'Conversations',
    welcomeBack: (name?: string, hasMemory?: boolean) => {
      if (hasMemory && name) {
        return `Welcome back ${name}! 👋 Great to see you again. What can I do for you today?`;
      } else if (name) {
        return `Welcome back ${name}! 👋 How can I help you today?`;
      }
      return `Welcome back! 👋 How can I help you today?`;
    },
    welcomeFirst: 'Hello! I\'m FoxWise AI, your personal assistant. I can help you manage your tasks, plan your day, and much more. How can I help you?',
    examples: [
      '💡 "Create a task to buy milk"',
      '💡 "What are my tasks for today?"',
      '💡 "Plan my day for tomorrow"',
    ],
  };

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowSidebar(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Load conversations and user memory when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      fetchUserMemory();
    }
  }, [isOpen]);

  // Load welcome message based on user history
  useEffect(() => {
    if (isOpen && !currentConversationId && messages.length === 0) {
      const userName = userMemory?.full_name?.split(' ')[0]; // First name only
      const hasConversations = conversations.length > 0;
      const hasMemory = userMemory && (
        userMemory.full_name ||
        Object.keys(userMemory.preferences || {}).length > 0 ||
        Object.keys(userMemory.habits || {}).length > 0 ||
        userMemory.personal_notes
      );

      // Message personnalisé basé sur l'historique
      let welcomeMessage;
      if (hasConversations || hasMemory) {
        welcomeMessage = t.welcomeBack(userName, hasMemory);
      } else {
        welcomeMessage = t.welcomeFirst;
      }

      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, currentConversationId, userMemory, conversations]);

  // With Whisper, transcript arrives once after recording stops
  // Auto-submit is handled in the onTranscript callback
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      setIsPlayingAudio(false);
      setIsVoiceMode(false);
      if (isRecording) {
        stopRecording();
      }
    }
  }, [isOpen, isRecording, stopRecording]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations?limit=20');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUserMemory = async () => {
    try {
      const response = await fetch('/api/user-memory');
      if (response.ok) {
        const data = await response.json();
        setUserMemory(data);

        // Load chat language preference if it exists
        if (data?.preferences?.chatLanguage) {
          setChatLanguage(data.preferences.chatLanguage);
          console.log('[Chat] Loaded chat language preference:', data.preferences.chatLanguage);
        }
      }
    } catch (error) {
      console.error('Error fetching user memory:', error);
    }
  };

  const saveChatLanguagePreference = async (newLanguage: 'en' | 'fr') => {
    try {
      const currentPreferences = userMemory?.preferences || {};
      const response = await fetch('/api/user-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            ...currentPreferences,
            chatLanguage: newLanguage,
          },
        }),
      });

      if (response.ok) {
        console.log('[Chat] Saved chat language preference:', newLanguage);
        // Update local state
        setUserMemory((prev: any) => ({
          ...prev,
          preferences: {
            ...currentPreferences,
            chatLanguage: newLanguage,
          },
        }));
      }
    } catch (error) {
      console.error('Error saving chat language preference:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          created_at: msg.created_at,
        })));
        setCurrentConversationId(conversationId);
        if (isMobile) {
          setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(language === 'fr' ? 'Supprimer cette conversation?' : 'Delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== conversationId));
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const playAudioResponse = async (text: string) => {
    try {
      setIsPlayingAudio(true);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'nova' }), // Nova est plus naturelle pour le français
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        // Auto-désactive le mode vocal après la réponse
        setIsVoiceMode(false);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        setIsVoiceMode(false);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setIsVoiceMode(false);
    }
  };

  const startVoiceMode = () => {
    // Active le mode vocal complet
    setIsVoiceMode(true);
    resetTranscript();
    setInput('');
    startRecording();
  };

  // Simple language detection based on common French words/patterns
  const detectLanguage = (text: string): 'en' | 'fr' => {
    const lowerText = text.toLowerCase();

    // French indicators
    const frenchWords = ['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'est', 'sont', 'suis',
                         'être', 'avoir', 'ça', 'çà', 'où', 'être', 'faire', 'quel', 'quelle', 'quels', 'quelles',
                         'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
                         'bonjour', 'merci', 'stp', 'svp', 'pourquoi', 'comment', 'quand', 'combien'];

    // English indicators
    const englishWords = ['the', 'is', 'are', 'am', 'was', 'were', 'have', 'has', 'had', 'will', 'would',
                          'can', 'could', 'should', 'my', 'your', 'his', 'her', 'our', 'their',
                          'what', 'when', 'where', 'why', 'how', 'hello', 'thanks', 'please'];

    const words = lowerText.split(/\s+/);
    let frenchScore = 0;
    let englishScore = 0;

    words.forEach(word => {
      if (frenchWords.includes(word)) frenchScore++;
      if (englishWords.includes(word)) englishScore++;
    });

    // If we have a clear winner, use it. Otherwise keep current language
    if (frenchScore > englishScore) return 'fr';
    if (englishScore > frenchScore) return 'en';

    return chatLanguage; // Keep current if ambiguous
  };

  const submitMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();

    // Detect language from user message
    const detectedLang = detectLanguage(userMessage);
    if (detectedLang !== chatLanguage) {
      console.log('[Chat] Language switched from', chatLanguage, 'to', detectedLang);
      setChatLanguage(detectedLang);
      saveChatLanguagePreference(detectedLang);
    }

    // Check if we should start a new conversation (2h inactivity)
    let conversationToUse = currentConversationId;
    if (currentConversationId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const lastMessageTime = lastMessage.timestamp || lastMessage.created_at ? new Date(lastMessage.created_at!) : new Date();
      const hoursSinceLastMessage = (new Date().getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastMessage > 2) {
        // Start new conversation after 2h of inactivity
        conversationToUse = null;
        setCurrentConversationId(null);
      }
    }

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationToUse,
          language: chatLanguage, // Pass chat language preference (independent from UI language)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Play audio response if in voice mode
      if (isVoiceMode) {
        await playAudioResponse(data.message);
      }

      // Clean up after voice mode
      if (isVoiceMode) {
        resetTranscript();
        setInput('');
      }

      // Update conversation ID if new
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id);
        // Refresh conversations list to show the new one
        fetchConversations();
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: chatLanguage === 'fr'
          ? 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer.'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    await submitMessage(userMessage);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-purple-500/30 flex overflow-hidden"
        >
          {/* Sidebar */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="w-80 border-r border-gray-700/50 bg-gray-900/50 flex flex-col"
              >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700/50">
                  <button
                    onClick={startNewConversation}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    {t.newChat}
                  </button>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold px-2 mb-2">{t.conversations}</p>
                  {conversations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      {language === 'fr' ? 'Aucune conversation' : 'No conversations yet'}
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all group relative ${
                          currentConversationId === conv.id
                            ? 'bg-purple-600/20 border border-purple-500/50'
                            : 'bg-gray-800/30 hover:bg-gray-700/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-white truncate">
                                {conv.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(conv.last_message_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <Menu className="w-5 h-5 text-gray-400" />
                  </button>
                )}
                <div className="relative">
                  <Image
                    src="/fox-icon.png"
                    alt="FoxWise AI"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t.title}</h2>
                  <p className="text-xs text-gray-400">
                    {isListening ? (language === 'fr' ? '🎤 À l\'écoute...' : '🎤 Listening...') :
                     isPlayingAudio ? (language === 'fr' ? '🔊 En train de parler...' : '🔊 Speaking...') :
                     'Powered by AI'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-br from-purple-600 to-blue-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Image
                        src="/fox-icon.png"
                        alt="FoxWise AI"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-100 border border-gray-700'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.timestamp && (
                      <p className="text-xs text-gray-500 mt-1 px-2">
                        {message.timestamp.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Image
                      src="/fox-icon.png"
                      alt="FoxWise AI"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Example prompts (shown when no messages or only welcome) */}
              {messages.length <= 1 && !currentConversationId && (
                <div className="space-y-2 mt-4">
                  {t.examples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(example.replace('💡 "', '').replace('"', ''))}
                      className="w-full text-left px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700/50 bg-gray-900/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? (language === 'fr' ? '🎤 Parlez maintenant...' : '🎤 Speak now...') : t.placeholder}
                  disabled={isLoading || isListening}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />

                {/* Voice button */}
                {isSpeechSupported && !isLoading && !isListening && (
                  <button
                    type="button"
                    onClick={startVoiceMode}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center gap-2"
                    title={language === 'fr' ? 'Mode vocal' : 'Voice mode'}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{t.send}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
