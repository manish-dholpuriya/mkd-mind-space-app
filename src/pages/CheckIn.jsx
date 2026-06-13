import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { saveEntry, saveTip } from '../utils/storage';
import { analyzeEntry } from '../utils/gemini';
import DailyQuote from '../components/DailyQuote';
import BreathingTimer from '../components/BreathingTimer';
import ExamCountdown from '../components/ExamCountdown';
import CrisisHelpline from '../components/CrisisHelpline';

const MOODS = [
  { emoji: '😫', label: 'Exhausted' },
  { emoji: '😟', label: 'Anxious' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '🙂', label: 'Okay' },
  { emoji: '😄', label: 'Focused' },
];

const EXAMS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC'];
const MAX_JOURNAL_CHARS = 500;

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
  const [showToast, setShowToast] = useState(false);

  const toggleExam = (exam) => {
    setSelectedExams((prev) =>
      prev.includes(exam)
        ? prev.filter((e) => e !== exam)
        : [...prev, exam]
    );
  };

  const getStressColor = () => {
    const s = Number(stress);
    if (s <= 3) return 'text-emerald-600 bg-emerald-50';
    if (s <= 7) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood || !journal.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);

    const selectedMoodObj = MOODS.find((m) => m.label === mood);

    try {
      const response = await analyzeEntry({
        mood: selectedMoodObj.emoji,
        moodLabel: selectedMoodObj.label,
        stress: Number(stress),
        exams: selectedExams,
        journal: journal.trim(),
      });

      const entry = {
        mood: selectedMoodObj.emoji,
        moodLabel: selectedMoodObj.label,
        stress: Number(stress),
        exams: selectedExams,
        journal: journal.trim(),
        aiResponse: response,
      };
      saveEntry(entry);
      saveTip({ aiResponse: response });

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

      if (onEntryAdded) onEntryAdded();

      // Reset form
      setMood(null);
      setStress(5);
      setSelectedExams([]);
      setJournal('');

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = !mood || !journal.trim();

  return (
    <div className="space-y-6 relative">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-toast">
          <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-emerald-500/25 text-sm font-bold flex items-center gap-2">
            <span>✓</span> Check-in saved successfully!
          </div>
        </div>
      )}

      {/* Daily Quote Banner */}
      <DailyQuote />

      {/* Exam Countdown */}
      <ExamCountdown />

      <form onSubmit={handleSubmit} className="space-y-8 animate-fadeInUp">
        {/* Mood Selector */}
        <fieldset className="space-y-3" disabled={loading}>
          <legend className="block text-sm font-semibold text-gray-700 mb-3">
            How are you feeling right now? <span className="text-rose-500" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </legend>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-label="Select your mood">
            {MOODS.map((m) => {
              const isSelected = mood === m.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={m.label}
                  onClick={() => setMood(m.label)}
                  className={`flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer group ${
                    isSelected
                      ? 'border-brand-teal bg-brand-teal/5 shadow-sm scale-[1.02] ring-1 ring-brand-teal/20'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <span className="text-xl sm:text-2xl mb-0.5 transition-transform duration-150 group-hover:scale-110">{m.emoji}</span>
                  <span className={`text-[9px] sm:text-xs font-semibold truncate w-full ${isSelected ? 'text-brand-teal' : 'text-gray-500'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Stress Level Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label htmlFor="stress-slider" className="text-sm font-semibold text-gray-700">Stress Level</label>
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg transition-colors duration-200 ${getStressColor()}`}>
              {stress} / 10
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap" aria-hidden="true">Low → High</span>
            <input
              id="stress-slider"
              type="range"
              min="1"
              max="10"
              disabled={loading}
              value={stress}
              onChange={(e) => setStress(e.target.value)}
              className="stress-slider w-full"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={stress}
              aria-label={`Stress level: ${stress} out of 10`}
            />
          </div>
        </div>

        {/* Exam Selector */}
        <fieldset className="space-y-3" disabled={loading}>
          <legend className="block text-sm font-semibold text-gray-700 mb-3">
            Which exams are you preparing for? <span className="text-xs text-gray-400 font-normal">(Select all that apply)</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select your exams">
            {EXAMS.map((exam) => {
              const isSelected = selectedExams.includes(exam);
              return (
                <button
                  key={exam}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleExam(exam)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple ring-1 ring-brand-purple/20'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {exam}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Journal Entry */}
        <div className="space-y-2">
          <label htmlFor="journal-entry" className="block text-sm font-semibold text-gray-700">
            Daily Journal <span className="text-rose-500" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <textarea
            id="journal-entry"
            value={journal}
            disabled={loading}
            maxLength={MAX_JOURNAL_CHARS}
            onChange={(e) => setJournal(e.target.value)}
            aria-required="true"
            placeholder="Write freely... What happened today? What's worrying you? Any wins, however small?"
            className={`w-full p-4 border border-gray-200 rounded-xl focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 outline-none min-h-[120px] transition-all resize-y text-base md:text-sm text-gray-800 placeholder-gray-400 bg-white ${
              loading ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''
            }`}
            aria-describedby="journal-char-count"
          />
          <div id="journal-char-count" className="flex justify-end">
            <span className={`text-[11px] font-semibold tabular-nums ${
              journal.length > MAX_JOURNAL_CHARS * 0.9 ? 'text-rose-500' : 'text-gray-300'
            }`}>
              {journal.length}/{MAX_JOURNAL_CHARS}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold animate-fadeInUp" role="alert">
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
              : 'bg-gradient-to-r from-brand-teal to-emerald-500 hover:shadow-lg hover:shadow-brand-teal/20 active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
              <span>Analyzing your entry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Analyze & get personalized support
            </>
          )}
        </button>
      </form>

      {/* Shimmer Skeleton while loading */}
      {loading && (
        <div className="space-y-3 p-6 rounded-2xl border border-gray-100 bg-white" role="status" aria-label="Loading AI analysis">
          <div className="shimmer-line h-3 w-3/4" />
          <div className="shimmer-line h-3 w-full" />
          <div className="shimmer-line h-3 w-5/6" />
          <div className="shimmer-line h-3 w-2/3 mt-4" />
          <div className="shimmer-line h-3 w-full" />
          <div className="shimmer-line h-3 w-4/5" />
          <span className="sr-only">Loading AI response...</span>
        </div>
      )}

      {/* AI Response Card */}
      {aiResponse && submittedDetails && (
        <div className="p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-teal/5 to-brand-purple/5 shadow-sm animate-fadeInUp space-y-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
              MindSpace AI
            </span>
          </div>

          {/* Typewriter-style animated paragraphs */}
          <div className="text-sm leading-relaxed text-gray-700 font-medium space-y-2" aria-live="polite">
            {aiResponse.split('\n').filter(Boolean).map((para, i) => (
              <p
                key={i}
                className="animate-typewriter"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {para}
              </p>
            ))}
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
            aria-label="Open breathing exercise timer"
          >
            🧘 Try a breathing exercise
          </button>
        </div>
      )}

      {/* Crisis Support Helpline */}
      <CrisisHelpline />

      {/* Breathing timer overlay */}
      <BreathingTimer isOpen={isBreathingOpen} onClose={() => setIsBreathingOpen(false)} />
    </div>
  );
}
