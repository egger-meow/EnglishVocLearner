// frontend/src/App.jsx

import React, { useState } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LevelSelect from './components/LevelSelect/LevelSelect';
import Quiz from './components/Quiz/Quiz';

// Suppose you have a MistakesList component:
import MistakesList from './components/Mistakes/MistakesList';

function getCurrentPage(selectedLevel, showMistakes) {
  if (showMistakes) return 'mistakes';
  if (selectedLevel === null && !showMistakes) return 'levelSelect';
  if (selectedLevel !== null) return 'quiz';
}

function App() {
  // If this is set, user is in a quiz
  const [selectedLevel, setSelectedLevel] = useState(null);

  // If true, show the mistakes page
  const [showMistakes, setShowMistakes] = useState(false);

  // ============== HANDLERS ==============

  // Called by LevelSelect when a user picks a level
  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setShowMistakes(false);
  };

  // Called by Quiz's "Back to Levels" button
  const handleBack = () => {
    setSelectedLevel(null);
  };

  // ====== Nav Link Handlers (passed to Header) ======

  // Home means go to LevelSelect (no quiz, no mistakes list)
  const handleNavHome = () => {
    setShowMistakes(false);
    setSelectedLevel(null);
  };

  // Start/Resume Quiz:
  // - If we already have selectedLevel, we just hide mistakes (return to quiz).
  // - If not, we go to the LevelSelect page so user can pick a level.
  const handleNavQuiz = () => {
    setShowMistakes(false);
    // If no quiz in progress, do nothing special; user sees level select
    // If we do want to auto-show the quiz if there's a selectedLevel, that's fine.
  };

  // Show mistakes page
  const handleNavMistakes = () => {
    setShowMistakes(true);
  };

  const currentPage = getCurrentPage(selectedLevel, showMistakes);

  // ============== RENDER ==============
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Header
        currentPage={currentPage}
        selectedLevel={selectedLevel}
        onNavHome={handleNavHome}
        onNavResumeQuiz={handleNavQuiz}
        onNavMistakes={handleNavMistakes}
      />

      <div style={{ flex: 1 }}>
        {showMistakes ? (
          // If we're showing mistakes page:
          <MistakesList />

        ) : selectedLevel ? (
          // If the user is in a quiz
          <Quiz level={selectedLevel} onBack={handleBack} />
        ) : (
          // Otherwise we show the level selection
          <LevelSelect onLevelSelect={handleLevelSelect} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;
