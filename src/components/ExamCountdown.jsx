import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';

const EXAMS_DB = [
  { name: 'JEE Main 2027 (Jan)', date: '2027-01-24', code: 'JEE' },
  { name: 'GATE 2027', date: '2027-02-06', code: 'GATE' },
  { name: 'NEET UG 2027', date: '2027-05-02', code: 'NEET' },
  { name: 'CUET UG 2027', date: '2027-05-15', code: 'CUET' },
  { name: 'UPSC Prelims 2027', date: '2027-05-30', code: 'UPSC' },
  { name: 'CAT 2026', date: '2026-11-29', code: 'CAT' },
];

export default function ExamCountdown() {
  const [selectedExamCode, setSelectedExamCode] = useState(() => {
    return localStorage.getItem('mindspace_pinned_exam') || 'JEE';
  });

  const [daysRemaining, setDaysRemaining] = useState(0);

  const selectedExam = EXAMS_DB.find((e) => e.code === selectedExamCode) || EXAMS_DB[0];

  useEffect(() => {
    localStorage.setItem('mindspace_pinned_exam', selectedExamCode);
  }, [selectedExamCode]);

  useEffect(() => {
    const calculateDays = () => {
      const examDate = new Date(selectedExam.date);
      const today = new Date();
      // Reset hours to get accurate date subtraction
      examDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    };

    calculateDays();
    // Recalculate once an hour
    const interval = setInterval(calculateDays, 3600000);
    return () => clearInterval(interval);
  }, [selectedExam]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeInUp">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
          <Calendar className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Exam Countdown</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
            <div className="relative inline-flex items-center">
              <select
                value={selectedExamCode}
                onChange={(e) => setSelectedExamCode(e.target.value)}
                className="text-xs font-bold text-brand-purple hover:text-brand-purple/80 bg-transparent border-none outline-none cursor-pointer pr-4 appearance-none"
                aria-label="Select exam for countdown"
              >
                {EXAMS_DB.map((e) => (
                  <option key={e.code} value={e.code} className="text-gray-700 bg-white font-semibold">
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-brand-purple absolute right-0 pointer-events-none" aria-hidden="true" />
            </div>
          </div>
          <h4 className="text-sm font-extrabold text-gray-800 tracking-tight">
            Targeting {selectedExam.name}
          </h4>
          <p className="text-[11px] text-gray-400 font-medium">
            Exam Date: {new Date(selectedExam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-brand-purple/5 border border-brand-purple/10 px-4 py-2.5 rounded-xl self-start sm:self-auto shrink-0 select-none">
        <Clock className="w-4 h-4 text-brand-purple" aria-hidden="true" />
        <span className="text-lg font-black text-brand-purple tracking-tight tabular-nums">
          {daysRemaining}
        </span>
        <span className="text-xs font-bold text-brand-purple/80">
          days left
        </span>
      </div>
    </div>
  );
}
