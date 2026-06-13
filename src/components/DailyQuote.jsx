import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getDailyQuote } from '../utils/gemini';
import { getEntries } from '../utils/storage';

const QUOTE_CACHE_KEY = 'mindspace_daily_quote';

export default function DailyQuote() {
  const [quote, setQuote] = useState('Believe in yourself. Every single effort counts.');
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify({ date: today, quote: text }));
    } catch (err) {
      console.error(err);
      // Fallback quote in case of network/key errors
      setQuote('Believe in yourself. Every single effort counts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="relative bg-[#EEEDFE] rounded-2xl p-5 overflow-hidden flex flex-col justify-center items-center text-center shadow-sm animate-in fade-in duration-300">
      {/* Decorative Quote Mark */}
      <span className="absolute -top-1 left-4 text-[72px] font-serif text-brand-teal opacity-10 select-none leading-none">
        “
      </span>

      {/* Tag Header */}
      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-purple mb-1.5 z-1 select-none">
        Today's thought
      </div>

      {/* Quote text */}
      <p className={`text-[15px] font-medium text-gray-700 leading-relaxed max-w-[90%] z-1 transition-all ${loading ? 'opacity-50 animate-pulse' : ''}`}>
        {quote}
      </p>

      {/* Refresh button */}
      <button
        onClick={() => fetchQuote(true)}
        disabled={loading}
        className="absolute top-3.5 right-3.5 p-1.5 rounded-lg hover:bg-brand-purple/10 text-gray-400 hover:text-brand-purple transition-all cursor-pointer z-1 disabled:opacity-50"
        title="Get new quote"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
