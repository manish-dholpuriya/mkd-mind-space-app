import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useStreak } from './hooks/useStreak';
import CheckIn from './pages/CheckIn';
import Insights from './pages/Insights';
import Chat from './pages/Chat';

const TABS = [
  { id: 'check-in', label: 'Daily check-in', shortLabel: 'Check-in', icon: '📝' },
  { id: 'insights', label: 'Insights', shortLabel: 'Insights', icon: '📊' },
  { id: 'ai-companion', label: 'AI companion', shortLabel: 'Chat', icon: '💬' },
];

function App() {
  const [activeTab, setActiveTab] = useState('check-in');
  const { streak, recalculateStreak } = useStreak();

  // Sliding pill indicator
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setPillStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900">
      <div className="w-full max-w-[680px] bg-white min-h-screen shadow-sm flex flex-col relative">

        
        {/* Glassmorphism Header */}
        <header className="px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-gray-100/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-emerald-400 flex items-center justify-center shadow-md shadow-brand-teal/20">
              <Heart className="w-5 h-5 text-white fill-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 leading-tight">MindSpace</h1>
              <p className="text-[11px] text-gray-400 font-semibold tracking-wide">Your exam wellness companion</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 rounded-full border border-amber-200/40 shadow-sm select-none ${
              streak > 0 ? 'animate-pulseGlow' : ''
            }`}
            aria-label={`${streak} day streak`}
          >
            <span className="text-sm" aria-hidden="true">🔥</span>
            <span className="text-sm font-bold text-amber-700">{streak} day streak</span>
          </div>
        </header>

        {/* Gradient Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-teal/15 to-transparent" aria-hidden="true" />

        {/* Navigation Tabs with ARIA */}
        <nav
          className="px-6 pt-2.5 bg-white flex gap-5 overflow-x-auto scrollbar-hide relative"
          role="tablist"
          aria-label="Main navigation"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap relative cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-brand-teal'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-[13px]" aria-hidden="true">{tab.icon}</span>
                <span className="hidden min-[400px]:inline">{tab.label}</span>
                <span className="inline min-[400px]:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}

          {/* Sliding Pill Indicator */}
          <div
            className="absolute bottom-0 h-[2.5px] bg-brand-teal rounded-full transition-all duration-300 ease-out"
            style={{ left: pillStyle.left, width: pillStyle.width }}
            aria-hidden="true"
          />
        </nav>

        {/* Tab border */}
        <div className="h-px bg-gray-100" aria-hidden="true" />

        {/* Main Content Area */}
        <main id="main-content" tabIndex="-1" className="flex-1 p-6 bg-white overflow-y-auto outline-none">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              hidden={activeTab !== tab.id}
            >
              {tab.id === 'check-in' && activeTab === 'check-in' && (
                <CheckIn onEntryAdded={recalculateStreak} />
              )}
              {tab.id === 'insights' && activeTab === 'insights' && (
                <Insights activeTab={activeTab} />
              )}
              {tab.id === 'ai-companion' && activeTab === 'ai-companion' && (
                <Chat />
              )}
            </div>
          ))}
        </main>
        
      </div>
    </div>
  );
}

export default App;
