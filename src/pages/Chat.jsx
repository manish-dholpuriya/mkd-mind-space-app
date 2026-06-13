import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';
import { chatWithAI } from '../utils/gemini';

const INITIAL_GREETING = "Hi 👋 I'm your MindSpace companion. I'm here to support you through your exam journey. How are you feeling right now? You can ask me anything — about stress, study strategies, burnout, or just talk.";

const QUICK_SUGGESTIONS = [
  "I'm feeling stressed 😰",
  "Give me study tips 📚",
  "Help me with burnout 🔥",
  "I need motivation 💪",
];

// Simple markdown-like renderer: bold, bullets
function renderFormattedText(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bullet points
    const bulletMatch = line.match(/^[\-\*•]\s+(.*)/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-2 items-start ml-1 my-0.5">
          <span className="text-brand-teal mt-0.5 text-[10px]">●</span>
          <span>{renderBold(bulletMatch[1])}</span>
        </div>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} className="h-2" />;
    // Normal paragraphs
    return <p key={i} className="my-0.5">{renderBold(line)}</p>;
  });
}

function renderBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    const userMessage = { role: 'user', text: msgText, time: new Date() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const recentHistory = updatedMessages.slice(-10);

    try {
      const response = await chatWithAI(recentHistory);
      setMessages((prev) => [...prev, { role: 'ai', text: response, time: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev, 
        { role: 'ai', text: err.message || "I'm having trouble connecting right now. Please try again in a moment.", time: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const showSuggestions = messages.length === 0;

  return (
    <div className="flex flex-col h-full space-y-4 animate-fadeInUp">
      {/* Tip Banner */}
      <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-2xl p-4 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs font-semibold text-gray-600 leading-normal">
          Chat freely with MindSpace. Talk about prep stress, revision tips, burnout, or simply share how your day went.
        </div>
      </div>

      {/* Chat Messages Area */}
      <div
        className="flex-1 overflow-y-auto max-h-[400px] border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex flex-col space-y-3 scrollbar-styled"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Initial Greeting */}
        <div className="flex gap-2.5 items-end self-start max-w-[90%] sm:max-w-[85%]">
          <div className="w-7 h-7 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0 mb-4">
            <Bot className="w-3.5 h-3.5 text-brand-teal" aria-hidden="true" />
          </div>
          <div>
            <div className="bg-white border border-gray-100 text-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-medium shadow-sm leading-relaxed">
              {INITIAL_GREETING}
            </div>
            <span className="text-[10px] text-gray-300 font-medium mt-1 ml-1 block">now</span>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 py-2 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            {QUICK_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="px-3.5 py-2 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:border-brand-teal hover:text-brand-teal hover:bg-brand-teal/5 transition-all cursor-pointer shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] sm:max-w-[85%] ${m.role === 'ai' ? 'flex gap-2.5 items-end' : ''}`}>
              {m.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0 mb-4">
                  <Bot className="w-3.5 h-3.5 text-brand-teal" aria-hidden="true" />
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-2.5 text-sm font-medium rounded-2xl leading-relaxed shadow-sm animate-fadeInUp ${
                    m.role === 'user'
                      ? 'bg-brand-teal text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'
                  }`}
                >
                  {m.role === 'ai' ? renderFormattedText(m.text) : m.text}
                </div>
                <span className={`text-[10px] text-gray-300 font-medium mt-1 block ${
                  m.role === 'user' ? 'text-right mr-1' : 'ml-1'
                }`}>
                  {m.time ? formatTime(m.time) : ''}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-2.5 items-end self-start max-w-[90%] sm:max-w-[85%]" role="status">
            <div className="w-7 h-7 rounded-full bg-brand-teal/10 flex items-center justify-center shrink-0 mb-4">
              <Bot className="w-3.5 h-3.5 text-brand-teal" aria-hidden="true" />
            </div>
            <div>
              <div className="bg-white border border-gray-100 text-gray-400 rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-medium shadow-sm flex items-center gap-2">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-brand-teal/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-brand-teal/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-brand-teal/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="text-[11px] font-semibold text-gray-400">MindSpace is thinking...</span>
              </div>
              <span className="sr-only">MindSpace is typing a response</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input / Send Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message here..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 outline-none text-sm bg-white font-medium placeholder-gray-400 transition-all disabled:opacity-50 disabled:bg-gray-50"
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`px-4 rounded-xl text-white font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm ${
            loading || !input.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-brand-teal hover:bg-brand-teal/90 active:scale-[0.98] hover:shadow-md'
          }`}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
