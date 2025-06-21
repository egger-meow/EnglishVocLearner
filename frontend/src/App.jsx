// frontend/src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MistakesProvider } from './context/MistakesContext';
import { StatsProvider } from './context/StatsContext';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LevelSelect from './components/LevelSelect/LevelSelect';
import ModeSelection from './components/ModeSelect/ModeSelect';
import Quiz from './components/Quiz/Quiz';
import MistakesList from './components/Mistakes/MistakesList';
import AuthModal from './components/Auth/AuthModal';
import UserStats from './components/UserStats/UserStats';

import 'bootstrap/dist/css/bootstrap.min.css';

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

function MainApp() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [showMistakes, setShowMistakes] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const handleOpenAuthModal = () => {
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
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
        onOpenAuthModal={handleOpenAuthModal}
      />

      <div style={{ flex: 1 }}>
        {showMistakes ? (
          <MistakesList standalone={false} />
        ) : !selectedLevel ? (
          <LevelSelect 
            onLevelSelect={handleLevelSelect} 
            onOpenAuthModal={handleOpenAuthModal}
          />
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

      <AuthModal 
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal} 
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MistakesProvider>
        <StatsProvider>
          <Router>
            <Routes>
              <Route path="/" element={<MainApp />} />
              <Route path="/stats" element={<UserStats />} />
              <Route path="/mistakes" element={<MistakesList standalone={true} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </StatsProvider>
      </MistakesProvider>
    </AuthProvider>
  );
}

export default App;
