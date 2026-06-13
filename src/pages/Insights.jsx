import { useState, useEffect, useRef } from 'react';
import { Leaf, ChevronDown, ChevronUp, TrendingUp, BarChart3, Flame, Download } from 'lucide-react';
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

  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let currentStreak = 0;
  let checkDate = new Date();
  if (uniqueDates[0] === yesterdayStr) checkDate = yesterday;

  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (uniqueDates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return currentStreak;
};

const getWeeklyMapFromEntries = (entries) => {
  const map = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayEntries = entries.filter((e) => getLocalDateString(e.createdAt) === dateStr);
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

// Animated counter hook
function useAnimatedNumber(target, duration = 600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const num = typeof target === 'string' ? parseFloat(target) : target;
    if (isNaN(num)) {
      const timer = setTimeout(() => setValue(0), 0);
      return () => clearTimeout(timer);
    }

    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * num);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

function AnimatedStat({ value, decimals = 0, prefix = '', suffix = '' }) {
  const animated = useAnimatedNumber(value);
  return <>{prefix}{animated.toFixed(decimals)}{suffix}</>;
}

export default function Insights({ activeTab }) {
  const [entries, setEntries] = useState(() => getEntries());
  const [stats, setStats] = useState(() => getStatsFromEntries(getEntries()));
  const [weeklyMap, setWeeklyMap] = useState(() => getWeeklyMapFromEntries(getEntries()));
  const [recentTips, setRecentTips] = useState(() => {
    const tips = getTips();
    return [...tips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  });
  const [expandedTipId, setExpandedTipId] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (activeTab !== 'insights') return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        const currentEntries = getEntries();
        const tips = getTips();
        setEntries(currentEntries);
        setStats(getStatsFromEntries(currentEntries));
        setWeeklyMap(getWeeklyMapFromEntries(currentEntries));
        setRecentTips([...tips].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeTab]);

  const toggleExpandTip = (id) => setExpandedTipId((prev) => (prev === id ? null : id));

  const formatTipDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getStressIndicatorColor = () => {
    const avg = parseFloat(stats.avgStress);
    if (avg < 4) return 'text-emerald-600';
    if (avg <= 7) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Stress trend chart
  const trendEntries = entries.slice(-7);
  const points = trendEntries.map((entry, idx) => {
    const n = trendEntries.length;
    const x = n === 1 ? 250 : 40 + idx * (420 / (n - 1));
    const y = 140 - ((entry.stress - 1) / 9) * 110;
    return {
      idx, x, y,
      stress: entry.stress,
      date: new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  });
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient area fill path
  const areaPath = points.length >= 2
    ? `M ${points[0].x},140 ` + points.map((p) => `L ${p.x},${p.y}`).join(' ') + ` L ${points[points.length - 1].x},140 Z`
    : '';

  const handleExportJSON = () => {
    if (!entries || entries.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mindspace_wellness_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      {/* Top Heading & Export utility */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-brand-teal/5 to-transparent p-4 rounded-2xl border border-brand-teal/10">
        <div>
          <h2 className="text-sm font-extrabold text-gray-800 tracking-tight">Your Progress & Insights</h2>
          <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Track trends, view history, and export data</p>
        </div>
        <button
          onClick={handleExportJSON}
          disabled={entries.length === 0}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            entries.length === 0
              ? 'bg-gray-100 text-gray-300 border border-gray-100 cursor-not-allowed'
              : 'bg-white hover:bg-gray-50 text-brand-teal border border-brand-teal/20 hover:border-brand-teal/30 hover:shadow-sm'
          }`}
          aria-label="Export wellness entries to JSON file"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Export logs (JSON)</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100/60 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-[22px] font-bold text-gray-900 leading-tight animate-countUp">
              <AnimatedStat value={stats.total} />
            </span>
            <BarChart3 className="w-4 h-4 text-brand-teal/40" aria-hidden="true" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Total Entries
          </span>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100/60 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className={`text-lg sm:text-[22px] font-bold leading-tight animate-countUp ${getStressIndicatorColor()}`}>
              <AnimatedStat value={stats.avgStress} decimals={1} />
            </span>
            <TrendingUp className="w-4 h-4 text-amber-400/50" aria-hidden="true" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Avg Stress
          </span>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-100/60 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-[22px] font-bold text-gray-900 leading-tight animate-countUp">
              <AnimatedStat value={stats.streak} prefix="🔥 " />
            </span>
            <Flame className="w-4 h-4 text-amber-400/50" aria-hidden="true" />
          </div>
          <span className="text-[9px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5">
            Day Streak
          </span>
        </div>
      </div>

      {/* 7-Day Emotional Map */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-700">This week's emotional map</h3>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeklyMap.map((day, i) => (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all animate-fadeInUp ${
                day.hasEntry
                  ? 'bg-brand-teal/5 border-brand-teal/20 text-brand-teal'
                  : 'bg-white border-gray-100 text-gray-300'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
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
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-white text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gray-300" aria-hidden="true" />
            </div>
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
                  top: `${(hoveredPoint.y / 180) * 100 - 18}%`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap flex flex-col items-center gap-0.5"
              >
                <span>Stress: {hoveredPoint.stress}/10</span>
                <span className="text-[8px] text-gray-400">{hoveredPoint.date}</span>
              </div>
            )}

            <svg viewBox="0 0 500 180" className="w-full h-auto" role="img" aria-label="Stress trend chart showing last 7 entries">
              {/* Grid Lines */}
              {[1, 3, 5, 7, 10].map((level) => {
                const y = 140 - ((level - 1) / 9) * 110;
                return (
                  <g key={level}>
                    <line x1="40" y1={y} x2="470" y2={y} stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="25" y={y + 3.5} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">{level}</text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-teal)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="var(--color-brand-teal)" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

              {/* Polyline */}
              <polyline
                fill="none"
                stroke="var(--color-brand-teal)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Data points */}
              {points.map((p) => (
                <circle
                  key={p.idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.idx === p.idx ? 7 : 5}
                  fill={hoveredPoint?.idx === p.idx ? 'var(--color-brand-teal)' : 'white'}
                  stroke="var(--color-brand-teal)"
                  strokeWidth="2.5"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* X Axis Labels */}
              {points.map((p) => (
                <text key={p.idx} x={p.x} y="166" textAnchor="middle" className="text-[9px] fill-gray-400 font-bold">
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
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl text-center space-y-3 bg-white animate-fadeInUp">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-50 to-brand-teal/10 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-brand-teal" aria-hidden="true" />
            </div>
            <p className="text-sm text-gray-500 font-semibold max-w-[280px]">
              Complete your first check-in to unlock personalized insights.
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              Your AI-powered wellness analysis will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTips.map((tip, i) => {
              const isExpanded = expandedTipId === tip.id;
              const textPreview = tip.aiResponse
                ? tip.aiResponse.slice(0, 200) + (tip.aiResponse.length > 200 ? '...' : '')
                : '';

              return (
                <div
                  key={tip.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 border-l-[3px] border-l-brand-teal shadow-sm flex flex-col space-y-2 text-left animate-fadeInUp"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400">
                    <span>{formatTipDate(tip.createdAt)}</span>
                    <span className="uppercase text-brand-teal tracking-wider font-bold">Insight</span>
                  </div>

                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {isExpanded ? tip.aiResponse : textPreview}
                  </div>

                  {tip.aiResponse && tip.aiResponse.length > 200 && (
                    <button
                      onClick={() => toggleExpandTip(tip.id)}
                      className="text-xs font-bold text-brand-teal self-start flex items-center gap-1 hover:underline cursor-pointer pt-1"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>Show less <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /></>
                      ) : (
                        <>Read full insight <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" /></>
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
