import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  Loader2,
  Search,
  BrainCircuit,
  Sparkles
} from 'lucide-react';

// Interface for chat messages
interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  timestamp?: Date;
}

// Interface for chat history items
interface ChatHistory {
  id: string;
  title: string;
  updated_at: string;
}

interface EmbeddedAIAssistantProps {
  projectDetails?: any;
  simulationParams?: any;
  className?: string;
  height?: string;
}

const EmbeddedAIAssistant: React.FC<EmbeddedAIAssistantProps> = ({
  projectDetails = {},
  simulationParams = {},
  className = '',
  height = '500px'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedChats, setSavedChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history on mount
  useEffect(() => {
    if (!user) return;
    
    const loadChatHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_chat_history')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        setSavedChats(data || []);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat history."
        });
      }
    };
    
    loadChatHistory();
  }, [user, toast]);

  // Load messages when chat ID changes
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!currentChatId) {
        setChatMessages([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('chat_id', currentChatId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            isTyping: false,
            timestamp: new Date(msg.created_at)
          }));
          
          setChatMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load chat messages."
        });
      }
    };
    
    loadChatMessages();
  }, [currentChatId, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Create or update chat history entry if not exists
    if (!currentChatId) {
      try {
        const { data: newChat, error } = await supabase
          .from('ai_chat_history')
          .insert({
            user_id: user?.id,
            title: userInput.substring(0, 50) // Use first 50 chars of first message as title
          })
          .select('id')
          .single();
          
        if (error) throw error;
        setCurrentChatId(newChat.id);
        
        // Update local chat history
        const newChatHistory: ChatHistory = {
          id: newChat.id,
          title: userInput.substring(0, 50),
          updated_at: new Date().toISOString()
        };
        setSavedChats(prev => [newChatHistory, ...prev]);
      } catch (error) {
        console.error('Failed to create chat history:', error);
      }
    } else {
      // Update last activity timestamp
      try {
        await supabase
          .from('ai_chat_history')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentChatId);
          
        // Update local state
        setSavedChats(prev => 
          prev.map(chat => 
            chat.id === currentChatId 
              ? {...chat, updated_at: new Date().toISOString()} 
              : chat
          ).sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        );
      } catch (error) {
        console.error('Failed to update chat timestamp:', error);
      }
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Save message to database
    if (currentChatId) {
      try {
        await supabase.from('ai_chat_messages').insert({
          chat_id: currentChatId,
          role: 'user',
          content: userInput
        });
      } catch (error) {
        console.error('Failed to save message:', error);
      }
    }

    // Add placeholder for assistant message
    const assistantPlaceholder: ChatMessage = {
      role: 'assistant',
      content: '',
      isTyping: true
    };
    setChatMessages(prev => [...prev, assistantPlaceholder]);

    try {
      setIsGenerating(true);
      
      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Call AI API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `You are an urban planning and city simulation assistant. You help users understand city dynamics, simulation parameters, and urban development concepts.
              Project details: ${JSON.stringify(projectDetails)}
              Simulation parameters: ${JSON.stringify(simulationParams)}
              User question: ${userInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;

      // Update assistant message
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: aiResponse,
            isTyping: false
          };
        }
        return newMessages;
      });

      // Save assistant response to database
      if (currentChatId) {
        try {
          await supabase.from('ai_chat_messages').insert({
            chat_id: currentChatId,
            role: 'assistant',
            content: aiResponse
          });
        } catch (error) {
          console.error('Failed to save assistant message:', error);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Only show error if not aborted
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get AI response. Please try again."
        });
        
        // Remove the placeholder message
        setChatMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Chat management functions
  const startNewChat = () => {
    setCurrentChatId(null);
    setChatMessages([]);
  };
  
  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };
  
  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the chat when deleting
    
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Update the local state
      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was the current one, clear the current chat
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setChatMessages([]);
      }
      
      toast({
        title: "Chat Deleted",
        description: "Chat history has been deleted."
      });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chat history."
      });
    }
  };

  // Stop AI generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      
      // Update the typing message
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (lastIndex >= 0 && newMessages[lastIndex].isTyping) {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: 'Generation stopped.',
            isTyping: false
          };
        }
        return newMessages;
      });
    }
  };

  // Filter chats based on search query
  const filteredChats = searchQuery
    ? savedChats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedChats;

  return (
    <div className={`flex flex-col border rounded-lg bg-white shadow-sm ${className}`} style={{ height }}>
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium text-sm">Urban Sim Assistant</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            {showSidebar ? "Hide History" : "Chat History"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={startNewChat}
          >
            <Plus className="h-3 w-3 mr-1" />
            New Chat
          </Button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r overflow-y-auto">
            <div className="p-2 border-b">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 border border-gray-200">
                <Search className="h-3 w-3 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  className="bg-transparent border-none outline-none flex-1 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {filteredChats.length > 0 ? (
                filteredChats.map(chat => (
                  <div 
                    key={chat.id}
                    className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center ${
                      currentChatId === chat.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-gray-800">{chat.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(chat.updated_at).toLocaleDateString()} · {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => deleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-gray-500">
                  {searchQuery ? (
                    <p className="text-xs">No chats found</p>
                  ) : (
                    <>
                      <MessageSquare className="h-6 w-6 mb-2 text-gray-400" />
                      <p className="text-xs">No chat history</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-3" ref={chatContainerRef}>
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="bg-blue-50 rounded-full p-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-medium mb-1">Ask me anything about your simulation!</h3>
                <p className="text-xs text-gray-600 max-w-md">
                  I can help you analyze parameters, suggest improvements, and explain results.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {message.isTyping ? (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                      ) : (
                        <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isGenerating}
                className="flex-1 text-xs h-8"
              />
              {isGenerating ? (
                <Button 
                  onClick={stopGeneration} 
                  variant="destructive"
                  size="sm"
                  className="h-8"
                >
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Stop
                </Button>
              ) : (
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!userInput.trim() || isGenerating}
                  size="sm"
                  className="h-8"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedAIAssistant;
