import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getDailyQuote } from '../utils/gemini';
import { getEntries } from '../utils/storage';

const QUOTE_CACHE_KEY = 'mindspace_daily_quote';

export default function DailyQuote() {
  const [quote, setQuote] = useState('Believe in yourself. Every single effort counts.');
  const [loading, setLoading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const getLocalDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const fetchQuote = async (force = false) => {
    const today = getLocalDateString();
    if (!force) {
      const cached = localStorage.getItem(QUOTE_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === today && parsed.quote) {
            setQuote(parsed.quote);
            return;
          }
        } catch (e) {
          console.error('Failed to parse cached quote', e);
        }
      }
    }

    setLoading(true);
    try {
      const entries = getEntries();
      let examContext = '';
      if (entries && entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        if (lastEntry.exams && lastEntry.exams.length > 0) {
          examContext = lastEntry.exams.join(', ');
        }
      }
      const text = await getDailyQuote(examContext);
      setQuote(text);
      setAnimKey((k) => k + 1); // Trigger re-animation
      localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ date: today, quote: text }));
    } catch (err) {
      console.error(err);
      setQuote('Believe in yourself. Every single effort counts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-[#EEEDFE] to-[#E8F5F0] rounded-2xl p-5 overflow-hidden flex flex-col justify-center items-center text-center shadow-sm animate-fadeInUp">
      {/* Decorative Quote Mark */}
      <span className="absolute -top-1 left-4 text-[72px] font-serif text-brand-teal opacity-10 select-none leading-none" aria-hidden="true">
        &ldquo;
      </span>

      {/* Tag Header */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-purple mb-1.5 z-1 select-none">
        Today's thought
      </div>

      {/* Quote text with entrance animation */}
      <p
        key={animKey}
        className={`text-[15px] font-medium text-gray-700 leading-relaxed max-w-[90%] z-1 transition-all ${
          loading ? 'opacity-40 animate-pulse' : 'animate-fadeInUp'
        }`}
      >
        {quote}
      </p>

      {/* Attribution */}
      <p className="text-[10px] text-gray-400 font-medium mt-2 z-1 select-none">
        — Generated for you by MindSpace AI
      </p>

      {/* Refresh button */}
      <button
        onClick={() => fetchQuote(true)}
        disabled={loading}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-lg hover:bg-brand-purple/10 text-gray-400 hover:text-brand-purple transition-all cursor-pointer z-1 disabled:opacity-50"
        title="Get new quote"
        aria-label="Refresh daily quote"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}
