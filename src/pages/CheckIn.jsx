import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { saveEntry, saveTip } from '../utils/storage';
import { analyzeEntry } from '../utils/gemini';
import DailyQuote from '../components/DailyQuote';
import BreathingTimer from '../components/BreathingTimer';

const MOODS = [
  { emoji: '😫', label: 'Exhausted' },
  { emoji: '😟', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Okay' },
  { emoji: '😄', label: 'Focused' },
];

const EXAMS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC'];

export default function CheckIn({ onEntryAdded }) {
  const [mood, setMood] = useState(null);
  const [stress, setStress] = useState(5);
  const [selectedExams, setSelectedExams] = useState([]);
  const [journal, setJournal] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [submittedDetails, setSubmittedDetails] = useState(null);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);

  const toggleExam = (exam) => {
    setSelectedExams((prev) =>
      prev.includes(exam)
        ? prev.filter((e) => e !== exam)
        : [...prev, exam]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood || !journal.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);

    const selectedMoodObj = MOODS.find((m) => m.label === mood);

    try {
      // Call Gemini API
      const response = await analyzeEntry({
        mood: selectedMoodObj.emoji,
        moodLabel: selectedMoodObj.label,
        stress: Number(stress),
        exams: selectedExams,
        journal: journal.trim(),
      });

      // Save to localStorage
      const entry = {
        mood: selectedMoodObj.emoji,
        moodLabel: selectedMoodObj.label,
        stress: Number(stress),
        exams: selectedExams,
        journal: journal.trim(),
        aiResponse: response,
      };
      saveEntry(entry);
      saveTip({
        aiResponse: response,
      });

      // Set response and details for card
      setAiResponse(response);
      setSubmittedDetails({
        mood: selectedMoodObj.emoji,
        stress: Number(stress),
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });

      // Notify parent to refresh streak
      if (onEntryAdded) {
        onEntryAdded();
      }

      // Reset form
      setMood(null);
      setStress(5);
      setSelectedExams([]);
      setJournal('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !mood || !journal.trim();

  return (
    <div className="space-y-6">
      {/* Daily Quote Banner */}
      <DailyQuote />

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Mood Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            How are you feeling right now? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {MOODS.map((m) => {
              const isSelected = mood === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  disabled={loading}
                  onClick={() => setMood(m.label)}
                  className={`flex flex-col items-center justify-center p-1 sm:p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-brand-teal bg-brand-teal/5 shadow-sm scale-[1.01] font-bold'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xl sm:text-2xl mb-1">{m.emoji}</span>
                  <span className={`text-[9px] sm:text-xs font-medium truncate w-full ${isSelected ? 'text-brand-teal' : 'text-gray-600'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stress Level Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-gray-700">Stress Level</label>
            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
              {stress} / 10
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Low → High</span>
            <input
              type="range"
              min="1"
              max="10"
              disabled={loading}
              value={stress}
              onChange={(e) => setStress(e.target.value)}
              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-teal ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Exam Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Which exams are you preparing for? <span className="text-xs text-gray-400 font-normal">(Select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EXAMS.map((exam) => {
              const isSelected = selectedExams.includes(exam);
              return (
                <button
                  key={exam}
                  type="button"
                  disabled={loading}
                  onClick={() => toggleExam(exam)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {exam}
                </button>
              );
            })}
          </div>
        </div>

        {/* Journal Entry */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Daily Journal <span className="text-red-500">*</span>
          </label>
          <textarea
            value={journal}
            disabled={loading}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="Write freely... What happened today? What's worrying you? Any wins, however small?"
            className={`w-full p-4 border border-gray-200 rounded-xl focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none min-h-[120px] transition-all resize-y text-sm text-gray-800 placeholder-gray-400 bg-white ${
              loading ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled || loading}
          className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${
            isSubmitDisabled || loading
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-brand-teal hover:bg-brand-teal/90 active:scale-[0.99] hover:shadow-md'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing your entry...</span>
            </>
          ) : (
            'Analyze & get personalized support'
          )}
        </button>
      </form>

      {/* AI Response Card */}
      {aiResponse && submittedDetails && (
        <div className="p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-teal/5 to-brand-purple/5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
              MindSpace AI
            </span>
          </div>

          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
            {aiResponse}
          </div>

          <div className="pt-3 border-t border-gray-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 font-medium">
            <span>
              Feeling {submittedDetails.mood} · Stress: {submittedDetails.stress}/10
            </span>
            <span>{submittedDetails.date}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsBreathingOpen(true)}
            className="w-full mt-2 py-2.5 px-4 rounded-xl border border-brand-teal/30 hover:border-brand-teal text-brand-teal bg-brand-teal/5 hover:bg-brand-teal/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            🧘 Try a breathing exercise
          </button>
        </div>
      )}

      {/* Breathing timer overlay */}
      <BreathingTimer isOpen={isBreathingOpen} onClose={() => setIsBreathingOpen(false)} />
    </div>
  );
}
