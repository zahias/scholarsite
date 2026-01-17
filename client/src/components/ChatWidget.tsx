import { useEffect, useState } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Chat Widget Configuration
const CHAT_CONFIG = {
  // Tawk.to widget ID (if using Tawk.to)
  tawkPropertyId: import.meta.env.VITE_TAWK_PROPERTY_ID || '',
  tawkWidgetId: import.meta.env.VITE_TAWK_WIDGET_ID || '',
  // Crisp website ID (if using Crisp)
  crispWebsiteId: import.meta.env.VITE_CRISP_WEBSITE_ID || '',
  // Use built-in chat if no external service configured
  useBuiltIn: true,
};

// Initialize Tawk.to
function initTawkTo() {
  if (!CHAT_CONFIG.tawkPropertyId || !CHAT_CONFIG.tawkWidgetId) return false;
  
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://embed.tawk.to/${CHAT_CONFIG.tawkPropertyId}/${CHAT_CONFIG.tawkWidgetId}`;
  script.charset = 'UTF-8';
  script.setAttribute('crossorigin', '*');
  document.head.appendChild(script);
  return true;
}

// Initialize Crisp
function initCrisp() {
  if (!CHAT_CONFIG.crispWebsiteId) return false;
  
  (window as any).$crisp = [];
  (window as any).CRISP_WEBSITE_ID = CHAT_CONFIG.crispWebsiteId;
  
  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  document.head.appendChild(script);
  return true;
}

// Built-in Simple Chat Widget
function BuiltInChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! 👋 Welcome to Scholar.name. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [hasEmail, setHasEmail] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "Thanks for your message! Our team will get back to you shortly.",
        "Great question! For immediate help, you can also check our FAQ section.",
        "I've noted your query. A team member will respond within 24 hours.",
      ];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);

      // Send to backend
      if (hasEmail) {
        fetch('/api/chat-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            message: input,
            page: window.location.pathname,
          }),
        }).catch(console.error);
      }
    }, 1000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      setHasEmail(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Great! I'll make sure our team can reach you at ${email}. What can I help you with?`,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border overflow-hidden transition-all ${isMinimized ? 'h-14' : 'h-[450px]'}`}>
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm">Scholar.name Support</p>
            <p className="text-xs text-white/70">We typically reply in minutes</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[300px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            {!hasEmail ? (
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <p className="text-xs text-muted-foreground">Enter your email so we can follow up:</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Button type="submit" size="sm" className="h-9">
                    Start
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="h-9 text-sm"
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="sm" 
                  className="h-9 px-3"
                  disabled={!input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main Chat Widget Component
export default function ChatWidget() {
  const [initialized, setInitialized] = useState(false);
  const [useBuiltIn, setUseBuiltIn] = useState(false);

  useEffect(() => {
    // Try external services first
    const tawkInitialized = initTawkTo();
    if (tawkInitialized) {
      setInitialized(true);
      return;
    }

    const crispInitialized = initCrisp();
    if (crispInitialized) {
      setInitialized(true);
      return;
    }

    // Fall back to built-in chat
    setUseBuiltIn(true);
    setInitialized(true);
  }, []);

  // Only render built-in chat if no external service is configured
  if (!initialized || !useBuiltIn) {
    return null;
  }

  return <BuiltInChatWidget />;
}
