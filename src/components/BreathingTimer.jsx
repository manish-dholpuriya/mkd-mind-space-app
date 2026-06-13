import { useState, useEffect, useRef } from 'react';
import { X, Play, Square } from 'lucide-react';

export default function BreathingTimer({ isOpen, onClose }) {
  const [phase, setPhase] = useState('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          let nextPhase = 'Inhale';
          let nextSeconds = 4;
          
          if (phase === 'Inhale') {
            nextPhase = 'Hold';
            nextSeconds = 4;
          } else if (phase === 'Hold') {
            nextPhase = 'Exhale';
            nextSeconds = 6;
          } else {
            nextPhase = 'Inhale';
            nextSeconds = 4;
          }
          
          setPhase(nextPhase);
          return nextSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, phase]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
      setPhase('Inhale');
      setSeconds(4);
    } else {
      setIsRunning(true);
      setPhase('Inhale');
      setSeconds(4);
    }
  };

  const handleClose = () => {
    setIsRunning(false);
    setPhase('Inhale');
    setSeconds(4);
    onClose();
  };

  if (!isOpen) return null;

  // Inline transform styles for consistent browser animations independent of CSS compiler configurations
  const getCircleStyle = () => {
    if (!isRunning) {
      return {
        transform: 'scale(1)',
        transition: 'transform 0.5s ease-out',
      };
    }
    if (phase === 'Inhale') {
      return {
        transform: 'scale(1.45)',
        transition: 'transform 4s linear',
      };
    }
    if (phase === 'Hold') {
      return {
        transform: 'scale(1.45)',
        transition: 'none',
      };
    }
    if (phase === 'Exhale') {
      return {
        transform: 'scale(1)',
        transition: 'transform 6s linear',
      };
    }
    return {};
  };

  const getPhaseColorClass = () => {
    if (!isRunning) return 'text-gray-400';
    if (phase === 'Inhale') return 'text-brand-teal';
    if (phase === 'Hold') return 'text-amber-500';
    return 'text-brand-purple';
  };

  const getInstructions = () => {
    if (!isRunning) return 'Press Start to begin Box Breathing';
    if (phase === 'Inhale') return 'Breathe in slowly through your nose';
    if (phase === 'Hold') return 'Hold your breath and calm your mind';
    return 'Exhale slowly through your mouth';
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl w-full max-w-[420px] p-6 relative shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 border border-gray-100">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <h2 className="text-lg font-bold text-gray-800 mt-2">Mindful Breathing</h2>
        <p className="text-xs text-gray-400 font-semibold mb-6">Box breathing — used by exam toppers to calm nerves instantly</p>

        {/* Outer Static Circle Wrapper */}
        <div className="w-[190px] h-[190px] rounded-full border-2 border-gray-100 flex items-center justify-center relative mb-8">
          {/* Inner Glowing Animated Circle */}
          <div
            style={getCircleStyle()}
            className={`absolute inset-4 rounded-full transition-colors duration-500 ${
              !isRunning 
                ? 'bg-gray-50 border border-gray-100' 
                : phase === 'Inhale'
                ? 'bg-brand-teal/10 border border-brand-teal/20 shadow-lg shadow-brand-teal/5'
                : phase === 'Hold'
                ? 'bg-amber-50 border border-amber-200/55 shadow-lg shadow-amber-500/5'
                : 'bg-brand-purple/10 border border-brand-purple/20 shadow-lg shadow-brand-purple/5'
            }`}
          />

          {/* Central Text Metrics */}
          <div className="z-10 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold uppercase tracking-wider ${getPhaseColorClass()} transition-colors duration-300`}>
              {phase}
            </span>
            <span className="text-4xl font-bold text-gray-800 mt-1">
              {seconds}s
            </span>
          </div>
        </div>

        {/* Real-time description instruction */}
        <div className="min-h-[40px] flex items-center justify-center px-4 mb-6">
          <p className="text-sm font-semibold text-gray-500 italic">
            {getInstructions()}
          </p>
        </div>

        {/* Control Button */}
        <button
          onClick={handleStartStop}
          className={`px-8 py-3.5 rounded-full text-sm font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer ${
            isRunning 
              ? 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg active:scale-98' 
              : 'bg-brand-teal hover:bg-brand-teal/90 hover:shadow-lg active:scale-98'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4 fill-white" />
              Stop Timer
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Start Exercise
            </>
          )}
        </button>
      </div>
    </div>
  );
}
