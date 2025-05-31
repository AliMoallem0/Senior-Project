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
  Settings,
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

const AIAssistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedChats, setSavedChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
              ${userInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Check if we have valid response data
      if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error('Invalid API response format:', data);
        throw new Error('Received invalid response format from AI service');
      }
      
      const aiResponse = data.candidates[0].content.parts[0].text || 'I apologize, but I couldn\'t generate a response. Please try again.';

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

  // Filter chats based on search query
  const filteredChats = searchQuery
    ? savedChats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedChats;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-blue-600" />
          <h1 className="font-semibold text-lg">Urban Sim Assistant</h1>
        </div>
        
        <div className="p-3 border-b border-gray-200">
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 justify-start text-gray-700"
            onClick={startNewChat}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border border-gray-200">
            <Search className="h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="bg-transparent border-none outline-none flex-1 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredChats.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredChats.map(chat => (
                <div 
                  key={chat.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center ${
                    currentChatId === chat.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => selectChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-800">{chat.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(chat.updated_at).toLocaleDateString()} · {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                    onClick={(e) => deleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 p-4 text-center text-gray-500">
              {searchQuery ? (
                <p>No chats found for "{searchQuery}"</p>
              ) : (
                <>
                  <MessageSquare className="h-8 w-8 mb-2 text-gray-400" />
                  <p>No conversation history yet</p>
                  <p className="text-sm">Start a new chat to begin</p>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-gray-200">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full flex items-center gap-2 justify-start text-gray-700"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="bg-blue-50 rounded-full p-3 mb-4">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Urban Simulation Assistant</h2>
              <p className="text-gray-600 max-w-md">
                Ask me anything about urban planning, city simulations, or simulation parameters. I'm here to help!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {chatMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-3xl rounded-lg px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type your message..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isGenerating}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!userInput.trim() || isGenerating}
              size="icon"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Messages are stored in your account and can be accessed later
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
