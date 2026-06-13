import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { chatWithAI } from '../utils/gemini';

const INITIAL_GREETING = "Hi 👋 I'm your MindSpace companion. I'm here to support you through your exam journey. How are you feeling right now? You can ask me anything — about stress, study strategies, burnout, or just talk.";

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', text: input.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // Stay within token limits - send last 10 messages
    const recentHistory = updatedMessages.slice(-10);

    try {
      const response = await chatWithAI(recentHistory);
      setMessages((prev) => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev, 
        { role: 'ai', text: "I'm having trouble connecting right now. Please try again in a moment." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
      {/* Sparkles Tip banner */}
      <div className="bg-[--color-brand-teal]/5 border border-[--color-brand-teal]/10 rounded-2xl p-4 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-[--color-brand-teal] shrink-0 mt-0.5" />
        <div className="text-xs font-semibold text-gray-600 leading-normal">
          Chat freely with MindSpace. Talk about prep stress, revision tips, burnout, or simply share how your day went.
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto max-h-[400px] border border-gray-100 rounded-2xl p-4 bg-gray-50/30 flex flex-col space-y-4 pr-2 scrollbar-thin">
        {/* Initial Greeting */}
        <div className="bg-white border border-gray-100 text-gray-700 self-start rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] sm:max-w-[85%] text-sm font-medium shadow-sm leading-relaxed animate-in fade-in duration-200">
          {INITIAL_GREETING}
        </div>

        {/* Message bubbles */}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`px-4 py-2.5 max-w-[90%] sm:max-w-[85%] text-sm font-medium rounded-2xl leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200 ${
              m.role === 'user'
                ? 'bg-[--color-brand-teal] text-white self-end rounded-tr-sm'
                : 'bg-white border border-gray-100 text-gray-700 self-start rounded-tl-sm'
            }`}
          >
            {m.text}
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="bg-white border border-gray-100 text-gray-400 self-start rounded-2xl rounded-tl-sm px-4 py-3.5 max-w-[90%] sm:max-w-[85%] text-sm font-medium shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input / Send Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Type your message here..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-[--color-brand-teal] focus:ring-1 focus:ring-[--color-brand-teal] outline-none text-sm bg-white font-medium placeholder-gray-400 transition-all disabled:opacity-50 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`px-4 rounded-xl text-white font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm ${
            loading || !input.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[--color-brand-teal] hover:bg-[--color-brand-teal]/90 active:scale-[0.98] hover:shadow-md'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
