import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PageShell from '@/components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Smile, Settings, Brain, ArrowLeft } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm MindMate, your AI companion. I'm here to listen, support, and help you navigate your thoughts. How are you feeling right now?",
      created_at: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          message: userMessage,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message, 
        created_at: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Let's take a deep breath and try again in a moment.", 
        created_at: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell maxWidth="full" showHeader={false} showFooter={false}>
      <div className="h-screen flex flex-col relative w-full pt-16 md:pt-0 bg-mesh">
        {/* Header */}
        <header className="sticky top-0 w-full flex justify-between items-center px-6 py-4 glass-panel border-b-0 border-x-0 rounded-b-3xl z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 rounded-full hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full shadow-sm"></div>
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">MindMate AI</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Always here for you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full hover:bg-secondary/10 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Canvas */}
        <section className="flex-grow overflow-y-auto px-4 sm:px-6 py-8 space-y-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 bg-secondary/5 rounded-full text-[10px] uppercase tracking-widest text-muted-foreground font-bold border border-border/50">Today</span>
            </div>

            {messages.map((msg, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index} 
                className={`flex gap-4 items-end ${msg.role === 'user' ? 'justify-end ml-auto max-w-[85%]' : 'max-w-[85%]'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center">
                    <Brain className="text-primary w-4 h-4" />
                  </div>
                )}
                
                <div className={`p-5 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-[1.5rem] rounded-br-sm' : 'bg-card border border-border/50 text-foreground rounded-[1.5rem] rounded-bl-sm'}`}>
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-border bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-secondary-foreground">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex gap-4 items-end max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center">
                  <Brain className="text-primary w-4 h-4" />
                </div>
                <div className="bg-card border border-border/50 p-5 rounded-[1.5rem] rounded-bl-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Message Input */}
        <footer className="p-4 sm:p-6 bg-gradient-to-t from-background via-background to-transparent shrink-0">
          <div className="max-w-3xl mx-auto relative group">
            <div className="bg-card shadow-elevated rounded-full px-6 py-3.5 flex items-center gap-4 border border-border/50 transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Smile className="w-5 h-5" />
              </button>
              <input 
                className="flex-grow bg-transparent border-none focus:ring-0 text-foreground placeholder-muted-foreground outline-none text-[15px]" 
                placeholder="Share your thoughts with MindMate..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <div className="flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors hidden sm:block">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-primary text-primary-foreground p-3 rounded-full flex items-center justify-center hover-lift disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none shadow-md">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4 font-bold tracking-widest uppercase">MindMate can provide support but is not a medical professional.</p>
        </footer>
      </div>
    </PageShell>
  );
}
