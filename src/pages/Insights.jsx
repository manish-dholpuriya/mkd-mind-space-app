import { useState, useEffect } from 'react';
import { Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { getEntries, getTips } from '../utils/storage';

const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const calculateStreakFromEntries = (entries) => {
  if (!entries || entries.length === 0) return 0;

  const dates = entries.map(e => getLocalDateString(e.createdAt));
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let currentStreak = 0;
  let checkDate = new Date();
  
  if (uniqueDates[0] === yesterdayStr) {
    checkDate = yesterday;
  }

  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return currentStreak;
};

const getWeeklyMapFromEntries = (entries) => {
  const map = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    
    // Filter entries for this local date
    const dayEntries = entries.filter((e) => getLocalDateString(e.createdAt) === dateStr);
    // Grab the last entry of the day
    const lastEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;

    map.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr,
      hasEntry: !!lastEntry,
      moodEmoji: lastEntry ? lastEntry.mood : null,
    });
  }
  return map;
};

const getStatsFromEntries = (entries) => {
  const total = entries.length;
  const totalStress = entries.reduce((sum, e) => sum + (e.stress || 0), 0);
  const avgStress = total > 0 ? (totalStress / total).toFixed(1) : '0.0';
  const streak = calculateStreakFromEntries(entries);
  return { total, avgStress, streak };
};

export default function Insights({ activeTab }) {
  // Initialize state directly from storage values on mount to prevent layout flashes
  const [entries, setEntries] = useState(() => getEntries());
  const [stats, setStats] = useState(() => getStatsFromEntries(getEntries()));
  const [weeklyMap, setWeeklyMap] = useState(() => getWeeklyMapFromEntries(getEntries()));
  const [recentTips, setRecentTips] = useState(() => {
    const tips = getTips();
    const sortedTips = [...tips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sortedTips.slice(0, 5);
  });
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (activeTab !== 'insights') return;

    const currentEntries = getEntries();
    const tips = getTips();

    setEntries(currentEntries);
    setStats(getStatsFromEntries(currentEntries));
    setWeeklyMap(getWeeklyMapFromEntries(currentEntries));
    
    const sortedTips = [...tips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setRecentTips(sortedTips.slice(0, 5));
  }, [activeTab]);

  const toggleExpandTip = (id) => {
    setExpandedTipId((prev) => (prev === id ? null : id));
  };

  const formatTipDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get last 7 entries for stress trend chart
  const trendEntries = entries.slice(-7);
  
  // Calculate SVG points coordinates
  const points = trendEntries.map((entry, idx) => {
    const n = trendEntries.length;
    // X maps from 40 (padding left) to 460 (padding right)
    const x = 40 + idx * (420 / (n - 1));
    // Y maps stress 1-10 to 140 (low stress) down to 30 (high stress)
    const y = 140 - ((entry.stress - 1) / 9) * 110;
    
    return {
      idx,
      x,
      y,
      stress: entry.stress,
      date: new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between">
          <span className="text-lg sm:text-[22px] font-semibold text-gray-900 leading-tight">
            {stats.total}
          </span>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Total Entries
          </span>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between">
          <span className="text-lg sm:text-[22px] font-semibold text-gray-900 leading-tight">
            {stats.avgStress}
          </span>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Avg Stress
          </span>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-100/50 flex flex-col justify-between">
          <span className="text-lg sm:text-[22px] font-semibold text-gray-900 leading-tight">
            🔥 {stats.streak}
          </span>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Day Streak
          </span>
        </div>
      </div>

      {/* 7-Day Emotional Map */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">This week's emotional map</h3>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeklyMap.map((day) => (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                day.hasEntry
                  ? 'bg-[--color-brand-teal]/5 border-[--color-brand-teal]/20 text-[--color-brand-teal]'
                  : 'bg-white border-gray-100 text-gray-300'
              }`}
            >
              <span className="text-lg sm:text-xl h-6 sm:h-7 flex items-center justify-center">
                {day.hasEntry ? day.moodEmoji : '•'}
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                {day.dayName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stress Trend Chart */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">Stress trend — last 7 entries</h3>
        {trendEntries.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 rounded-2xl bg-white text-center">
            <p className="text-xs text-gray-400 font-semibold max-w-[280px]">
              Log at least 2 check-ins to see your stress trend.
            </p>
          </div>
        ) : (
          <div className="relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            
            {/* Tooltip Overlay */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(hoveredPoint.x / 500) * 100}%`,
                  top: `${(hoveredPoint.y / 180) * 100 - 20}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md pointer-events-none z-10 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 flex flex-col items-center gap-0.5"
              >
                <span>Stress: {hoveredPoint.stress}/10</span>
                <span className="text-[8px] text-gray-400">{hoveredPoint.date}</span>
                <div className="w-1.5 h-1.5 bg-gray-800 rotate-45 absolute -bottom-0.75 left-1/2 -translate-x-1/2" />
              </div>
            )}

            <svg
              viewBox="0 0 500 180"
              className="w-full h-auto"
            >
              {/* Grid Lines */}
              {[1, 3, 5, 7, 10].map((level) => {
                const y = 140 - ((level - 1) / 9) * 110;
                return (
                  <g key={level}>
                    <line
                      x1="40"
                      y1={y}
                      x2="470"
                      y2={y}
                      stroke="#f3f4f6"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="25"
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[9px] fill-gray-400 font-bold"
                    >
                      {level}
                    </text>
                  </g>
                );
              })}

              {/* Polyline path */}
              <polyline
                fill="none"
                stroke="var(--color-brand-teal)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
                className="opacity-90"
              />

              {/* Data points */}
              {points.map((p) => (
                <circle
                  key={p.idx}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  className="fill-white stroke-[--color-brand-teal] stroke-[3px] hover:r-6 hover:fill-[--color-brand-teal] transition-all cursor-pointer duration-150"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* X Axis Labels */}
              {points.map((p) => (
                <text
                  key={p.idx}
                  x={p.x}
                  y="166"
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400 font-bold"
                >
                  #{p.idx + 1}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Saved Insights Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Saved Insights</h3>
        {recentTips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl text-center space-y-3 bg-white animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[--color-brand-teal]">
              <Leaf className="w-6 h-6 text-[--color-brand-teal]" />
            </div>
            <p className="text-sm text-gray-500 font-semibold max-w-[280px]">
              Complete your first check-in to unlock personalized insights.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTips.map((tip) => {
              const isExpanded = expandedTipId === tip.id;
              const textPreview = tip.aiResponse
                ? tip.aiResponse.slice(0, 200) + (tip.aiResponse.length > 200 ? '...' : '')
                : '';

              return (
                <div
                  key={tip.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 border-l-[3px] border-l-[--color-brand-teal] shadow-sm flex flex-col space-y-2 text-left"
                >
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400">
                    <span>{formatTipDate(tip.createdAt)}</span>
                    <span className="uppercase text-[--color-brand-teal] tracking-wider font-bold">
                      Insight
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {isExpanded ? tip.aiResponse : textPreview}
                  </div>

                  {tip.aiResponse && tip.aiResponse.length > 200 && (
                    <button
                      onClick={() => toggleExpandTip(tip.id)}
                      className="text-xs font-bold text-[--color-brand-teal] self-start flex items-center gap-1 hover:underline cursor-pointer pt-1"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Read full insight <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
