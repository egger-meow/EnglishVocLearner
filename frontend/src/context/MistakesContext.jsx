// frontend/src/context/MistakesContext.jsx

import React, { createContext, useState, useEffect } from 'react';

// We'll store each mistake as an object like:
// { word: string, translation: string, level: string, missCount: number }

export const MistakesContext = createContext();

export function MistakesProvider({ children }) {
  const [mistakes, setMistakes] = useState([]);

  // OPTIONAL: If you want to persist across browser refreshes, load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mistakes');
    if (stored) {
      setMistakes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  function addMistake(word, translation, level) {
    setMistakes((prev) => {
      const existing = prev.find(
        (m) => m.word === word && m.translation === translation
      );
      if (existing) {
        // increment missCount
        return prev.map((m) =>
          m.word === word && m.translation === translation
            ? { ...m, missCount: m.missCount + 1 }
            : m
        );
      } else {
        return [
          ...prev,
          { word, translation, level, missCount: 1 },
        ];
      }
    });
  }

  // Maybe also let user remove mistakes, or clear them
  function clearMistakes() {
    setMistakes([]);
  }

  return (
    <MistakesContext.Provider value={{ mistakes, addMistake, clearMistakes }}>
      {children}
    </MistakesContext.Provider>
  );
}
