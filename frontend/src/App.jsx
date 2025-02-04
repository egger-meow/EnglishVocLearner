// frontend/src/App.jsx

import React, { useState } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LevelSelect from './components/LevelSelect/LevelSelect';
import ModeSelection from './components/ModeSelect/ModeSelect'; // <== new import
import Quiz from './components/Quiz/Quiz';
import MistakesList from './components/Mistakes/MistakesList';

function getCurrentPage(selectedLevel, selectedMode, showMistakes) {
  if (showMistakes) {
    return 'mistakes';
  } else if (!selectedLevel) {
    return 'levelSelect';
  } else if (!selectedMode) {
    return 'modeSelect';
  } else {
    return 'quiz';
  }
}

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [showMistakes, setShowMistakes] = useState(false);

  // ============== HANDLERS ==============

  // Called by LevelSelect when a user picks a level
  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
    setSelectedMode(null); // reset any previous mode
    setShowMistakes(false);
  };

  // Called by ModeSelection when user picks mode
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  // From Quiz or ModeSelection "Back" => reset level + mode
  const handleBackToLevel = () => {
    setSelectedLevel(null);
    setSelectedMode(null);
  };

  // ====== Nav Link Handlers (passed to Header) ======
  const handleNavHome = () => {
    setShowMistakes(false);
    setSelectedLevel(null);
    setSelectedMode(null);
  };

  // If user wants to see the quiz. If a quiz is in progress (level+mode selected),
  // we simply hide mistakes page. Otherwise, do nothing special => user sees level select
  const handleNavResumeQuiz = () => {
    setShowMistakes(false);
  };

  const handleNavMistakes = () => {
    setShowMistakes(true);
  };

  const currentPage = getCurrentPage(selectedLevel, selectedMode, showMistakes);

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
        onNavResumeQuiz={handleNavResumeQuiz}
        onNavMistakes={handleNavMistakes}
      />

      <div style={{ flex: 1 }}>
        {showMistakes ? (
          <MistakesList />
        ) : !selectedLevel ? (
          <LevelSelect onLevelSelect={handleLevelSelect} />
        ) : !selectedMode ? (
          <ModeSelection 
            level={selectedLevel}
            onSelectMode={handleModeSelect}
            onBack={handleBackToLevel}
          />
        ) : (
          <Quiz 
            level={selectedLevel} 
            mode={selectedMode}
            onBack={handleBackToLevel}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;
