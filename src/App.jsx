import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useStreak } from './hooks/useStreak';
import CheckIn from './pages/CheckIn';
import Insights from './pages/Insights';
import Chat from './pages/Chat';

const TABS = [
  { id: 'check-in', label: 'Daily check-in' },
  { id: 'insights', label: 'Insights' },
  { id: 'ai-companion', label: 'AI companion' },
];

function App() {
  const [activeTab, setActiveTab] = useState('check-in');
  const { streak, recalculateStreak } = useStreak();

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900 font-sans">
      <div className="w-full max-w-[680px] bg-white min-h-screen shadow-sm flex flex-col relative">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[--color-brand-teal] flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">MindSpace</h1>
              <p className="text-xs text-gray-500 font-medium">Your exam wellness companion</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100/50 shadow-sm">
            <span className="text-sm">🔥</span>
            <span className="text-sm font-semibold text-amber-700">{streak} day streak</span>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="px-6 pt-2 bg-white border-b border-gray-100 flex gap-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap relative cursor-pointer ${
                  isActive 
                    ? 'text-[--color-brand-teal]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.id === 'check-in' && (
                  <>
                    <span className="hidden min-[400px]:inline">Daily check-in</span>
                    <span className="inline min-[400px]:hidden">Check-in</span>
                  </>
                )}
                {tab.id === 'insights' && (
                  <span>Insights</span>
                )}
                {tab.id === 'ai-companion' && (
                  <>
                    <span className="hidden min-[400px]:inline">AI companion</span>
                    <span className="inline min-[400px]:hidden">Chat</span>
                  </>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--color-brand-teal] rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-white overflow-y-auto">
          {activeTab === 'check-in' && (
            <CheckIn onEntryAdded={recalculateStreak} />
          )}
          
          {activeTab === 'insights' && (
            <Insights activeTab={activeTab} />
          )}
          
          {activeTab === 'ai-companion' && (
            <Chat />
          )}
        </main>
        
      </div>
    </div>
  );
}

export default App;
