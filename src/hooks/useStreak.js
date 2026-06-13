import { useState, useEffect, useCallback } from 'react';
import { getEntries } from '../utils/storage';

const getLocalDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStreak = () => {
  const [streak, setStreak] = useState(0);

  const calculateStreak = useCallback(() => {
    const entries = getEntries();
    if (!entries || entries.length === 0) {
      setStreak(0);
      return;
    }

    const dates = entries.map(e => getLocalDateString(e.createdAt));
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      setStreak(0);
      return;
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

    setStreak(currentStreak);
  }, []);

  useEffect(() => {
    calculateStreak();
    window.addEventListener('mindspace_storage_update', calculateStreak);
    return () => {
      window.removeEventListener('mindspace_storage_update', calculateStreak);
    };
  }, [calculateStreak]);

  return { streak, recalculateStreak: calculateStreak };
};
