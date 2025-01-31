// frontend/src/context/StatsContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const StatsContext = createContext();

/**
 * For each level: { [levelName]: { attempted, correct, sumTime } }
 */
export function StatsProvider({ children }) {
  const [stats, setStats] = useState({});

  // Optional: persist in localStorage if you want it saved across refreshes
  useEffect(() => {
    const stored = localStorage.getItem('stats');
    if (stored) {
      setStats(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stats', JSON.stringify(stats));
  }, [stats]);

  function recordAnswer(level, wasCorrect, timeSpent) {
    setStats((prev) => {
      const old = prev[level] || { attempted: 0, correct: 0, sumTime: 0 };
      return {
        ...prev,
        [level]: {
          attempted: old.attempted + 1,
          correct: old.correct + (wasCorrect ? 1 : 0),
          sumTime: old.sumTime + timeSpent,
        }
      };
    });
  }

  // Convenience function to get average time
  function getAverageTime(level) {
    const s = stats[level];
    if (!s || s.attempted === 0) return 0;
    return s.sumTime / s.attempted;
  }

  // Correction rate: e.g. 75% if 3 out of 4
  function getCorrectionRate(level) {
    const s = stats[level];
    if (!s || s.attempted === 0) return 0;
    return (s.correct / s.attempted) * 100;
  }

  function getAttempted(level) {
    const s = stats[level];
    if (!s) return 0;
    return s.attempted;
  }

  function getGlobalAverageTime() {
    let totalAttempts = 0;
    let totalTime = 0;
    for (const level in stats) {
      totalAttempts += stats[level].attempted;
      totalTime += stats[level].sumTime;
    }
    return totalAttempts.toFixed(2) ? (totalTime / totalAttempts) : 0;
  }
  

  return (
    <StatsContext.Provider value={{ stats, recordAnswer, getAverageTime, getCorrectionRate, getGlobalAverageTime, getAttempted }}>
      {children}
    </StatsContext.Provider>
  );


}

